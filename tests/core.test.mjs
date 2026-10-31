import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate } from "../server/node-runtime.mjs";
import { meta } from "../server/meta.mjs";
const request = (op, value, context = { x: 2 }, effect = "allow") => ({
  policy: { rules: [{ id: "rule", effect, all: [{ field: "x", op, value }] }] },
  context,
});
test("allow, explicit deny and default deny", () => {
  for (const sample of meta.examples)
    assert.equal(evaluate(sample.input).decision, sample.expected.decision);
});
test("deny overrides regardless of policy ordering", () => {
  const input = structuredClone(meta.examples[1].input);
  assert.equal(evaluate(input).reason, "explicit_deny");
  input.policy.rules.reverse();
  assert.equal(evaluate(input).reason, "explicit_deny");
});
for (const [op, value, context, expected] of [
  ["eq", 2, { x: 2 }, true],
  ["eq", "2", { x: 2 }, false],
  ["neq", 3, { x: 2 }, true],
  ["neq", "2", { x: 2 }, false],
  ["gte", 2, { x: 2 }, true],
  ["lte", 2, { x: 2 }, true],
  ["gte", 2, { x: "3" }, false],
  ["in", [1, 2], { x: 2 }, true],
  ["in", ["2"], { x: 2 }, false],
  ["exists", false, {}, true],
  ["exists", true, {}, false],
  ["eq", false, { x: false }, true],
  ["exists", true, { x: false }, true],
  ["exists", true, { x: 0 }, true],
  ["exists", true, { x: "" }, true],
  ["neq", 2, {}, false],
])
  test(op + " " + JSON.stringify([value, context]), () =>
    assert.equal(
      evaluate(request(op, value, context)).decision,
      expected ? "allow" : "deny",
    ),
  );
test("all conditions evaluated even after false, trace does not echo context", () => {
  const input = request("eq", 3);
  input.policy.rules[0].all.push({ field: "x", op: "gte", value: 1 });
  const r = evaluate(input);
  assert.deepEqual(
    r.trace[0].conditions.map((c) => c.matched),
    [false, true],
  );
  assert.equal(r.trace[0].conditions[0].actual, undefined);
});
test("fresh VM per request has no state leakage", () => {
  for (let i = 0; i < 20; i++) {
    assert.equal(evaluate(request("eq", 2)).decision, "allow");
    assert.equal(evaluate(request("eq", 3)).decision, "deny");
  }
});
test("Lua-looking input remains data", () => {
  const value = 'os.execute("touch nope")';
  assert.equal(evaluate(request("eq", value, { x: value })).decision, "allow");
});
test("maximum rule/condition count is evaluated", () => {
  const r = evaluate({
    context: { x: 2 },
    policy: {
      rules: Array.from({ length: 20 }, (_, i) => ({
        id: "r" + i,
        effect: "allow",
        all: Array.from({ length: 10 }, () => ({
          field: "x",
          op: "eq",
          value: 2,
        })),
      })),
    },
  });
  assert.equal(r.matched_allow.length, 20);
  assert.equal(r.trace[19].conditions.length, 10);
});
for (const input of [
  null,
  {},
  { policy: { rules: [] }, context: {} },
  { ...request("eq", 2), context: { x: null } },
  request("exists", "yes"),
  request("gte", "3"),
  request("in", []),
  request("unknown", 2),
  request("eq", {}),
  { ...request("eq", 2), surprise: true },
])
  test("invalid " + JSON.stringify(input), () =>
    assert.throws(
      () => evaluate(input),
      (e) => e.status === 422,
    ),
  );
