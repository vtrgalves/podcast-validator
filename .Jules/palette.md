# Palette Journal

## 2025-11-05 - Confirmation Dialog & Focus Visibility for Destructive Actions
**Learning:** In sidebar lists with hover-revealed action buttons (like delete thread), buttons hidden with `opacity-0` become invisible traps for keyboard navigation unless paired with `focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1`. Immediate destructive deletion without confirmation causes accidental loss of context.
**Action:** Always provide accessible `AlertDialog` confirmation for permanent deletions and ensure hover-reveal controls remain fully visible and highlighted when navigating via keyboard focus.
