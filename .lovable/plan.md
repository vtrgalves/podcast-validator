# VTR Gestão IA — Podcast Knowledge Agent (Oracle ONE Challenge)

Plano atualizado: a execução do agente passa a rodar **de fato na Oracle Cloud**. O Lovable hospeda o frontend; a inteligência do agente (RAG + orquestração + chamada ao LLM) roda em uma **OCI Function** exposta por **OCI API Gateway**.

## 1. Arquitetura revisada

```text
Navegador
   |
   v
Lovable Frontend (TanStack Start, React 19)      [hospedado no Lovable]
   |
   |  createServerFn / rota /api/chat = PROXY FINO
   |  (só repassa: mensagem, threadId, JWT do usuário; nenhuma credencial Oracle)
   v
OCI API Gateway  -> endpoint HTTPS público             [ORACLE]
   |
   v
OCI Function  "podcast-agent"                          [ORACLE — execução real]
   |   . valida o JWT do usuário
   |   . embedding da pergunta
   |   . busca semântica top-k (pgvector)
   |   . monta contexto + regra anti-alucinação
   |   . chama o LLM (CHAT_MODEL)
   |   . devolve resposta em streaming/JSON + fontes
   |
   +--> Base vetorial pgvector (Lovable Cloud/Postgres) — chunks + embeddings
   +--> OCI Object Storage  "vtr-podcast-knowledge"     [ORACLE] — documentos originais
   +--> LLM via AI Gateway (CHAT_MODEL / EMBEDDING_MODEL, por env var)
   |
   v
resposta (texto + fontes citadas) -> Frontend -> usuário
```

## 2. O que efetivamente roda na OCI

| Componente | Onde roda | Papel |
|---|---|---|
| UI, rotas, sidebar de threads | Lovable | apresentação |
| Proxy `/api/chat` | Lovable | encaminha a chamada; não decide nada |
| **Orquestração do agente, RAG, prompt, chamada ao LLM** | **OCI Function** | **núcleo executável na Oracle** |
| Endpoint público HTTPS + CORS + rate limit | **OCI API Gateway** | exposição da Function |
| Documentos originais (PDF/DOCX/XLSX/PPTX/...) | **OCI Object Storage** | acervo da Base de Conhecimento |
| Threads, mensagens, chunks, embeddings, diagnósticos | Lovable Cloud (Postgres + pgvector) | persistência |

Demonstrável: derrubar/renomear a Function faz o agente parar de responder — prova de que a execução está na Oracle.

## 3. Fluxo completo da requisição

1. Usuário envia mensagem no chat (thread já autenticada).
2. Frontend chama o proxy no Lovable com `{ threadId, message }` + JWT.
3. Proxy adiciona o header de autenticação da Function (secret server-side) e faz POST em `AGENT_ENDPOINT_URL` (API Gateway).
4. API Gateway roteia para a OCI Function.
5. Function: valida JWT → gera embedding (`EMBEDDING_MODEL`) → `match_document_chunks` no pgvector → monta contexto numerado → chama `CHAT_MODEL` → decide entre resposta fundamentada, resposta com lacuna declarada, ou acionamento da capacidade especializada (Validador / Monetização).
6. Se o documento original precisar ser exibido, a Function gera um Pre-Authenticated Request curto no Object Storage.
7. Resposta volta ao proxy → frontend renderiza texto + **Fontes consultadas** (documento + página/aba).
8. Proxy persiste a mensagem do usuário e a do agente na thread.

Fallback: se `AGENT_ENDPOINT_URL` não estiver configurado, o mesmo código do agente roda localmente no Lovable (paridade de comportamento para desenvolvimento) — mas a entrega do Challenge usa a Function.

## 4. Serviços OCI necessários

- **OCI Object Storage** — bucket privado `vtr-podcast-knowledge`
- **OCI Functions** — aplicação `vtr-agent`, função `podcast-agent` (container OCI Registry)
- **OCI API Gateway** — deployment `/agent` → Function
- **OCI IAM** — usuário/grupo + policies mínimas (manage objects no bucket, use functions-family)
- **OCI Registry (OCIR)** — imagem da Function
- **OCI Vault** (opcional, recomendado) — guarda das chaves usadas pela Function

Sem SDK Oracle no frontend. Nenhuma credencial Oracle chega ao navegador.

## 5. Configuração por variáveis de ambiente

Lovable (server-side): `AGENT_ENDPOINT_URL`, `AGENT_SHARED_SECRET`, `CHAT_MODEL`, `EMBEDDING_MODEL`, `STORAGE_DRIVER`.

OCI Function: `CHAT_MODEL`, `EMBEDDING_MODEL`, `AI_GATEWAY_URL`, `AI_API_KEY`, `DATABASE_URL`, `SUPABASE_JWT_ISSUER`, `AGENT_SHARED_SECRET`, `OCI_NAMESPACE`, `OCI_BUCKET`, `OCI_REGION`.

