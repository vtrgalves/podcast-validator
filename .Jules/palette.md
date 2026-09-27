## 2026-08-08 - Icon-only buttons accessibility and focus states
**Learning:** In list items with action buttons (such as attachment file items or sidebar conversation threads), icon-only buttons often lack `aria-label` attributes and focus-visible indicators needed for keyboard and screen reader accessibility.
**Action:** Always include dynamic `aria-label`s (e.g. `aria-label={`Remover anexo ${f.name}`}`) and `focus-visible:ring-2` styles on icon-only action buttons.
