import { readFileSync } from "node:fs";
import { createEvaluator } from "./core.mjs";
import { createHandler } from "./http.mjs";
import { createService } from "./service.mjs";
export const evaluate = createEvaluator(
  readFileSync(new URL("../engine/policy.lua", import.meta.url), "utf8"),
);
export const handle = createHandler(createService(evaluate));
