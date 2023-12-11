/**
 * Executable schema generated by Grats (https://grats.capt.dev)
 * Do not manually edit. Regenerate by running `npx grats`.
 */
import { allUsers as queryAllUsersResolver } from "./SchemaImpl";
import { me as queryMeResolver } from "./SchemaImpl";
import { person as queryPersonResolver } from "./SchemaImpl";
import { userById as queryUserByIdResolver } from "./SchemaImpl";
import { addUser as mutationAddUserResolver } from "./SchemaImpl";
import { removeUser as mutationRemoveUserResolver } from "./SchemaImpl";
import { updateUser as mutationUpdateUserResolver } from "./SchemaImpl";
import { GraphQLSchema, GraphQLObjectType, GraphQLNonNull, GraphQLList, GraphQLString, GraphQLInterfaceType, GraphQLInputObjectType } from "graphql";
const GroupType: GraphQLObjectType = new GraphQLObjectType({
    name: "Group",
    fields() {
        return {
            id: {
                name: "id",
                type: new GraphQLNonNull(GraphQLString)
            },
            members: {
                name: "members",
                type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(UserType)))
            },
            name: {
                name: "name",
                type: new GraphQLNonNull(GraphQLString)
            }
        };
    }
});
const IPersonType: GraphQLInterfaceType = new GraphQLInterfaceType({
    name: "IPerson",
    fields() {
        return {
            name: {
                name: "name",
                type: new GraphQLNonNull(GraphQLString)
            }
        };
    }
});
const UserType: GraphQLObjectType = new GraphQLObjectType({
    name: "User",
    fields() {
        return {
            groups: {
                name: "groups",
                type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GroupType)))
            },
            id: {
                name: "id",
                type: new GraphQLNonNull(GraphQLString)
            },
            name: {
                name: "name",
                type: new GraphQLNonNull(GraphQLString)
            }
        };
    },
    interfaces() {
        return [IPersonType];
    }
});
const QueryType: GraphQLObjectType = new GraphQLObjectType({
    name: "Query",
    fields() {
        return {
            allUsers: {
                name: "allUsers",
                type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(UserType))),
                resolve(source, args, context) {
                    return queryAllUsersResolver(source, args, context);
                }
            },
            me: {
                name: "me",
                type: new GraphQLNonNull(UserType),
                resolve(source, args, context) {
                    return queryMeResolver(source, args, context);
                }
            },
            person: {
                name: "person",
                type: new GraphQLNonNull(IPersonType),
                resolve(source, args, context) {
                    return queryPersonResolver(source, args, context);
                }
            },
            userById: {
                name: "userById",
                type: new GraphQLNonNull(UserType),
                args: {
                    id: {
                        name: "id",
                        type: new GraphQLNonNull(GraphQLString)
                    }
                },
                resolve(source, args, context) {
                    return queryUserByIdResolver(source, args, context);
                }
            }
        };
    }
});
const UserDataInputType: GraphQLInputObjectType = new GraphQLInputObjectType({
    name: "UserDataInput",
    fields() {
        return {
            groupIDs: {
                name: "groupIDs",
                type: new GraphQLList(new GraphQLNonNull(GraphQLString))
            },
            name: {
                name: "name",
                type: new GraphQLNonNull(GraphQLString)
            }
        };
    }
});
const MutationType: GraphQLObjectType = new GraphQLObjectType({
    name: "Mutation",
    fields() {
        return {
            addUser: {
                name: "addUser",
                type: new GraphQLNonNull(UserType),
                args: {
                    userData: {
                        name: "userData",
                        type: new GraphQLNonNull(UserDataInputType)
                    }
                },
                resolve(source, args, context) {
                    return mutationAddUserResolver(source, args, context);
                }
            },
            removeUser: {
                name: "removeUser",
                type: new GraphQLNonNull(GraphQLString),
                args: {
                    id: {
                        name: "id",
                        type: new GraphQLNonNull(GraphQLString)
                    }
                },
                resolve(source, args, context) {
                    return mutationRemoveUserResolver(source, args, context);
                }
            },
            updateUser: {
                name: "updateUser",
                type: new GraphQLNonNull(UserType),
                args: {
                    id: {
                        name: "id",
                        type: new GraphQLNonNull(GraphQLString)
                    },
                    userData: {
                        name: "userData",
                        type: new GraphQLNonNull(UserDataInputType)
                    }
                },
                resolve(source, args, context) {
                    return mutationUpdateUserResolver(source, args, context);
                }
            }
        };
    }
});
const schema = new GraphQLSchema({
    query: QueryType,
    mutation: MutationType,
    types: [GroupType, IPersonType, MutationType, QueryType, UserType, UserDataInputType]
});
export { schema };