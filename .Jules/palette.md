## 2025-05-18 - Icon-Only Buttons in Lists and Responsive Headers

**Learning:** Icon-only action buttons (such as dynamic file removal `<button>` elements in upload forms or topbar action `<Button>` triggers) often miss explicit `aria-label` attributes and `focus-visible` styling, rendering them inaccessible to screen readers and keyboard navigation users.
**Action:** Whenever rendering icon-only buttons (e.g. `<X />` or `<MessageSquarePlus />`), always pass descriptive `aria-label`s (including item context like `f.name` where applicable) and apply `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring` focus indicators.
