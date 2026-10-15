## 2026-08-08 - Keyboard Visibility for Hover-Revealed Buttons
**Learning:** Icon buttons inside list items that rely solely on `group-hover:opacity-100` to be revealed are invisible to keyboard-only users navigating via Tab.
**Action:** Always combine `group-hover:opacity-100` with `focus-visible:opacity-100` and focus ring styles on hover-triggered action buttons.
