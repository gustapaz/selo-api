import { meta } from "./meta.mjs";
const scalar = {
  oneOf: [
    { type: "string", maxLength: 256 },
    { type: "number", minimum: -1e9, maximum: 1e9 },
    { type: "boolean" },
  ],
};
const condition = {
  type: "object",
  additionalProperties: false,
  required: ["field", "op", "value"],
  properties: {
    field: { type: "string", pattern: "^[a-z][a-z0-9_-]{0,39}$" },
    op: { type: "string", enum: ["eq", "neq", "in", "gte", "lte", "exists"] },
    value: {
      oneOf: [
        ...scalar.oneOf,
        { type: "array", minItems: 1, maxItems: 20, items: scalar },
      ],
    },
  },
};
const input = {
  type: "object",
  additionalProperties: false,
  required: ["policy", "context"],
  properties: {
    context: {
      type: "object",
      maxProperties: 32,
      additionalProperties: scalar,
      description: "Chaves ASCII minúsculas. Sem null ou objetos aninhados.",
    },
    policy: {
      type: "object",
      additionalProperties: false,
      required: ["rules"],
      properties: {
        rules: {
          type: "array",
          minItems: 1,
          maxItems: 20,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "effect", "all"],
            properties: {
              id: { type: "string", pattern: "^[a-z][a-z0-9_-]{0,39}$" },
              effect: { type: "string", enum: ["allow", "deny"] },
              all: {
                type: "array",
                minItems: 1,
                maxItems: 10,
                items: condition,
              },
            },
          },
        },
      },
    },
  },
};
const output = {
  type: "object",
  required: [
    "engine",
    "decision",
    "reason",
    "matched_allow",
    "matched_deny",
    "combining_algorithm",
    "default_decision",
  ],
  properties: {
    engine: { type: "string" },
    decision: { type: "string", enum: ["allow", "deny"] },
    reason: { type: "string", enum: ["allowed", "explicit_deny", "no_allow"] },
    matched_allow: { type: "array", items: { type: "string" } },
    matched_deny: { type: "array", items: { type: "string" } },
    combining_algorithm: { type: "string" },
    default_decision: { type: "string" },
  },
};
const trace = {
  type: "array",
  items: {
    type: "object",
    required: ["id", "effect", "matched", "conditions"],
    properties: {
      id: { type: "string" },
      effect: { type: "string" },
      matched: { type: "boolean" },
      conditions: {
        type: "array",
        items: {
          type: "object",
          required: ["field", "op", "matched"],
          properties: {
            field: { type: "string" },
            op: { type: "string" },
            matched: { type: "boolean" },
          },
        },
      },
    },
  },
};
export function createService(evaluate) {
  return {
    meta,
    health: () => evaluate(meta.examples[0].input).decision === "allow",
    actions: {
      [meta.primary]: {
        label: "Avaliar decisão deny-overrides",
        description:
          meta.behavior +
          " Operadores: eq/neq usam tipo estrito; in usa lista; gte/lte exigem números; exists exige booleano.",
        input,
        output,
        run: (input) => {
          const { trace, ...decision } = evaluate(input);
          return decision;
        },
      },
      [meta.secondary]: {
        label: "Explicar todas as regras e condições",
        description:
          "Mesmo cálculo, incluindo o trace completo, na ordem declarada. Não interrompe na primeira regra.",
        input,
        output: {
          ...output,
          required: [...output.required, "trace"],
          properties: { ...output.properties, trace },
        },
        run: evaluate,
      },
    },
  };
}
