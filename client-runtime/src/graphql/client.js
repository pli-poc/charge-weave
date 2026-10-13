import {
  buildSchema,
  parse,
  validate,
  execute,
  getOperationAST,
  GraphQLError,
  valueFromASTUntyped,
  Kind,
} from "graphql";
function fail(message, code = "INVALID_INPUT") {
  throw new GraphQLError(message, { extensions: { code } });
}
export function createLocalClient({ applicationPackage: pkg, services }) {
  const schema = buildSchema(pkg.schema);
  const scalars = {
    Decimal: (v) => {
      if (typeof v !== "string" || !/^-?\d+(?:\.\d+)?$/.test(v))
        fail("Decimal requires a canonical decimal string");
      return v;
    },
    BigInteger: (v) => {
      if (typeof v !== "string" || !/^-?\d+$/.test(v))
        fail("BigInteger requires a string");
      return v;
    },
    IRI: (v) => {
      if (typeof v !== "string" || !/^[a-z][a-z0-9+.-]*:/i.test(v))
        fail("IRI requires an absolute identity");
      return v;
    },
    DateTime: (v) => {
      if (
        typeof v !== "string" ||
        !/T.*(?:Z|[+-]\d\d:\d\d)$/.test(v) ||
        !Number.isFinite(Date.parse(v))
      )
        fail("Timezone timestamp required");
      return v;
    },
    JSON: (v) => v,
  };
  for (const [name, coerce] of Object.entries(scalars)) {
    const scalar = schema.getType(name);
    scalar.serialize = coerce;
    scalar.parseValue = coerce;
    scalar.parseLiteral = (n) => coerce(valueFromASTUntyped(n));
  }
  for (const type of pkg.api.types) {
    for (const field of type.fields)
      schema.getType(type.name).getFields()[field.name].resolve = (record) =>
        Object.hasOwn(record, field.source) ? record[field.source] : null;
  }
  const rootValue = {};
  for (const op of pkg.api.operations) {
    if (!Object.hasOwn(services, op.handler))
      throw Error(`Missing handler ${op.handler}`);
    rootValue[op.name] = (args) => services[op.handler](args);
  }
  Object.assign(rootValue, {
    task: () => services.task(),
    metadata: () => ({
      digest: pkg.digest,
      capabilities: pkg.capabilities,
      task: pkg.task.task,
      analytics: pkg.analytics,
      api: pkg.api,
    }),

    analytics: ({ input }) => services.analytics(input),
    temporal: (args) => services.temporal(args),
  });
  for (const command of pkg.commands.commands) {
    if (
      !Object.hasOwn(services, command.handler) ||
      typeof services[command.handler] !== "function"
    )
      throw Error(`Missing command handler ${command.handler}`);
    rootValue[command.id] = (args) => services[command.handler](args);
  }
  return {
    async execute({ query, variables = {}, operationName }) {
      try {
        if (typeof query !== "string" || query.length > 20000)
          fail("Query exceeds budget", "QUERY_BUDGET");
        const document = parse(query);
        const errors = validate(schema, document);
        if (errors.length) return { errors };
        const op = getOperationAST(document, operationName);
        if (!op) fail("Select one named operation");
        const fragments = Object.fromEntries(
          document.definitions
            .filter((x) => x.kind === Kind.FRAGMENT_DEFINITION)
            .map((x) => [x.name.value, x]),
        );
        let fields = 0;
        function walk(set, depth = 0) {
          if (depth > pkg.api.maxDepth)
            fail("Query depth budget exceeded", "QUERY_BUDGET");
          for (const s of set?.selections ?? []) {
            if (++fields > pkg.api.maxFields)
              fail("Query field budget exceeded", "QUERY_BUDGET");
            if (s.kind === Kind.FRAGMENT_SPREAD)
              walk(fragments[s.name.value].selectionSet, depth + 1);
            else if (s.selectionSet) walk(s.selectionSet, depth + 1);
          }
        }
        walk(op.selectionSet);
        function top(set) {
          return set.selections.flatMap((s) =>
            s.kind === Kind.FIELD
              ? [s]
              : s.kind === Kind.FRAGMENT_SPREAD
                ? top(fragments[s.name.value].selectionSet)
                : top(s.selectionSet),
          );
        }
        if (op.operation === "mutation" && top(op.selectionSet).length !== 1)
          fail("Exactly one business mutation per request");
        return await execute({
          schema,
          document,
          rootValue,
          variableValues: variables,
          operationName,
        });
      } catch (error) {
        return {
          errors: [
            error instanceof GraphQLError
              ? error
              : new GraphQLError(error.message, {
                  extensions: { code: "EXECUTION_ERROR" },
                }),
          ],
        };
      }
    },
  };
}
