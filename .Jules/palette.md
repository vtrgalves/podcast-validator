## 2026-03-31 - Keyboard Focus Visibility for Conditionally Visible Action Buttons
**Learning:** Action buttons in list items styled with `opacity-0 group-hover:opacity-100` become invisible to keyboard users when tabbing through list items.
**Action:** Always include `focus-visible:opacity-100` alongside hover classes so interactive elements are fully accessible via keyboard navigation.
