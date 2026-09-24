## 2026-08-08 - Keyboard Visibility for Group-Hover Action Buttons
**Learning:** In sidebar thread lists and cards, action buttons (e.g. delete icons) are often visually hidden with `opacity-0` until hovered (`group-hover:opacity-100`). Keyboard users tabbing through elements can focus these buttons while they remain invisible.
**Action:** Always combine `group-hover:opacity-100` with `focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring` to ensure keyboard focus reveals the element and displays a clear focus ring.
