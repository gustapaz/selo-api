import lua from "fengari/src/lua.js";
import lauxlib from "fengari/src/lauxlib.js";
import base from "fengari/src/lbaselib.js";
import core from "fengari/src/fengaricore.js";
import { exact, invalid, object } from "./http.mjs";
const { to_luastring, to_jsstring } = core;
const scalar = (v) =>
  (typeof v === "string" && v.length <= 256) ||
  (typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= 1e9) ||
  typeof v === "boolean";
const name = (v) => typeof v === "string" && /^[a-z][a-z0-9_-]{0,39}$/.test(v);
export function validate(input) {
  exact(input, ["policy", "context"], "requisição");
  exact(input.policy, ["rules"], "policy");
  if (
    !object(input.context) ||
    Object.keys(input.context).length > 32 ||
    Object.entries(input.context).some(([k, v]) => !name(k) || !scalar(v))
  )
    invalid(
      "invalid_context",
      "context exige até 32 atributos escalares; null não é aceito.",
    );
  if (
    !Array.isArray(input.policy.rules) ||
    input.policy.rules.length < 1 ||
    input.policy.rules.length > 20
  )
    invalid("invalid_rules", "Defina entre 1 e 20 regras.");
  const ids = new Set();
  for (const r of input.policy.rules) {
    exact(r, ["id", "effect", "all"], "regra");
    if (!name(r.id) || ids.has(r.id))
      invalid("invalid_id", "IDs de regras devem ser únicos.");
    ids.add(r.id);
    if (!["allow", "deny"].includes(r.effect))
      invalid("invalid_effect", "effect deve ser allow ou deny.");
    if (!Array.isArray(r.all) || r.all.length < 1 || r.all.length > 10)
      invalid("invalid_conditions", "Cada regra exige entre 1 e 10 condições.");
    for (const c of r.all) {
      exact(c, ["field", "op", "value"], "condição");
      if (
        !name(c.field) ||
        !["eq", "neq", "in", "gte", "lte", "exists"].includes(c.op)
      )
        invalid("invalid_condition", "Campo ou operador desconhecido.");
      if (c.op === "exists") {
        if (typeof c.value !== "boolean")
          invalid("invalid_value", "exists exige booleano.");
      } else if (c.op === "in") {
        if (
          !Array.isArray(c.value) ||
          c.value.length < 1 ||
          c.value.length > 20 ||
          c.value.some((v) => !scalar(v))
        )
          invalid("invalid_value", "in exige de 1 a 20 valores escalares.");
      } else if (["gte", "lte"].includes(c.op)) {
        if (typeof c.value !== "number" || !scalar(c.value))
          invalid("invalid_value", "Comparação numérica exige número finito.");
      } else if (!scalar(c.value))
        invalid("invalid_value", "eq e neq exigem valor escalar.");
    }
  }
  return input;
}
function push(L, value) {
  if (typeof value === "string") lua.lua_pushstring(L, to_luastring(value));
  else if (typeof value === "number") lua.lua_pushnumber(L, value);
  else if (typeof value === "boolean") lua.lua_pushboolean(L, value);
  else {
    lua.lua_newtable(L);
    for (const [k, v] of Object.entries(value)) {
      if (Array.isArray(value)) lua.lua_pushinteger(L, Number(k) + 1);
      else lua.lua_pushstring(L, to_luastring(k));
      push(L, v);
      lua.lua_settable(L, -3);
    }
  }
}
function pull(L, index) {
  const type = lua.lua_type(L, index);
  if (type === lua.LUA_TSTRING) return to_jsstring(lua.lua_tostring(L, index));
  if (type === lua.LUA_TNUMBER) return lua.lua_tonumber(L, index);
  if (type === lua.LUA_TBOOLEAN) return lua.lua_toboolean(L, index);
  if (type === lua.LUA_TTABLE) {
    const absolute = lua.lua_absindex(L, index),
      entries = [];
    lua.lua_pushnil(L);
    while (lua.lua_next(L, absolute) !== 0) {
      entries.push([pull(L, -2), pull(L, -1)]);
      lua.lua_pop(L, 1);
    }
    if (entries.every(([k]) => typeof k === "number"))
      return entries.sort((a, b) => a[0] - b[0]).map(([, v]) => v);
    return Object.fromEntries(entries);
  }
  throw new Error("Unexpected Lua output type");
}
export function createEvaluator(source) {
  return (input) => {
    validate(input);
    const L = lauxlib.luaL_newstate();
    try {
      // Only base is opened. No io, os, package, table, debug or JS interop.
      lauxlib.luaL_requiref(L, to_luastring("_G"), base.luaopen_base, 1);
      lua.lua_pop(L, 1);
      if (lauxlib.luaL_dostring(L, to_luastring(source)) !== lua.LUA_OK)
        throw new Error("Trusted Lua evaluator failed to load");
      lua.lua_getglobal(L, to_luastring("evaluate"));
      push(L, input);
      if (lua.lua_pcall(L, 1, 1, 0) !== lua.LUA_OK)
        throw new Error("Lua evaluation failed");
      return pull(L, -1);
    } finally {
      lua.lua_close(L);
    }
  };
}
