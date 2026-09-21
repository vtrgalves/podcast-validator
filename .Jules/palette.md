## 2025-02-14 - Keyboard Focus States for Hidden Sidebar Actions
**Learning:** Sidebar list items that reveal destructive action buttons on `group-hover` hide those buttons from keyboard users who tab through list links.
**Action:** Always include `focus:opacity-100 group-focus-within:opacity-100 focus-visible:outline-none focus-visible:ring-2` on hidden action buttons inside grouped items.
