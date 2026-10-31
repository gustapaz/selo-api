import { readFileSync } from "node:fs";
import { createEvaluator } from "../server/core.mjs";
import { meta } from "../server/meta.mjs";
const evaluate = createEvaluator(readFileSync("engine/policy.lua", "utf8"));
if (evaluate(meta.examples[0].input).decision !== "allow")
  throw new Error("Lua engine self-check failed");
console.log("Trusted Lua evaluator loaded and executed successfully.");