Regras: nenhum identificador de modelo fixado no código — sempre lido de `CHAT_MODEL` / `EMBEDDING_MODEL`, com defaults documentados no `.env.example`. Trocar de modelo é mudança de configuração, não de código.

## 6. Modelo de dados e permissões

- `profiles`, `threads`, `messages` — **privados por usuário** (`auth.uid()`)
- `documents`, `document_chunks` — **compartilhados**: leitura para qualquer usuário autenticado; escrita/ingestão restrita a admin (`user_roles` + `has_role`)
- `diagnostics` — privado por usuário, vinculado à thread
- `validations`, `leads` — mantidas
- `document_chunks.embedding vector(3072)` + índice HNSW via halfvec; função `match_document_chunks`

Citações continuam obrigatórias: toda resposta fundamentada lista documento + página/aba, com link para o item na Base de Conhecimento.

## 7. Validador de Podcast como capacidade do agente

O validador não vira uma página isolada: torna-se uma **skill** do agente, acionada por tool call quando o usuário quer validar uma ideia. Ele conduz a coleta conversacional (uma pergunta por vez), reaproveita o prompt de consultor sênior e o schema de scores já existentes, e devolve o **Card de Diagnóstico** dentro do chat. As rotas atuais `/validar`, `/processando/:id` e `/relatorio/:id` seguem funcionando.

## 8. As 10 fases (atualizadas)

| Fase | Entrega |
|---|---|
| 1 | Auth (email + Google), tabelas `threads`/`messages`, chat em `/app/podcast-agent` com sidebar de threads, streaming, boas-vindas com 6 sugestões; CTA da landing → "Validar meu Podcast com IA" |
| 2 | Validador como skill conversacional do agente (tool call, uma pergunta por vez) |
| 3 | `/app/base-conhecimento`: upload, categorias, status, acervo compartilhado |
| 4 | Pipeline de extração + chunking por formato (PDF, DOCX, XLSX, PPTX, CSV, JSON, MD, HTML) |
| 5 | Embeddings (`EMBEDDING_MODEL`), pgvector, busca semântica, citações, regra anti-alucinação |
| 6 | **OCI**: bucket Object Storage para documentos; **OCI Function** hospedando o backend do agente; **API Gateway** para endpoint HTTPS público; integração só por variáveis de ambiente; nenhuma credencial Oracle no frontend; fluxo completo da chamada documentado |
| 7 | Card de Diagnóstico no chat (score 0–100, 8 dimensões, GO / GO COM AJUSTES / VALIDAR MAIS / NO-GO) |
| 8 | "Explorar Monetização" e "Mapa de Oportunidades" + apoio a negociação comercial |
| 9 | **README**: arquitetura completa, indicação clara dos serviços OCI usados, instruções de configuração OCI, screenshots dos recursos Oracle, variáveis necessárias, demonstração do fluxo |
| 10 | **Deploy**, com critério de conclusão: agente acessível por URL pública; backend/agente executando na OCI; chamada real Frontend → OCI → IA; screenshot ou vídeo no README; repositório GitHub público; evidência do Object Storage; evidência da Function/Container em execução |

Fases 1–5 já são construídas com o agente isolado em um módulo portável, para que a Fase 6 seja um empacotamento — não uma reescrita.

## 9. Dependências e riscos adicionais

| Risco | Mitigação |
|---|---|
| Deploy de OCI Function exige `oci-cli`/Docker fora do Lovable | Entrego o diretório da Function (`func.yaml`, Dockerfile, código) + passo a passo; o deploy final é executado por você na sua tenancy |
| Cold start da Function (segundos) | Imagem enxuta, dependências mínimas, mensagem de "conectando ao agente" na UI |
| Function precisa alcançar o Postgres | Uso da connection string pooled sobre TLS; policies de rede documentadas |
| Latência extra Lovable → Oracle → LLM | Streaming ponta a ponta e top-k reduzido |
| Parsers de documento Node-only no runtime edge | Ingestão passa a rodar também na Function (Node completo), removendo a limitação |
| Chave OCI/segredos vazando | Tudo em env vars server-side ou OCI Vault; proxy nunca devolve segredo ao cliente |
| Custos OCI | Functions e Object Storage têm Always Free tier; volume do MVP fica dentro dele |

## 10. O que preciso de você (antes da Fase 6)

Tenancy OCI ativa, região preferida, e depois: `OCI_NAMESPACE`, `OCI_BUCKET`, `OCI_REGION`, credenciais de API Signing Key e a URL do API Gateway — todas pedidas pelo formulário seguro de secrets no momento certo, nunca antes.

Aprovando, começo pela Fase 1.
