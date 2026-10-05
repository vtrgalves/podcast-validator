# Palette's UX & Accessibility Journal

## 2026-03-30 - Accessible Icon Buttons in Attachment Lists
**Learning:** Icon-only action buttons (like delete icons on dynamic attachment lists) frequently lack accessible names and visible focus indicators, making them unnavigable for screen reader and keyboard-only users.
**Action:** Always provide explicit `aria-label` (including item context, e.g. `Remover anexo ${f.name}`) and `focus-visible:ring-2` styles when adding icon buttons to list items.
