# Palette's Journal - VTR Gestão IA UX & Accessibility Learnings

## 2025-05-18 - Mobile Header & Dynamic List Icon-Only Buttons

**Learning:** Dynamic file attachment lists and condensed mobile layout headers in this app frequently use icon-only buttons (`<X />`, `<MessageSquarePlus />`) without accessible names (`aria-label`), leaving screen reader users without context for interactive actions.
**Action:** Always verify icon-only buttons in list items and headers carry descriptive `aria-label` attributes (e.g. including item names dynamically for removals).
