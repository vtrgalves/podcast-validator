## 2026-10-06 - Accessible Icon Buttons in AI Elements

**Learning:** Reusable chat components such as `ConversationScrollButton` and `ConversationDownload` render icon-only `<Button>` controls without default `aria-label` text, making them unannounced or opaque to screen readers.
**Action:** Always provide explicit default `aria-label` attributes (e.g. `aria-label="Rolar para o final"` or `aria-label="Baixar conversa"`) on icon-only buttons in reusable AI UI components while allowing consumer props to override them when necessary.
