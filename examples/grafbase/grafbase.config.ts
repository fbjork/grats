import { graph, config } from "@grafbase/sdk";
import { getSchema } from "./schema";

const g = graph.Standalone({
  schema: getSchema()
});

export default config({
  graph: g,
  auth: {
    rules: (rules) => {
      rules.public();
    },
  },
});
