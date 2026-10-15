# Palette's Journal - UX & Accessibility Learnings

## 2025-02-25 - Sidebar Icon Action Focus Visibility

**Learning:** Hover-revealed action buttons (`opacity-0 group-hover:opacity-100`) remain invisible when tabbing with keyboard navigation unless `focus-visible:opacity-100` is explicitly set.
**Action:** Pair `group-hover:opacity-100` with `focus-visible:opacity-100` and wrap icon-only buttons with `Tooltip` for visual clarity.
