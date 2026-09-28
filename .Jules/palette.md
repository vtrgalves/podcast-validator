## 2025-05-18 - Accessibility for Dynamic Counters and Icon-only Action Buttons

**Learning:** Form textareas with character counters need explicit `aria-describedby` and `aria-live="polite"` associations so screen reader users receive real-time limits, while icon-only attachment action buttons require explicit `aria-label`, `title`, and visible focus rings.

**Action:** Whenever creating dynamic input counters or icon-only removal buttons, ensure proper ARIA labelling and live region declarations.
