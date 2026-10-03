## 2026-03-31 - Keyboard Focus Visibility for Action Buttons & Icon Labels

**Learning:** Hover-revealed action buttons (e.g. thread deletion in sidebars or list items) often use `opacity-0` with `group-hover:opacity-100`. When a keyboard user tabs to these elements, they remain completely invisible unless explicit `focus-visible:opacity-100` and focus rings are applied. Additionally, icon-only buttons need descriptive `aria-label`s to inform assistive technologies.
**Action:** Always combine `focus-visible:opacity-100 focus-visible:ring-2` with `group-hover:opacity-100` on hover-revealed controls and pair all icon-only buttons with explicit `aria-label`s.
