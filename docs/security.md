# Segurança e limites

Até 20 regras, 10 condições por regra, 32 atributos e 32 KiB por JSON. Sem código Lua enviado pelo usuário. Este serviço avalia dados sintéticos; não autentica pessoas nem protege automaticamente outro sistema.

O stream conta bytes reais e cancela ao ultrapassar 32 KiB, mesmo sem Content-Length. O servidor valida tipos, propriedades e limites. Não aceita corpo comprimido, execução de código do usuário ou arquivos persistidos.

Origin de navegador deve coincidir com o serviço; clientes sem Origin continuam aceitos. Isso não é autenticação nem impede chamadas por scripts externos. Não há cookies, contas ou credenciais públicas de administrador.

Respostas incluem no-store, nosniff, Referrer-Policy e request IDs. Erros não expõem stacks ou entradas. A aplicação não registra payloads; a infraestrutura pode registrar metadados. Use somente dados sintéticos, nunca informações pessoais, credenciais ou políticas reais sensíveis.

Não há rate limit global ou defesa DDoS própria. Trabalho e memória por chamada são limitados; cotas e disponibilidade dependem do provedor. Nenhum cartão, faturamento, trial ou plano pago foi ativado. Sem SLA ou garantia de gratuidade permanente.

engine/policy.lua contém o avaliador real. O adaptador abre uma VM Fengari nova por chamada e injeta apenas dados validados. São importados diretamente núcleo, lauxlib e base da versão fixada; não são carregados módulos de terminal, io, os, package, table, debug ou JS interop. O usuário nunca fornece código Lua. A biblioteca base é suficiente para o avaliador, sem efeitos externos. O finally encerra cada VM.

Os testes comprovam comportamentos delimitados; não certificam ausência universal de vulnerabilidades.
