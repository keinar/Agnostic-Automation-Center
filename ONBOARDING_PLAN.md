# Agnox — Empty State Onboarding Tour Plan

> **Status:** DRAFT — Awaiting approval before any React/driver.js code is written.
> **Scope:** `buildEmptyStateTour()` in `OnboardingWidget.tsx` — the flow triggered when `executions.length === 0`.
> **Architecture note:** Agnox executes tests by pulling a **Docker image** from Docker Hub and running it in a managed container. There is no Git URL input anywhere in the platform. Tests run against a **target environment URL** (Dev / Staging / Prod). This tour reflects that reality.

---

## Architectural Context (Why This Flow)

```
User pushes Docker image to Docker Hub
        ↓
User configures Settings → Run Settings:
    • Docker Image  (e.g. myorg/playwright-tests:latest)
    • DEV / Staging / Prod target URLs
        ↓
User clicks "Run" on the Dashboard
    → Launch Modal pre-fills from saved settings
    → POST /api/execution-request
        ↓
Producer enqueues task to RabbitMQ
        ↓
Worker pulls image, spins container, streams logs back
        ↓
Execution appears in Dashboard (PENDING → RUNNING → PASSED/FAILED)
        ↓
User opens Execution Drawer → Logs, AI Triage, Reports
```

---

## Tour Steps

---

### Step 1 — Navigate to Settings

| Field | Value |
|---|---|
| **Step Number** | 1 of 8 |
| **Step Name** | Go to Settings |
| **data-testid target** | `sidebar-nav-settings` *(exists)* |
| **Trigger Condition** | Advance automatically when `window.location.pathname.startsWith('/settings')` — poll every 150 ms via `setInterval`. |
| **driver.js `showButtons`** | `['close']` — Next is hidden; the user must click Settings to advance. |
| **Instructional Copy** | **Title:** `🚀 Let's run your first test!` **Body:** `First, we need to tell Agnox which Docker image to execute. Click **Settings** in the sidebar to get started.` |

---

### Step 2 — Navigate to Run Settings tab

| Field | Value |
|---|---|
| **Step Number** | 2 of 8 |
| **Step Name** | Open Run Settings |
| **data-testid target** | `sidebar-settings-tab-run-settings` *(exists — generated as `sidebar-settings-tab-${id}` in Sidebar.tsx, where `id = 'run-settings'`)* |
| **Trigger Condition** | Advance automatically when `document.querySelector('[data-testid="run-settings-docker-image"]')` exists in the DOM — watch via `MutationObserver` on `document.body`. |
| **driver.js `showButtons`** | `['close']` — Next is hidden; the user must click the tab to advance. |
| **Instructional Copy** | **Title:** `Run Settings` **Body:** `Click the **Run Settings** tab. This is where you configure the Docker image and environment URLs that Agnox uses every time you trigger a test.` |

---

### Step 3 — Configure Docker Image

| Field | Value |
|---|---|
| **Step Number** | 3 of 8 |
| **Step Name** | Set Your Docker Image |
| **data-testid target** | `run-settings-docker-image` ⚠️ **NEEDS TO BE ADDED** to the `<input id="rs-docker-image">` element in `RunSettingsTab.tsx` |
| **Trigger Condition** | Standard step — user reads the popover and clicks **Next →**. |
| **driver.js `showButtons`** | `['previous', 'next', 'close']` (default) |
| **Instructional Copy** | **Title:** `Your Docker Image` **Body:** `Enter the full Docker Hub image name for your test suite — for example, <code>myorg/playwright-tests:latest</code>. Agnox pulls this image and runs it in a secure, isolated container. No Git URL needed.` |

---

### Step 4 — Configure Environment URLs

| Field | Value |
|---|---|
| **Step Number** | 4 of 8 |
| **Step Name** | Set Target URLs |
| **data-testid target** | `run-settings-dev-url` ⚠️ **NEEDS TO BE ADDED** to the `<input id="rs-dev-url">` element in `RunSettingsTab.tsx` |
| **Trigger Condition** | Standard step — user reads the popover and clicks **Next →**. |
| **driver.js `showButtons`** | `['previous', 'next', 'close']` (default) |
| **Instructional Copy** | **Title:** `Target Environment URLs` **Body:** `Set the base URL for each environment (Dev, Staging, Prod). Agnox injects the selected URL as <code>BASE_URL</code> into your container at runtime — no hardcoded URLs in your tests required.` |

---

### Step 5 — Save Settings

| Field | Value |
|---|---|
| **Step Number** | 5 of 8 |
| **Step Name** | Save Your Configuration |
| **data-testid target** | `run-settings-submit` *(exists)* |
| **Trigger Condition** | Advance automatically when `window.location.pathname === '/dashboard'` OR when `document.querySelector('[data-testid="dashboard-run-button"]')` appears — poll via `setInterval` every 150 ms after the button is highlighted. This lets the user actually click Save before the tour moves on. |
| **driver.js `showButtons`** | `['previous', 'close']` — Next is hidden; the user must click **Save Settings** to advance. |
| **Instructional Copy** | **Title:** `Save & Head Back` **Body:** `Hit **Save Settings** to lock in your configuration. The tour will automatically continue back on the Dashboard as soon as your settings are saved.` |

---

### Step 6 — Trigger an Execution

