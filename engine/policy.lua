-- Trusted evaluator only. User input is data, never Lua source.
local function condition(c, context)
  local actual = context[c.field]
  if c.op == "exists" then return (actual ~= nil) == c.value end
  if actual == nil then return false end
  if c.op == "eq" then return type(actual) == type(c.value) and actual == c.value end
  if c.op == "neq" then return type(actual) == type(c.value) and actual ~= c.value end
  if c.op == "in" then
    for _, expected in ipairs(c.value) do
      if type(actual) == type(expected) and actual == expected then return true end
    end
    return false
  end
  if type(actual) ~= "number" then return false end
  if c.op == "gte" then return actual >= c.value end
  if c.op == "lte" then return actual <= c.value end
  return false
end

function evaluate(input)
  local allows, denies, trace = {}, {}, {}
  for _, rule in ipairs(input.policy.rules) do
    local matched = true
    local conditions = {}
    for _, c in ipairs(rule.all) do
      local ok = condition(c, input.context)
      if not ok then matched = false end
      conditions[#conditions + 1] = {field=c.field, op=c.op, matched=ok}
    end
    if matched then
      if rule.effect == "deny" then denies[#denies + 1] = rule.id
      else allows[#allows + 1] = rule.id end
    end
    trace[#trace + 1] = {id=rule.id, effect=rule.effect, matched=matched, conditions=conditions}
  end
  local decision, reason = "deny", "no_allow"
  if #denies > 0 then reason = "explicit_deny"
  elseif #allows > 0 then decision, reason = "allow", "allowed" end
  return {engine="lua-fengari", decision=decision, reason=reason,
    matched_allow=allows, matched_deny=denies, trace=trace,
    combining_algorithm="deny_overrides", default_decision="deny"}
end
