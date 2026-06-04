---
name: base-ui-docs
description: Use when implementing or debugging components using @base-ui/react primitives to ensure alignment with current API and composition patterns.
---

# BaseUI Documentation & Implementation

## Overview
BaseUI provides unstyled, accessible primitives. The core principle is **Composition over Configuration**: you build components by composing small, specialized primitives rather than passing large configuration objects to a single component.

**Integration Note:** In this project, BaseUI is used as part of the Shadcn setup (refer to `components.json`), ensuring a seamless integration between BaseUI's accessibility and Shadcn's design system.

## When to Use
Use this skill whenever you are:
- Adding a new BaseUI component (Select, Combobox, Popover, etc.).
- Refactoring an existing BaseUI implementation.
- Debugging accessibility or interaction issues in BaseUI components.

**Do NOT use** for simple HTML elements or components that don't require complex accessibility patterns.

## Core Implementation Pattern
BaseUI follows a strict hierarchical composition pattern.

### 1. The Composition Hierarchy
Almost every BaseUI component follows this structure:
`Root` $\rightarrow$ `Trigger` $\rightarrow$ `Positioner` $\rightarrow$ `Portal` $\rightarrow$ `Content/List` $\rightarrow$ `Item`

**Example: Select Component**
- `<Select.Root>`: Manages the state and accessibility context.
- `<Select.Trigger>`: The button that opens the menu.
- `<Select.Positioner>`: Handles the absolute positioning logic.
- `<Select.Portal>`: Renders the content into a DOM portal.
- `<Select.Content>`: The container for the options.
- `<Select.Item>`: Individual selectable options.

### 2. Styling Strategy
Since BaseUI is unstyled, you MUST provide styles via Tailwind CSS.
- Use `data-` attributes provided by BaseUI for state styling (e.g., `data-highlighted`, `data-selected`).
- Avoid inventing custom state hooks (like `useSelect`) for logic that the `Root` primitive already handles.

## Workflow for New Components

1. **Fetch Current Docs**: 
   Retrieve the latest API reference for the specific component. 
   **REQUIRED SOURCE:** Use `https://base-ui.com/llms.txt` to get the most accurate and up-to-date LLM-friendly documentation. **Do not rely on internal training data.**
2. **Map Primitives**: 
   Identify all necessary primitives (Root, Trigger, etc.) required for the desired behavior.
3. **Implement Composition**: 
   Build the component using the hierarchy above.
4. **Apply Styling**: 
   Add Tailwind classes, utilizing `data-` attributes for interactive states.
5. **Verify Accessibility**: 
   Ensure keyboard navigation and ARIA roles are correctly handled by the primitives.

## Common Mistakes & Fixes

| Mistake | Reality | Fix |
|---|---|---|
| **Inventing Hooks** | Creating `useSelect` or `useCombobox` to manage state | Use the state provided by `<Root>` or use the provided `use...` hook from the library if it exists. |
| **Skipping Positioner** | Putting `Content` directly in `Root` | Always use `<Positioner>` and `<Portal>` to avoid clipping issues and ensure correct placement. |
| **Hardcoded States** | Using local `useState` for `isOpen` | Use the `open` and `onOpenChange` props on the `Root` component for controlled state. |
| **Ignoring Data Attrs** | Styling based on local state | Use CSS selectors like `[data-highlighted]` to style the active item. |

## Real-World Impact
Using this pattern reduces bundle size (by removing redundant state logic) and ensures 100% compliance with WAI-ARIA standards without manual attribute management.
