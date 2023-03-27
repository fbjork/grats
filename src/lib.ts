import {
  buildASTSchema,
  DefinitionNode,
  GraphQLSchema,
  isAbstractType,
  isType,
  Kind,
  validateSchema,
} from "graphql";
import {
  ok,
  err,
  graphQlErrorToDiagnostic,
  DiagnosticsResult,
  Result,
  ReportableDiagnostics,
  diagnosticAtGraphQLLocation,
} from "./utils/DiagnosticError";
import * as ts from "typescript";
import { Extractor } from "./Extractor";
import { TypeContext } from "./TypeContext";
import { validateSDL } from "graphql/validation/validate";
import { applyServerDirectives, DIRECTIVES_AST } from "./serverDirectives";

export { applyServerDirectives } from "./serverDirectives";

export type ConfigOptions = {
  // Should all fields be typed as nullable in accordance with GraphQL best practices?
  // https://graphql.org/learn/best-practices/#nullability
  nullableByDefault?: boolean;
};

export type GratsOptions = {
  configOptions: ConfigOptions;
  tsCompilerOptions: ts.CompilerOptions;
  files: string[];
};

// Construct a schema, using GraphQL schema language
// Exported for tests that want to intercept diagnostic errors.
export function buildSchemaResult(
  options: GratsOptions,
): Result<GraphQLSchema, ReportableDiagnostics> {
  // https://stackoverflow.com/a/66604532/1263117
  const compilerHost = ts.createCompilerHost(
    options.tsCompilerOptions,
    /* setParentNodes this is needed for finding jsDocs */
    true,
  );

  return buildSchemaResultWithHost(options, compilerHost);
}

export function buildSchemaResultWithHost(
  options: GratsOptions,
  compilerHost: ts.CompilerHost,
): Result<GraphQLSchema, ReportableDiagnostics> {
  const schemaResult = definitionsFromFile(options, compilerHost);
  if (schemaResult.kind === "ERROR") {
    return err(new ReportableDiagnostics(compilerHost, schemaResult.err));
  }

  return ok(applyServerDirectives(schemaResult.value));
}

function definitionsFromFile(
  options: GratsOptions,
  host: ts.CompilerHost,
): DiagnosticsResult<GraphQLSchema> {
  const program = ts.createProgram(
    options.files,
    options.tsCompilerOptions,
    host,
  );
  const checker = program.getTypeChecker();
  const ctx = new TypeContext(checker, host);

  const definitions: DefinitionNode[] = Array.from(DIRECTIVES_AST.definitions);
  for (const sourceFile of program.getSourceFiles()) {
    // If the file doesn't contain any GraphQL definitions, skip it.
    if (!/@GQL/.test(sourceFile.text)) {
      continue;
    }

    const extractor = new Extractor(sourceFile, ctx, options.configOptions);
    const extractedResult = extractor.extract();
    if (extractedResult.kind === "ERROR") return extractedResult;
    for (const definition of extractedResult.value) {
      definitions.push(definition);
    }
  }

  const docResult = ctx.resolveTypes({ kind: Kind.DOCUMENT, definitions });
  if (docResult.kind === "ERROR") return docResult;

  const doc = docResult.value;

  // TODO: Currently this does not detect definitions that shadow builtins
  // (`String`, `Int`, etc). However, if we pass a second param (extending an
  // existing schema) we do! So, we should find a way to validate that we don't
  // shadow builtins.
  const validationErrors = validateSDL(doc).map((e) => {
    return graphQlErrorToDiagnostic(e);
  });
  if (validationErrors.length > 0) {
    return err(validationErrors);
  }
  const schema = buildASTSchema(doc, { assumeValidSDL: true });

  const diagnostics = validateSchema(schema)
    // FIXME: Handle case where query is not defined (no location)
    .filter((e) => e.source && e.locations && e.positions)
    .map((e) => graphQlErrorToDiagnostic(e));

  if (diagnostics.length > 0) {
    return err(diagnostics);
  }

  const typenameDiagnostics = validateTypename(schema, ctx);
  if (typenameDiagnostics.length > 0) return err(typenameDiagnostics);

  return ok(schema);
}

function validateTypename(
  schema: GraphQLSchema,
  ctx: TypeContext,
): ts.Diagnostic[] {
  const typenameDiagnostics: ts.Diagnostic[] = [];
  const abstractTypes = Object.values(schema.getTypeMap()).filter(
    isAbstractType,
  );
  for (const type of abstractTypes) {
    // TODO: If we already implement resolveType, we don't need to check implementors

    const typeImplementors = schema.getPossibleTypes(type).filter(isType);
    for (const implementor of typeImplementors) {
      if (!ctx.hasTypename.has(implementor.name)) {
        const loc = implementor.astNode?.name?.loc;
        if (loc == null) {
          throw new Error(
            `Grats expected the parsed type \`${implementor.name}\` to have location information. This is a bug in Grats. Please report it.`,
          );
        }
        typenameDiagnostics.push(
          diagnosticAtGraphQLLocation(
            `Missing __typename on \`${implementor.name}\`. The type \`${type.name}\` is used in a union or interface, so it must have a \`__typename\` field.`,
            loc,
          ),
        );
      }
    }
  }
  return typenameDiagnostics;
}