# Skill: onboarding-tour-sync

Keeps the `driver.js` guided tour in `OnboardingWidget.tsx` perfectly in sync with the live UI.

---

## Trigger

Invoke this skill by running:

```
/onboarding-tour-sync
```

or by describing the task naturally:

- "Sync the onboarding tour"
- "Validate the guided tour steps"
- "Add a tour step for [feature]"
- "Fix the broken tour step"

---

## Behaviour: Validate

When invoked without an explicit addition request, the agent must:

1. **Read the tour source** — open `apps/dashboard-client/src/components/onboarding/OnboardingWidget.tsx` and extract every `element` selector used in the `steps` array (CSS selectors and `[data-testid="…"]` attributes).

2. **Scan the codebase** — for each selector:
   - If it uses `data-testid`, `grep` the entire `apps/dashboard-client/src/` tree for that attribute value.
   - If it uses a CSS class or element selector, perform an equivalent targeted search.

3. **Report findings** — produce a table:

   | Step | Selector | Status |
   |------|----------|--------|
   | Navigation Sidebar | `[data-testid="sidebar-desktop"]` | ✅ Found in `Sidebar.tsx:42` |
   | Smart Filters | `[data-testid="filter-bar"]` | ✅ Found in `FilterBar.tsx:305` |
   | … | … | … |

4. **Auto-correct broken references** — if a selector is NOT found:
   - Search for the component it likely refers to (e.g. search for the word "sidebar" or "filter bar" near relevant TSX).
   - Identify the correct existing `data-testid` or propose one.
   - Update the `element` string in `OnboardingWidget.tsx` to use the correct selector.
   - If the element has no `data-testid`, add one to the target component file.

5. **Final output** — summarise:
   - ✅ Steps validated (count)
   - 🔧 Steps auto-corrected (list)
   - ❌ Steps still broken (list, with suggested fix)

---

## Behaviour: Add a Tour Step

When the user asks to "add a tour step for [feature X]":

1. **Locate the feature** — find the relevant component file(s) for the named feature.

2. **Check for a `data-testid`** — if the feature's key element (button, panel, section) lacks a `data-testid`:
   - Add one following the naming convention: `data-testid="[feature-slug]-[element-slug]"` (e.g. `data-testid="stats-grid-kpi-card"`).

3. **Write the step** — append a new entry to the `steps` array in `buildTour()` inside `OnboardingWidget.tsx`:
   ```ts
   {
     element: '[data-testid="<new-testid>"]',
     popover: {
       title: '<Short, user-friendly title>',
       description: '<One or two sentences explaining what this feature does and why it matters to the user>',
       side: 'bottom',   // or 'right' / 'top' / 'left' — choose whichever avoids obscuring the element
       align: 'start',
     },
   },
   ```

4. **Position the step** — insert it at the most logical point in the tour flow (after the last element the user would naturally encounter before this one).

5. **Report** — state which file was modified, which `data-testid` was added (if any), and where the step was inserted.

---

## Files Owned by This Skill

| File | Purpose |
|------|---------|
| `apps/dashboard-client/src/components/onboarding/OnboardingWidget.tsx` | Tour config and checklist widget |
| `apps/dashboard-client/src/components/FilterBar.tsx` | Hosts `data-testid="filter-bar"` |
| `apps/dashboard-client/src/components/dashboard/ExecutionList.tsx` | Hosts `data-testid="executions-table"` |
| `apps/dashboard-client/src/components/Sidebar.tsx` | Hosts `data-testid="sidebar-desktop"` |
| `apps/dashboard-client/src/components/ExecutionDrawer.tsx` | Hosts `data-testid="execution-drawer-tab-bar"` |

---

## Constraints

- Never remove a tour step without explicit user instruction.
- All `data-testid` values must be lowercase kebab-case.
- Tour step descriptions must be written in plain English from the user's perspective (avoid jargon like "component" or "hook").
- Do not add more than one `data-testid` per element.
- Follow the project's Tailwind-only styling rule — never add inline styles when modifying component files.
