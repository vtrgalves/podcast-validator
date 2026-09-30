## 2026-08-08 - Tooltip and Keyboard Focus for Thread Actions

**Learning:** Icon-only action buttons in navigation sidebars (e.g. thread deletion) need both explicit tooltips for hover state and focus visibility styles (`focus:opacity-100`) so keyboard users can discover and trigger them when tabbing through items.
**Action:** When adding icon-only action buttons inside hover-revealed containers (`group-hover:opacity-100`), always include `focus:opacity-100` along with a `Tooltip` wrapper for complete accessibility.
