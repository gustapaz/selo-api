# Selo API

Avalie políticas declarativas de acesso e inspecione cada regra. Um motor Lua real aplica condições tipadas, negação prioritária e decisão padrão de negar.

**Motor: Lua 5.3 + Fengari.**

[Demo](https://selo-api-gustapaz.starrylinen.chatgpt.site) · [Swagger](https://selo-api-gustapaz.starrylinen.chatgpt.site/docs.html) · [OpenAPI](https://selo-api-gustapaz.starrylinen.chatgpt.site/api/openapi.json)

## Recursos

Todas as regras são avaliadas. Uma negação explícita vence qualquer permissão. Sem regra de permissão correspondente, o resultado é deny. Campos ausentes não satisfazem comparações, inclusive neq; somente exists:false corresponde à ausência.

Os exemplos são sintéticos. O motor, as regras e as respostas são reais no servidor. Não há serviços externos simulando o processamento.

## Executar localmente

Node.js 24 e npm. O interpretador Fengari está fixado no lockfile; não é preciso instalar Lua no sistema.

```sh
npm ci
npm run build
npm start -- --port 5212
```

Abra http://127.0.0.1:5212 e /docs.html. Não precisa de conta cloud, cartão, segredo ou banco. O serviço é stateless: nada precisa sobreviver à requisição, portanto não existem migrações ou persistência prometida.

```sh
npm run build:engine
npm run check
npm run typecheck
npm test
npm run smoke -- http://127.0.0.1:5212
```

42 testes passam sobre o motor real e integração HTTP via TCP, sem mocks do domínio. Os testes verificam todos os operadores, ausências, false/zero, negação prioritária, limites de regras, isolamento de VMs e texto parecido com Lua tratado somente como dado. A CI instala do lockfile, constrói o motor, verifica formatação e tipos do adaptador/interface, executa testes e compila o Worker. O smoke verifica os exemplos e as duas operações no runtime local ou público.

## API e exemplos

```sh
curl https://selo-api-gustapaz.starrylinen.chatgpt.site/api/health
curl -X POST https://selo-api-gustapaz.starrylinen.chatgpt.site/api/v1/evaluate -H 'Content-Type: application/json' --data-binary @examples/requests/example-1.json
curl -X POST https://selo-api-gustapaz.starrylinen.chatgpt.site/api/v1/explain -H 'Content-Type: application/json' --data-binary @examples/requests/example-1.json
```

GET /api/v1/examples oferece três entradas sintéticas executáveis. O health executa uma operação real no motor antes de retornar engine_check:true. Todos os endpoints são públicos, sem identidade ou recursos privados persistidos.

Erros usam application/problem+json e request_id, sem stack trace. JSON/UTF-8 inválido: 400; Origin de navegador diferente: 403; rota desconhecida: 404; corpo acima de 32 KiB: 413; mídia/codificação incorreta: 415; contrato inválido: 422.

## Semântica

Todas as condições e regras são avaliadas na ordem declarada. Uma regra combina condições com all. Uma negação correspondente vence qualquer allow; sem allow correspondente, deny por padrão. eq/neq exigem mesmo tipo; neq também falha para campo ausente ou tipo diferente. in compara cada item sem coerção. gte/lte exigem número no contexto. exists:true/false testa presença, distinguindo false, zero e string vazia de ausência. null não é permitido no contexto. /explain devolve trace sem ecoar valores do contexto. Isto não autentica usuários nem instala proteção em outro aplicativo.

Até 20 regras, 10 condições por regra, 32 atributos e 32 KiB por JSON. Sem código Lua enviado pelo usuário. Este serviço avalia dados sintéticos; não autentica pessoas nem protege automaticamente outro sistema.

## Arquitetura e operação

[Arquitetura](docs/architecture.md) · [Segurança](docs/security.md)

O núcleo está em engine/policy.lua, server/core.mjs, server/service.mjs. Vinext/React fornece somente o adaptador Worker e a documentação técnica; as regras não são executadas no navegador. Entradas e resultados não são gravados pela aplicação; a página mantém a resposta apenas em memória.

Demo hospedada em Sites, sem cartão, faturamento, trial ou plano pago ativado. GitHub hospeda código e CI; Pages não executa a API. Cotas e disponibilidade dependem da hospedagem, sem SLA ou promessa de gratuidade permanente. Há limite de trabalho por chamada, mas não rate limit global próprio. Use somente dados sintéticos.

Nenhuma variável secreta é necessária. Credenciais de Git/publicação ficam fora do repositório. Consulte .env.example.

## Licença

Código do projeto sob MIT. Dependências mantêm suas licenças. Swagger UI conserva LICENSE e NOTICE em public/swagger; tooling Sites/Vinext preserva avisos em vendor e scripts/vite/sites-vite-plugin.LICENSE.
