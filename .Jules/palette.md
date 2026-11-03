# Palette's Journal - Critical Learnings Only

## 2025-05-18 - Dual-state Feedback on AI Message Copy Actions
**Learning:** In AI conversation flows generating dense strategic text, users frequently copy full recommendations into external docs. Icon-only action buttons require both accessible screen reader status (`sr-only` dynamic labels) and visual cues (temporary icon swap plus toast confirmation) to provide clear feedback across mouse, touch, and keyboard/screen reader modalities without cluttering the chat bubble.
**Action:** When adding message actions to AI message streams, use `MessageAction` with `aria-label`/`tooltip` reflecting dynamic state ("Copiar resposta" -> "Copiado!") alongside a brief 2-second visual confirmation and toast feedback.
