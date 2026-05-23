
# VTR Gestão IA — Podcast Strategy Validator

Plataforma SaaS premium em português que valida estrategicamente ideias de podcasts (mercado, monetização, patrocínio, retenção) gerando um relatório executivo via IA. Estética inspirada em Linear/Stripe/Notion, paleta azul-escuro + roxo + verde nos CTAs.

## Escopo desta entrega (MVP funcional ponta-a-ponta)

1. **Landing page premium** (rota `/`)
2. **Fluxo de validação** (rota `/validar`) — formulário + upload
3. **Tela de processamento** com mensagens dinâmicas premium
4. **Relatório executivo** (rota `/relatorio/:id`) com 8 cards + métricas
5. **Backend** com Lovable Cloud + Lovable AI Gateway (Gemini)

Login, histórico, export PDF, CRM e dashboard ficam preparados arquiteturalmente, mas não são implementados nesta primeira entrega — para manter foco no fluxo de validação que é o core.

---

## 1. Landing page (`src/routes/index.tsx`)

Seções, na ordem:

- **Nav** minimalista — logo VTR Gestão IA (uso da imagem enviada) + links âncora + CTA "Validar meu Podcast"
- **Hero** — headline "Valide seu podcast antes de investir meses produzindo." + subheadline + 2 CTAs (primário verde / secundário ghost). À direita: mockup do dashboard executivo (componente React real, não imagem) mostrando score, radar, e cards de monetização
- **Problemas do mercado** — 6 cards modernos com ícones (lucide-react) e as dores exatas do brief
- **Como funciona** — 3 etapas numeradas com visual de pipeline
- **Diferencial** — bloco destacando que valida modelo de mídia / negócio / patrocinabilidade, não só conteúdo
- **Preview do relatório** — mini visual do output (radar + scorecards + recomendação GO/AJUSTES/NO-GO)
- **CTA final** + **Footer** executivo

Microanimações com `framer-motion` (já comum no template — confirmo e instalo se faltar). Sem hype de IA, tom executivo.

## 2. Fluxo de validação (`src/routes/validar.tsx`)

- Textarea principal "Descreva seu podcast" (máx 700 chars com contador)
- Campos opcionais: Nicho (input), Público-alvo (input), Objetivo (select), Formato (select)
- Upload opcional (PDF/DOCX/PPTX/TXT) — guardado em Lovable Cloud Storage, texto extraído server-side quando possível (PDF/TXT no MVP; DOCX/PPTX = enviar nome + nota de contexto)
- Botão "Gerar diagnóstico estratégico" → cria registro em DB e navega para `/processando/:id`

## 3. Tela de processamento (`/processando/:id`)

- Animação premium: gradient orb + barra de progresso + partículas leves
- Rotaciona as mensagens dinâmicas do brief ("Analisando diferenciação do nicho…" etc.)
- Em paralelo, chama o server function que invoca a IA. Quando retornar (5–15s), navega para `/relatorio/:id`

## 4. Relatório executivo (`/relatorio/:id`)

Header: nome sugerido do podcast + score geral + badge (Alto Potencial / Médio / Alto Risco — cor verde/âmbar/vermelho).

Grid de 8 cards conforme brief:
1. Estrutura do Podcast
2. Potencial de Mercado
3. Potencial de Monetização (com lista de marcas/categorias sugeridas)
4. Retenção e Audiência
5. Posicionamento Estratégico
6. Riscos
7. Roadmap Estratégico (checklist)
8. Recomendação Final (GO / GO COM AJUSTES / NO-GO + justificativa)

Bloco "Métricas Executivas":
- Radar chart (recharts) com os 9 scores do brief
- Gauges/progress bars complementares
- Scorecards numéricos premium

CTA no fim: "Falar com a VTR Gestão" (lead capture — abre dialog com nome/email/whatsapp, grava em tabela `leads`).

## 5. Identidade visual (`src/styles.css`)

Tokens semânticos em oklch:
- `--background` azul-escuro profundo (~oklch(0.18 0.04 265))
- `--foreground` branco-off
- `--primary` roxo gradient anchor (~oklch(0.55 0.22 300))
- `--accent` verde CTA (~oklch(0.72 0.18 155))
- `--card` azul-escuro elevado com sombra suave
- Gradientes: `--gradient-brand` (roxo→magenta, como o logo), `--gradient-hero`
- Sombras suaves customizadas, radius generoso
- Tipografia: Inter para corpo + display font premium (ex: Space Grotesk) — importadas via `<link>` no `__root.tsx`

Componentes shadcn já disponíveis serão usados (Button, Card, Badge, Dialog, Select, Textarea, Progress, Tabs).

## 6. Backend (Lovable Cloud + Lovable AI)

**Habilitar Lovable Cloud** + **Lovable AI Gateway**.

Tabelas (migration):
- `validations` — id, created_at, input_description, niche, audience, objective, format, attachments (jsonb), status, report (jsonb), score int
- `leads` — id, created_at, validation_id, name, email, whatsapp, message
- Storage bucket `attachments` (privado)

RLS: permissivas no MVP (sem auth ainda) — INSERT público, SELECT por id. Documentar que precisa endurecer ao adicionar login.

Server function (`src/lib/validate.functions.ts`):
- `createValidation({...})` → grava no DB e retorna id
- `runValidation(id)` → busca registro, monta prompt estratégico em português (system: "advisor de creator economy, estrategista de mídia premium, tom executivo"), chama Lovable AI Gateway (`google/gemini-3-flash-preview`) com **tool calling** para retornar JSON estruturado conforme schema do relatório (8 cards + 9 scores + recomendação + nome sugerido). Salva em `report` e atualiza `status`.
- `getValidation(id)` → leitura para o relatório

Tratamento explícito de 402/429 com mensagem amigável.

## 7. Assets

- `src/assets/logo-vtr.png` ← copiar de `user-uploads://VTR_GESTAO.png`
- `src/assets/logo-mark.png` ← copiar de `user-uploads://play.png` (favicon + marca compacta)

## 8. SEO

`head()` em cada rota com título/description em PT-BR, og:title/description. Title da home: "VTR Gestão IA — Valide seu podcast antes de investir".

---

## Detalhes técnicos

- Stack: TanStack Start (já no template) + React 19 + Tailwind v4 + shadcn + recharts + framer-motion
- Rotas em `src/routes/`: `index.tsx`, `validar.tsx`, `processando.$id.tsx`, `relatorio.$id.tsx`
- Server functions em `src/lib/*.functions.ts`
- Cliente Supabase via `@/integrations/supabase/client` (auto-gerado pelo Lovable Cloud)
- IA: `https://ai.gateway.lovable.dev/v1/chat/completions` via `LOVABLE_API_KEY` (server-side only), com `tool_choice` forçando o schema do relatório
- Upload: SDK supabase-js do client-side direto no bucket; nome do arquivo gravado em `attachments` jsonb

## Fora de escopo nesta entrega (preparado, não construído)

- Autenticação / login
- Histórico de validações por usuário
- Export PDF
- Dashboard analytics
- CRM completo (apenas tabela `leads` simples)
- Parser real de DOCX/PPTX (PDF/TXT funcionam; outros formatos: apenas referência por nome)

Pronto para implementar quando você aprovar.
