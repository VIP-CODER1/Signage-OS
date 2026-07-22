---
name: ui-planner
description: Plan user interface and UX changes before coding — component breakdown, state shape, interaction flows, accessibility, responsive behavior. Use this skill whenever the user asks to design, mock up, plan, or think through a screen, page, component, form, dashboard, modal, or any UI. Also trigger on "how should this look", "wireframe this", "UX for X", "component breakdown", "design the flow for", or when the user is about to build UI without a plan.
---

# UI Planner

## When to invoke
Before writing any non-trivial UI code. Also when the user describes a user-facing feature without specifying component structure, state, or interaction model.

## Procedure

### 1. Understand the user job
- What is the user trying to accomplish? In one sentence, from their POV.
- What's the current flow (if any)? What's painful about it?
- What's the success state? What do they see/do when it worked?

### 2. Sketch the information architecture
- What data does the screen show? Where does it come from?
- What actions can the user take? What are their side effects?
- What navigation leads here, and where does it lead onward?

### 3. Component breakdown
For each screen/view:
- List components top-down, from page-level to leaf.
- Mark each as **new**, **reused**, or **modified**.
- For new components: name, purpose, props shape, state ownership.
- For reused: check they actually fit — don't force a mismatched reuse.

### 4. State shape
- What's local (component state)? What's shared (context/store)? What's server (fetched/mutated)?
- Optimistic updates? Loading states? Error states? Empty states?
- URL-driven state — what should be in the URL so refresh/share works?

### 5. Interaction flows
- Map every user action to its state transition.
- Include the failure paths — what does the user see when the network dies mid-action?
- Keyboard navigation — tab order, shortcuts, escape behavior.

### 6. Accessibility — non-negotiable
- Semantic HTML — use `<button>`, `<nav>`, `<main>`, not generic `<div>`.
- Keyboard operable — every interaction must work without a mouse.
- Screen reader — labels, ARIA where needed, focus management on route changes.
- Contrast — WCAG AA minimum (4.5:1 normal text).
- Motion — honor `prefers-reduced-motion`.

### 7. Responsive behavior
- Define breakpoints and what changes at each.
- What's the mobile-first minimum viable view?
- Touch targets (44x44px minimum).

### 8. Edge cases checklist
- Very long content (overflow, wrapping, truncation strategy)
- Very short content (empty states)
- Slow network (skeletons, not spinners, for known layouts)
- Offline
- RTL languages if relevant
- Zero results, one result, many results, pagination limits

## Output format

```markdown
## UI plan: <feature>

### User job
<one sentence>

### Components
- **PageX** (new) — props: { ... }, owns: routeState
  - **HeaderY** (reused)
  - **FormZ** (new) — props: { ... }
    - ...

### State
- Local: ...
- Shared: ...
- Server: ...
- URL: ...

### Flows
1. User clicks Submit
   - Optimistic: mark item saved
   - On success: toast, close modal
   - On failure: rollback, inline error

### A11y notes
- ...

### Responsive
- Mobile: ...
- Tablet: ...
- Desktop: ...

### Edge cases
- ...
```

## Anti-patterns to avoid
- Jumping to pixel-perfect mocks before the flow is right.
- "We'll add a11y later" — retrofitting accessibility is 5× the cost of building it in.
- Global state for everything — most state is local.
- Designing only the happy path and calling it done.
- Reinventing components that already exist in the design system.
