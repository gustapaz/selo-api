import source from "../engine/policy.lua?raw";
import { createEvaluator } from "./core.mjs";
import { createHandler } from "./http.mjs";
import { createService } from "./service.mjs";
export const handle = createHandler(createService(createEvaluator(source)));
