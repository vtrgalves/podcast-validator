# Palette's UX & Accessibility Journal

## 2026-03-29 - Icon-Only Action Buttons Focus Visibility
**Learning:** Icon-only action buttons (such as file attachment remove buttons and thread item delete buttons) in list items or dark cards often lack clear focus indicators or remain invisible (`opacity-0`) when navigating via keyboard.
**Action:** Always add descriptive `aria-label` attributes and explicit `focus-visible` styling (`focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`) on icon-only buttons so screen readers announce their purpose and keyboard users can easily identify focused items.
