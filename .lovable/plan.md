# VTR Gestão IA — Podcast Strategy Agent (Oracle ONE Challenge)

Evolução do produto atual: mantém identidade, posicionamento e a inteligência de validação já construída, mas move o núcleo da experiência para um **agente conversacional fundamentado em documentos (RAG)**, com Oracle Cloud Infrastructure na camada de armazenamento documental.

## O que já existe e será reaproveitado

- Landing page premium, identidade visual dark/roxo-rosa, Logo, tokens de design
- Tabela `validations` + `leads`, bucket privado `attachments`
- `src/lib/validate.functions.ts` — prompt de consultor sênior, schema de 9 scores e 8 blocos, tratamento de 402/429
- `src/lib/report-types.ts`, componentes de relatório (radar, cards) — viram o **card de diagnóstico dentro do chat**
- Rotas `/validar`, `/processando/:id`, `/relatorio/:id` continuam funcionando (nada é destruído)

## O que muda

- CTA principal: "Validar meu Podcast" → **"Validar meu Podcast com IA"**, apontando para `/app/podcast-agent`
- Nova experiência principal: chat com sidebar, threads e base de conhecimento
- O validador vira um **fluxo conversacional** dentro do chat (uma pergunta por vez), terminando no card de diagnóstico

## Arquitetura proposta

```text
Usuário
  ↓
Lovable Frontend (TanStack Start, React 19)
  ↓
Backend (server functions + rota de streaming /api/chat)
  ↓         ↘
Lovable Cloud (Postgres + pgvector)   Oracle Cloud Infrastructure
  threads, mensagens, chunks,          Object Storage
  embeddings, metadados                bucket vtr-podcast-knowledge
  ↓
Busca semântica (top-k) → contexto → LLM → resposta com fontes
```

Decisões confirmadas: **múltiplas conversas (threads)** com **histórico em banco de dados**, e **OCI Object Storage** como serviço Oracle obrigatório do Challenge.

## Serviços necessários

| Serviço | Uso | Custo |
|---|---|---|
| Lovable Cloud (Postgres/pgvector/Auth/Storage) | threads, mensagens, chunks, vetores | incluso |
| Lovable AI Gateway | chat (`openai/gpt-5.6-sol`) + embeddings (`google/gemini-embedding-2`) | por requisição, com free tier mensal |
| OCI Object Storage | documentos originais da base | centavos/mês nesse volume; há Always Free tier |
| Auth (email + Google) | necessária porque o histórico é por usuário | incluso |

## Tabelas necessárias

- `profiles` — id do usuário, nome, avatar
- `threads` — id, user_id, título, updated_at
- `messages` — id (uuid gerado pelo banco), thread_id, role, parts jsonb, sources jsonb, created_at
- `documents` — id, título, categoria (estrategia/monetizacao/comercial/audiencia/producao/parcerias/gestao), formato, oci_object_name, oci_url, status (uploaded/processing/indexed/failed), páginas, created_at
- `document_chunks` — id, document_id, chunk_index, conteúdo, página/aba, `embedding vector(3072)` + índice HNSW via halfvec
- `diagnostics` — id, thread_id, user_id, respostas coletadas, report jsonb, score (reaproveita o schema atual)
- `leads`, `validations` — mantidas

RLS: tudo escopado a `auth.uid()`; `documents`/`document_chunks` com leitura para `authenticated` e escrita apenas admin (tabela `user_roles` + `has_role`).

## Estratégia RAG

1. Upload do documento → gravado no **OCI Object Storage** em `/categoria/arquivo`
2. Extração de texto por formato: PDF, DOCX, XLSX, PPTX, CSV, JSON, MD, HTML (bibliotecas puro-JS compatíveis com o runtime edge; formatos sem parser viável entram como "não indexado" e ficam visíveis na UI)
3. Normalização + chunking (~1.000 caracteres, 15% de overlap), preservando página/aba na metadata
4. Embeddings via `google/gemini-embedding-2` (3072 dims, lotes ≤100)
5. Busca: embedding da pergunta → `match_document_chunks` (cosine, top-k 8) → filtro por limiar de similaridade
6. Prompt: contexto numerado + regra anti-alucinação; sem contexto suficiente, o agente responde a frase exata exigida e oferece análise complementar rotulada como recomendação da IA
7. Resposta cita **Fontes consultadas** com documento + página/aba, clicável para o item na Base de Conhecimento

## Integração OCI (modular e segura)

- Adaptador `src/lib/storage/` com interface única e duas implementações: `oci` e `supabase` (fallback), escolhida por env var
- Autenticação por API Signing Key (RSA + assinatura HTTP), 100% server-side
- Secrets: `OCI_TENANCY_OCID`, `OCI_USER_OCID`, `OCI_FINGERPRINT`, `OCI_PRIVATE_KEY`, `OCI_REGION`, `OCI_NAMESPACE`, `OCI_BUCKET` — solicitados pelo formulário seguro, nunca no frontend nem no repositório
- URLs de leitura via Pre-Authenticated Request de curta duração geradas no backend

## Riscos técnicos

- Parsers de documento no runtime edge: alguns pacotes são Node-only. Mitigação: parsers puro-JS/WASM e processamento em fila por documento
- Assinatura OCI feita à mão (não há SDK edge-friendly): mitigada pelo adaptador isolado com testes e fallback
- Documentos grandes: chunking incremental com status por documento na UI, evitando timeouts
- Qualidade do RAG depende do acervo: com base vazia, o agente admite a lacuna em vez de inventar

## Plano em 10 fases

| Fase | Entrega |
|---|---|
| 1 | Auth + `threads`/`messages` + UX do chat em `/app/podcast-agent` (AI Elements, sidebar, boas-vindas com 6 sugestões, streaming) e CTA atualizado |
| 2 | Fluxo conversacional do validador (uma pergunta por vez) via tool calling |
| 3 | `/app/base-conhecimento`: listagem, upload, categorias, status |
| 4 | Pipeline de extração e chunking por formato |
| 5 | Embeddings, pgvector, busca semântica, citação de fontes, regra anti-alucinação |
| 6 | Adaptador OCI Object Storage + migração dos documentos para o bucket |
| 7 | Card de Diagnóstico no chat (score 0–100, 8 dimensões, GO / GO COM AJUSTES / VALIDAR MAIS / NO-GO) |
| 8 | "Explorar Monetização" e "Mapa de Oportunidades" + apoio a negociação |
| 9 | README completo, `.env.example`, diagrama de arquitetura, screenshots |
| 10 | Deploy, URL pública, documentação final do Challenge |

Entrego fase a fase, validando com você antes de avançar. Aprovando, começo pela Fase 1.
