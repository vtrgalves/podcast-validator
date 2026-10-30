# Palette's Journal - UX & Accessibility Learnings

## 2026-10-30 - Form Controls and Dynamic Attachment Actions
**Learning:** `Select` triggers (radix/shadcn) and file inputs must have explicit `id`/`htmlFor` label associations and `aria-label`s on icon-only action buttons (such as dynamic file removal triggers) to ensure proper screen reader support and form field focus tracking.
**Action:** Always associate `Label` `htmlFor` with `SelectTrigger` `id` and include descriptive dynamic `aria-label`s for file list removal buttons in form inputs.
