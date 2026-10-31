# Arquitetura

Objetivo: estudar toda permissão precisa de uma razão.

HTTP -> validação -> motor Lua 5.3 + Fengari -> JSON.

engine/policy.lua contém o avaliador real. O adaptador abre uma VM Fengari nova por chamada e injeta apenas dados validados. São importados diretamente núcleo, lauxlib e base da versão fixada; não são carregados módulos de terminal, io, os, package, table, debug ou JS interop. O usuário nunca fornece código Lua. A biblioteca base é suficiente para o avaliador, sem efeitos externos. O finally encerra cada VM.

Todas as condições e regras são avaliadas na ordem declarada. Uma regra combina condições com all. Uma negação correspondente vence qualquer allow; sem allow correspondente, deny por padrão. eq/neq exigem mesmo tipo; neq também falha para campo ausente ou tipo diferente. in compara cada item sem coerção. gte/lte exigem número no contexto. exists:true/false testa presença, distinguindo false, zero e string vazia de ausência. null não é permitido no contexto. /explain devolve trace sem ecoar valores do contexto. Isto não autentica usuários nem instala proteção em outro aplicativo.

server/http.mjs cuida de leitura limitada, headers, erros e OpenAPI. server/service.mjs define operações/contratos. server/meta.mjs contém exemplos sintéticos. app/playground.tsx é apenas cliente HTTP. tests inclui casos de domínio e integração real.

Não existem filas, banco, cron ou integrações sem função no domínio. Nenhuma persistência é prometida. Os testes verificam todos os operadores, ausências, false/zero, negação prioritária, limites de regras, isolamento de VMs e texto parecido com Lua tratado somente como dado.
