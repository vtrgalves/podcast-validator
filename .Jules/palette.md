## 2026-03-31 - Keyboard Visibility for Hover-Revealed Actions & Icon Buttons

**Learning:** Icon-only action buttons hidden with `opacity-0` on hover containers (like thread list items) become completely inaccessible to keyboard users navigating via Tab unless explicit `focus:opacity-100 focus-visible:opacity-100` classes and focus outline rings are supplied.
**Action:** Always combine `group-hover:opacity-100` with `focus:opacity-100 focus-visible:opacity-100` and meaningful `aria-label`s whenever creating hover-revealed action buttons.
