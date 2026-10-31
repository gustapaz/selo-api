const policy = {
  rules: [
    {
      id: "members-read",
      effect: "allow",
      all: [
        { field: "role", op: "in", value: ["member", "editor"] },
        { field: "action", op: "eq", value: "read" },
      ],
    },
    {
      id: "blocked-user",
      effect: "deny",
      all: [{ field: "blocked", op: "eq", value: true }],
    },
  ],
};
export const meta = {
  repo: "selo-api",
  title: "Selo API",
  engine: "lua-fengari",
  accent: "#17644d",
  headline: "Toda permissão precisa de uma razão.",
  description:
    "Avalie políticas declarativas de acesso e inspecione cada regra. Um motor Lua real aplica condições tipadas, negação prioritária e decisão padrão de negar.",
  behavior:
    "Todas as regras são avaliadas. Uma negação explícita vence qualquer permissão. Sem regra de permissão correspondente, o resultado é deny. Campos ausentes não satisfazem comparações, inclusive neq; somente exists:false corresponde à ausência.",
  limits:
    "Até 20 regras, 10 condições por regra, 32 atributos e 32 KiB por JSON. Sem código Lua enviado pelo usuário. Este serviço avalia dados sintéticos; não autentica pessoas nem protege automaticamente outro sistema.",
  primary: "/api/v1/evaluate",
  secondary: "/api/v1/explain",
  primaryLabel: "Avaliar política →",
  secondaryLabel: "Explicar regras",
  examples: [
    {
      name: "Permitir leitura",
      input: {
        policy,
        context: { role: "member", action: "read", blocked: false },
      },
      expected: {
        decision: "allow",
        reason: "allowed",
        "matched_allow.0": "members-read",
      },
    },
    {
      name: "Negação vence",
      input: {
        policy,
        context: { role: "editor", action: "read", blocked: true },
      },
      expected: {
        decision: "deny",
        reason: "explicit_deny",
        "matched_deny.0": "blocked-user",
      },
    },
    {
      name: "Padrão seguro",
      input: { policy, context: { role: "guest", action: "write" } },
      expected: { decision: "deny", reason: "no_allow" },
    },
  ],
  secondaryExpected: {
    decision: "allow",
    "trace.0.matched": true,
    "trace.1.matched": false,
  },
};