| Field | Value |
|---|---|
| **Step Number** | 6 of 8 |
| **Step Name** | Run Your First Test |
| **data-testid target** | `dashboard-run-button` ⚠️ **NEEDS TO BE ADDED** to the `<button onClick={() => setIsModalOpen(true)}>` element in `Dashboard.tsx` |
| **Trigger Condition** | Advance automatically when `document.querySelector('[data-testid="executions-table"] tbody tr')` exists AND the first execution's status is `RUNNING` or `PENDING` — watch via `MutationObserver`. |
| **driver.js `showButtons`** | `['previous', 'close']` — Next is hidden; the user must click Run to advance. |
| **Instructional Copy** | **Title:** `Fire it up!` **Body:** `Click **Run**. The Launch Modal will pre-fill with the image and URL you just configured. Confirm and hit **Run** — Agnox will pull your Docker image, spin up a container, and start streaming live logs immediately.` |

---

### Step 7 — Observe Live Status

| Field | Value |
|---|---|
| **Step Number** | 7 of 8 |
| **Step Name** | Watch the Live Run |
| **data-testid target** | `executions-table` *(exists)* |
| **Trigger Condition** | Advance automatically when `document.querySelector('[data-testid="execution-drawer-tab-bar"]')` appears in the DOM — watch via `MutationObserver` on `document.body`. This means the user has clicked a row and the Execution Drawer has opened. |
| **driver.js `showButtons`** | `['previous', 'close']` — Next is hidden; the user must click a row to advance. |
| **Instructional Copy** | **Title:** `Your Test is Running!` **Body:** `Your execution just appeared in the table. The status badge will update in real-time from **PENDING → RUNNING → PASSED / FAILED** via WebSocket. **Click any row** to open the detail drawer and continue the tour.` |

---

### Step 8 — Explore the Execution Drawer

| Field | Value |
|---|---|
| **Step Number** | 8 of 8 |
| **Step Name** | Logs, AI Triage & Reports |
| **data-testid target** | `execution-drawer-tab-bar` *(exists)* |
| **Trigger Condition** | Final step. User clicks **Done** to complete the tour. `onDestroyStarted` fires `onStepComplete('view-execution')` to mark the checklist item as complete. |
| **driver.js `showButtons`** | `['previous', 'close']` with **Done** button visible. |
| **Instructional Copy** | **Title:** `Your Execution at a Glance` **Body:** `The detail drawer gives you everything in one place:<br>• **Logs tab** — live Docker stdout/stderr streamed in real-time<br>• **AI Triage tab** — Gemini automatically analyses failures and suggests root causes<br>• **Artifacts tab** — download HTML and Allure reports when the run completes<br><br>You're all set. Happy testing! 🎉` |

---

## Summary of `data-testid` Attributes to Add Before Implementation

| Element | File | `data-testid` Value | Status |
|---|---|---|---|
| Docker Image `<input>` | `RunSettingsTab.tsx` (line ~323) | `run-settings-docker-image` | ⚠️ **Must add** |
| DEV URL `<input>` | `RunSettingsTab.tsx` (line ~343) | `run-settings-dev-url` | ⚠️ **Must add** |
| "Run" `<button>` | `Dashboard.tsx` (line ~257) | `dashboard-run-button` | ⚠️ **Must add** |
| Settings sidebar nav link | `Sidebar.tsx` | `sidebar-nav-settings` | ✅ Exists |
| Run Settings tab link | `Sidebar.tsx` | `sidebar-settings-tab-run-settings` | ✅ Exists |
| Save Settings `<button>` | `RunSettingsTab.tsx` (line ~408) | `run-settings-submit` | ✅ Exists |
| Executions table | `ExecutionList.tsx` | `executions-table` | ✅ Exists |
| Drawer tab bar | `ExecutionDrawer.tsx` | `execution-drawer-tab-bar` | ✅ Exists |

---

## Navigation Strategy (Cross-Page Transitions)

The tour must survive React Router page transitions. The same pattern used in the existing `buildEmptyStateTour` applies throughout:

| Transition | Mechanism |
|---|---|
| Dashboard → Settings (Step 1) | `setInterval` polling `window.location.pathname` every 150 ms |
| Settings landing → Run Settings tab (Step 2) | `MutationObserver` watching `document.body` for `[data-testid="run-settings-docker-image"]` |
| Save Settings → back to Dashboard (Step 5) | `setInterval` polling `window.location.pathname === '/dashboard'` every 150 ms |
| Run button clicked → first row appears (Step 6) | `MutationObserver` watching for a `<tr>` inside `[data-testid="executions-table"] tbody` |
| Execution row clicked → drawer open (Step 7) | `MutationObserver` watching for `[data-testid="execution-drawer-tab-bar"]` |

All observers and intervals must be cleaned up via a `cleanupAll()` function called in every `onDeselected` and `onDestroyStarted` handler to prevent memory leaks.

---

## What Is NOT Changing

- The existing **`buildTour()`** (executions > 0 path) is **untouched**.
- The **checklist items** in `CHECKLIST_ITEMS` are **untouched**.
- The `OnboardingWidget` component shell and persistence logic are **untouched**.
- The `RunSettingsTab` interface for `gitRepositoryUrl` has already been removed as part of Task 1 cleanup (this plan document was created after that fix was applied).
