# Palette's UX & Accessibility Journal

## 2025-03-02 - Action Buttons in Hover-Only Containers

**Learning:** Buttons in sidebar lists or cards that rely solely on hover (`opacity-0 group-hover:opacity-100`) are invisible to keyboard-only users who navigate with Tab.
**Action:** Always combine `group-hover:opacity-100` with `focus-visible:opacity-100` and clear focus ring styles (`focus-visible:ring-2`) so keyboard focus reveals the element.
