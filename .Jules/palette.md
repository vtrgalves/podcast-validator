## 2026-03-30 - Accessible Icon-Only Removal Buttons
**Learning:** Icon-only attachment removal buttons in file upload lists often lack descriptive context for screen readers and focus rings for keyboard navigation.
**Action:** Always include dynamic `aria-label={`Remover anexo ${f.name}`}` and `focus-visible:ring-2 focus-visible:ring-ring` on icon-only file removal buttons.
