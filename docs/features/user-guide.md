# User Guide

Complete walkthrough of the Agnox platform features.

---

## 1. Getting Started

### Sign Up
1. Navigate to the **Sign Up** page.
2. Enter your **email**, **password**, and **name**.
3. Enter your **organization name** (your company/team name).
4. Click **Create Account**.

> Your organization is created automatically, and you become the **Admin**.

### Join via Invitation
1. Receive an email invitation from a team member.
2. Click the **Accept Invitation** link.
3. **New users:** Create an account with the token.
4. **Existing users:** Log in to join the new organization.

---

## 2. Navigating the Dashboard

### Light / Dark Theme

The dashboard supports a **Light** and **Dark** theme. Use the theme toggle icon in the top-right of the header to switch between modes. Your preference is persisted in `localStorage` and applied automatically on every subsequent visit.

### Getting Started Checklist

New users see a floating **Getting Started** widget in the bottom-right corner of the dashboard. It contains a 3-item interactive checklist that guides you through the core Agnox workflow:

| # | Item | Action |
|---|------|--------|
| 1 | **Connect Docker Image** | Launches an 11-step guided tour through Run Settings → first test execution → Investigation Hub |
| 2 | **Run Your First Test** | Resumes the same guided tour at the execution step |
| 3 | **Explore Platform Features** | Launches a 5-step platform discovery tour spotlighting Test Cases, Test Cycles, Team Members, and Env Variables |

- Click **Start** on any item to begin its guided tour. Driver.js highlights each relevant UI element with a spotlight overlay and step-by-step instructions.
- Completed items show a **Replay** badge and remain clickable — you can revisit any tour at any time.
- Click **×** on the widget header to dismiss it. You can reopen it at any time from the **Getting Started** button (rocket icon) at the bottom of the sidebar.

> **Tip:** The guided tour uses `allowClose: false` — use the **Next** / **Done** buttons to advance rather than clicking outside the spotlight.

### Changelog

The current application version is shown at the bottom of the sidebar. Click the version number (e.g., `v3.1.0`) to open the **Changelog** modal, which summarises the features and fixes shipped in recent sprints.

---

## 3. Project & Run Settings

Before running tests, you must configure your project settings.

### Creating a Project
1. Go to **Settings** → **Run Settings**.
2. Click **Create New Project**.
3. Enter:
   - **Project Name**: e.g., "Web App E2E"
   - **Docker Image**: The image you pushed to Docker Hub (e.g., `myuser/my-tests:latest`)
   - **Test Folder**: Path to tests inside container (default: `.` or `tests/`)

### Configuring Environments & Variables
For each project, define base URLs for your environments:
- **Development**
- **Staging**
- **Production**

These URLs are injected into your test container as `BASE_URL` at runtime.

Additionally, under **Settings** → **Env Variables**, you can define custom variables per-project. These are securely encrypted in the database and injected directly into your test container at runtime, eliminating the need for local `.env` files for test credentials.

---

## 4. Running Tests

### Option A: Via Dashboard (Recommended)

1. Click **Run Test** (top right).
2. Select your **Project** (settings are pre-filled from Run Settings).
3. Select the **Environment** (Dev/Staging/Prod).
4. (Optional) Override the folder path.
5. (Optional) Enter a **Group Name** - this is a smart Combobox: select an existing group from the dropdown to append the run to it, or type a new name to dynamically create a new group.
6. Click **Start Execution**.

> **Note:** The Agnox CLI (`npx @agnox/agnox-cli@latest init`) is used for **onboarding only** - generating your Dockerfile and pushing your image. Test execution is triggered via the Dashboard or API.

### Option B: Via API
See [API Keys section](#9-api-keys-cicd-integration) below.

### Option C: CI/CD Integration (GitHub Actions)
Generate an API key and use the API to trigger tests from your CI pipeline.

---

## 5. Execution Management

The dashboard provides powerful tools for organizing and acting on test runs at scale.

### Flat vs. Grouped Views

Use the **View** toggle (top-right of the execution list) to switch between two display modes:

- **Flat View (default):** All executions are listed in reverse-chronological order. Best for reviewing recent activity at a glance.
- **Grouped View:** Executions are aggregated by their `groupName`. Each group header displays a pass/fail summary badge and the timestamp of the most recent run. Click any group header to expand or collapse its child executions.

Both views support the full filter bar (status, environment, date range) and pagination controls.

### Bulk Actions

Select one or more execution rows using the checkboxes on the left. A floating **Bulk Actions** bar appears at the bottom of the screen with the following operations:

- **Assign Group** - Opens a popover where you can type a group name and apply it to all selected executions simultaneously.
- **Ungroup** - Removes the `groupName` assignment from all selected executions, returning them to the ungrouped pool.
- **Delete** - Soft-deletes up to 100 selected executions in a single API call. Deleted records are retained in the database to preserve billing accuracy and are excluded from all dashboard views.

---

## 6. Team Management (Admin Only)

### Inviting Members
1. Go to **Settings** → **Team Members**.
2. Click **Invite Member**.
3. Enter email and select role:
   - **Admin**: Full access (billing, settings, invites)
   - **Developer**: Run tests, view results
   - **Viewer**: Read-only access

### Managing Roles
- **Promote/Demote**: Change roles via the dropdown in the member list.
- **Remove**: Click the trash icon to remove a member.

---

## 7. Billing & Plans

Manage subscriptions in **Settings** → **Billing & Plans**.

### Plan Limits

| Feature | Free | Team | Enterprise |
|---------|------|------|------------|
| **Test Runs/Month** | 100 | 1,000 | Unlimited |
| **Projects** | 1 | 10 | Unlimited |
| **Team Members** | 3 | 20 | Unlimited |
| **Concurrent Runs** | 1 | 5 | 20 |
| **Storage** | 1 GB | 10 GB | 100 GB |
| **AI Analysis** | ✅ | ✅ | ✅ |

> **Note:** Limits are enforced automatically. Upgrading takes effect immediately.

---

## 8. API Keys (CI/CD Integration)

Use API keys to authenticate CI/CD pipelines without sharing personal credentials.

### Generating a Key
1. Go to **Settings** → **Profile** → **API Access**.
2. Click **Generate New Key**.
3. Enter a label (e.g., "GitHub Actions").
4. **Copy the key** immediately (it won't be shown again).

### Using the Key
Add the `x-api-key` header to your requests:

```bash
curl -H "x-api-key: pk_live_..." ...
```

### Triggering Tests from CI/CD Pipelines

Use the dedicated `POST /api/ci/trigger` endpoint to start a test cycle from a pipeline and pass CI context (repository, PR number, commit SHA) for automatic cycle naming and traceability.

**Step 1 — Get your Project ID:**
Go to **Settings → Run Settings**, select your project, and copy the **Project ID** shown at the top of the Execution Defaults section.

**Step 2 — Call the endpoint from your pipeline:**

```bash
curl -X POST https://api.agnox.dev/api/ci/trigger \
  -H "Content-Type: application/json" \
  -H "x-api-key: $AGNOX_API_KEY" \
  -d '{
    "projectId": "<your-project-id>",
    "image": "myorg/my-tests:latest",
    "command": "npx playwright test",
    "folder": "tests/e2e",
    "config": {
      "environment": "staging",
      "baseUrl": "https://staging.myapp.com"
    },
    "ciContext": {
      "source": "github",
      "repository": "myorg/my-repo",
      "prNumber": 42,
      "commitSha": "abc1234"
    }
  }'
```

The endpoint returns `{ cycleId, taskId, status: "PENDING" }`. The cycle appears immediately in **Test Cycles** with a name derived from the repository and PR number.

---

## 9. AI Analysis & Results

### Live Results
- Check the **Dashboard** for real-time logs via WebSocket.
- Status updates: `PENDING` → `RUNNING` → `ANALYZING` → `PASSED` / `FAILED` / `UNSTABLE` / `ERROR`.

### AI Root Cause Analysis (Investigation Hub)
If a test fails:
1. Click on any execution row in the dashboard to open the **Investigation Hub** (side drawer).
2. Select the **AI Analysis** tab (third tab) to view the diagnosis and suggested fix. The analysis is produced by a two-step pipeline: an **Analyzer** model generates an initial structured diagnosis, then a **Critic** model validates it against the raw logs and eliminates hallucinations before presenting the final output. Note: The AI Analysis tab is hidden if the execution status is `ERROR`, as AI cannot effectively analyze platform or container launch errors.
3. AI analysis can be disabled per-organization in **Settings** → **Organization**.

### Investigation Hub
Click any execution row to open the slide-over **Investigation Hub** drawer:
- **Terminal tab:** Live log stream with auto-scroll toggle and `.txt` download.
- **Artifacts tab:** Media gallery of screenshots, videos, and downloadable trace zips from the test run.
- **AI Analysis tab:** Gemini-powered root cause analysis for failed executions.

The drawer URL updates with `?drawerId=<taskId>` - links can be copied and shared directly.

---

## 10. CRON Schedules

Automate recurring test runs without CI/CD pipelines.

### Creating a Schedule
1. Click **Run** to open the Execution Modal.
2. Switch to the **Schedule Run** tab (top of the modal).
3. Fill in the standard run fields (project, environment, folder).
4. Enter a **Schedule Name** (used as the `groupName` for all triggered executions).
5. Enter or select a **CRON Expression** (e.g., `0 2 * * *` = daily at 02:00 UTC). Use the preset buttons for common intervals.
6. Click **Save Schedule**.

The schedule is immediately registered in the live scheduler - no server restart needed.

### Managing Schedules
Go to **Settings** → **Schedules** to see a table of all active CRON schedules for your organization:
- **Name**, **CRON Expression**, **Environment**, **Folder**
- Click **Delete** to permanently remove a schedule and cancel its next execution.

> **Note:** Viewer role cannot delete schedules.

### Slack Notifications
To receive a Slack message whenever a test run completes:
1. Go to **Settings** → **Connectors**.
2. Under the **Slack** card, paste your Slack **Incoming Webhook URL**. (This is optional to modify if the integration is already connected).
3. Select which test execution statuses (PASSED, FAILED, ERROR, UNSTABLE) should trigger notifications.
4. Click **Save Webhook**.

Notifications are generated according to your selected statuses. Failed executions include a truncated AI analysis snippet and a direct link to the Investigation Hub.

### CI/CD Connectors
The dashboard displays "Connected" status badges for Jira, GitHub, GitLab, and Azure DevOps connector cards when valid credentials have been securely stored.

---

## 11. Test Cases (Quality Hub)

Build and manage a repository of manual and automated test cases.

### Creating a Test Case
1. Navigate to **Test Cases** from the sidebar.
2. Select your **Project** from the dropdown.
3. Click **New Test Case** to open the creation drawer.
4. Fill in:
   - **Title**: Name of the test case (e.g., "Login flow with invalid credentials")
   - **Suite**: Grouping label (e.g., "Authentication", "Checkout")
   - **Priority**: LOW / MEDIUM / HIGH / CRITICAL
   - **Steps**: Add individual test steps with Action and Expected Result

### AI-Powered Step Generation
1. In the test case drawer, click **Generate with AI**.
2. Enter a natural-language intent (e.g., "Test the checkout flow with a coupon code").
3. Gemini generates a structured array of test steps automatically.
4. Review and edit the generated steps before saving.

### Managing Test Cases
- Test cases are grouped by **Suite** using collapsible accordions.
- Click any test case row to open the edit drawer.
- Delete test cases using the trash icon in the test case row.

---

## 12. Test Cycles & Manual Execution Player

Hybrid test cycles combine manual and automated tests into a single, unified workflow.

### Creating a Hybrid Cycle
1. Navigate to **Test Cycles** from the sidebar.
2. Select your **Project**.
3. Click **Create Cycle** to open the Cycle Builder drawer.
4. Enter a **Cycle Name**.
5. Select **Manual Tests** from the suite-grouped checklist.
6. (Optional) Enable **Include Automated Test Run** - requires run settings (Docker image, base URL) to be configured in Settings.
7. Click **Launch Cycle**.

> When launched, AUTOMATED items are immediately pushed to RabbitMQ for execution. MANUAL items remain PENDING until a QA engineer executes them.

### Viewing Cycle Details
- Click any cycle row in the table to **expand** and see all items.
- **AUTOMATED items**: Display status badge and execution ID.
- **MANUAL items**: Display status badge and an **Execute** button.

### Manual Execution Player
1. Click **Execute** on a MANUAL item to open the Manual Execution drawer.
2. Each test step is displayed as an interactive checklist.
3. Click **Pass**, **Fail**, or **Skip** on each step.
4. Steps auto-advance to the next pending item.
5. Click **Complete Test** to submit results.

> Cycle status automatically transitions to **COMPLETED** when all items (manual + automated) reach a terminal state.

---

## 13. Native Playwright Reporter

Stream live Playwright results directly to your Agnox dashboard from your existing CI pipelines — no Docker container required.

### Installing the Reporter

```bash
npm install --save-dev @agnox/playwright-reporter
```

### Configuring Playwright

```typescript
// playwright.config.ts
import AgnoxReporter from '@agnox/playwright-reporter';

export default defineConfig({
  reporter: [
    ['list'],
    [AgnoxReporter, {
      apiKey:    process.env.AGNOX_API_KEY,
      projectId: process.env.AGNOX_PROJECT_ID,
      // Optional options:
      // environment: 'staging',   // 'development' | 'staging' | 'production'
      // runName: 'nightly suite', // label shown in the Dashboard
      // debug: true,              // logs reporter activity to stdout
    }],
  ],
});
```

Your **API Key** is in **Settings → Profile → API Access**. Your **Project ID** is in **Settings → Run Settings** (Execution Defaults section).

### How It Works

1. When Playwright starts, the reporter calls `/api/ingest/setup` and receives a `sessionId`.
2. As tests run, events (`test-begin`, `test-end`, `log`) are batched and sent to `/api/ingest/event`.
3. When Playwright finishes, the reporter calls `/api/ingest/teardown` with pass/fail/skip counts. The execution record is created and appears in the Dashboard.

The reporter automatically detects your CI provider (GitHub Actions, GitLab CI, Azure DevOps, Jenkins) and attaches the repository, branch, PR number, and commit SHA to every run.

### Filtering by Source

Use the **Source** filter on the Dashboard to distinguish:
- **Agnox Hosted** — runs executed inside Docker containers orchestrated by Agnox
- **External CI** — runs streamed by `@agnox/playwright-reporter` from your CI pipelines

### Reliability

- All reporter errors are caught and suppressed. If the Agnox API is unreachable, the reporter is a silent no-op — your test suite is never affected.
- Events are batched (default: 2 s flush interval, 50 events per batch) to minimize HTTP overhead.

---

## 15. AI Quality Orchestrator

The AI Quality Orchestrator is a suite of five AI-powered features that help your team find bugs faster, detect flaky tests, optimize test cases, automate PR routing, and query your test data in natural language.

> **Enabling AI Features:** All AI features default to **off** (opt-in model). Enable them individually in **Settings → Features** under the "AI Features" section. Configure your preferred AI model and optional Bring-Your-Own-Key (BYOK) API keys in **Settings → Security**.

---

### Configuring AI — BYOK (Settings → Security)

Agnox ships with platform-managed LLM keys as a convenience. To use your own cloud account keys (zero extra cost to your Agnox plan), configure **Bring Your Own Key (BYOK)**:

1. Go to **Settings → Security** and scroll to the **AI Configuration** section.
2. Under **Default AI Model**, select the model all AI features will use by default:
   - `gemini-2.5-flash` *(default — fastest, best for most workloads)*
   - `gpt-4o`
   - `claude-3-5-sonnet`
3. For each provider you want to supply your own key for, locate its row in the **Bring Your Own Key** table:
   - Status shows **"Using Platform Default"** (grey) until a key is provided, or **"Configured"** (green) when your key is active.
   - Paste your API key into the masked input field and click **Save Key**.
   - To rotate or remove a key, click **Remove** — the platform fallback key is used immediately.
4. Click **Save Settings**.

> **Security:** Keys are encrypted at rest using **AES-256-GCM** before being persisted in MongoDB. Plaintext keys are never stored, logged, or returned by any API response. The `resolveLlmConfig()` utility on the server is the **only** code path that decrypts a BYOK key, and only at the moment of an LLM call.

| Setting | Options | Description |
|---------|---------|-------------|
| **Default AI Model** | `gemini-2.5-flash`, `gpt-4o`, `claude-3-5-sonnet` | Applied to all AI features unless overridden |
| **BYOK — Gemini** | Optional | Your Google AI Studio or Vertex AI key |
| **BYOK — OpenAI** | Optional | Your OpenAI platform key |
| **BYOK — Anthropic** | Optional | Your Anthropic Console key |

---

### A. Auto-Bug Generator

Automatically generate a structured Jira-ready bug report from a failed execution's logs.

**How it works:**
1. Open any **FAILED** or **ERROR** execution in the Investigation Hub drawer.
2. Click **Auto Bug** (Sparkles icon) at the top of the drawer.
3. The system fetches the execution's full log output from MongoDB. If the output exceeds 80,000 characters, it is smart-truncated: the **first 10%** (container start-up context) and **last 90%** (where errors concentrate) are retained, with a `[LOG TRUNCATED]` marker inserted so you always see where the crop occurred.
4. The AI analyses the truncated log and generates a structured report containing:
   - **Title** — concise bug title
   - **Steps to Reproduce** — ordered list
   - **Expected Behavior** and **Actual Behavior**
   - **Severity** — `critical` / `high` / `medium` / `low`
   - **Code Patches** — file path + suggested fix snippet (where detectable)
5. Review and edit any field in the **Auto Bug** modal before submitting.
6. Click **Submit to Jira** to pre-fill the Jira ticket creation modal with the finalized content.

> **Requires:** `autoBugGeneration` feature flag enabled in **Settings → Features**.

---

### B. Flakiness Detective (Stability Page)

Analyze a test group's execution history to detect flaky tests and receive actionable recommendations.

1. Navigate to **Stability** in the sidebar (visible when `flakinessDetective` is enabled).
2. Select a **group name** from the dropdown.
3. Click **Analyze Stability**.
4. Review the results:
   - **Flakiness Score** (0–100 gauge) — higher = more flaky
   - **Verdict badge**: Stable / Mildly Flaky / Flaky / Highly Unstable
   - **Findings** — specific patterns observed in the execution history (e.g., intermittent timeouts, environment-specific failures)
   - **Recommendations** — actionable steps to improve stability
5. Past analyses are listed in the history panel. Click any row to reload it without a new LLM call.

> **Note:** The analysis fetches the last 20 executions for the selected group. Only `status`, `error`, and `output` fields are projected to keep the DB payload small.

> **Requires:** `flakinessDetective` feature flag enabled.

---

### C. Smart Test Optimizer

Convert selected test cases into clean, standardized **BDD (Behavior-Driven Development)** steps — with duplicate detection, edge-case suggestions, and a Dual-Agent validation pass to ensure quality.

**BDD Conversion Flow:**
1. Navigate to **Test Cases**.
2. Select one or more test cases using the checkboxes (up to **20 per batch**).
3. Click **Optimize with AI** in the floating Bulk Actions bar.
4. The optimizer runs a two-pass pipeline:
   - **Pass 1 — Analyzer (temperature 0.4):** Reads each test case's existing steps and rewrites them in `Given / When / Then` BDD format, identifies exact duplicate step text across cases, and proposes additional edge-case scenarios.
   - **Pass 2 — Critic (temperature 0.0):** Reviews each Analyzer output against the original steps. Overrides any suggestion that is not grounded in the original intent. Eliminates hallucinated steps.
5. The result is presented in the **Optimized Test Cases** modal as a side-by-side diff:
   - **Left pane:** Original steps
   - **Right pane:** Proposed BDD steps with rationale annotations
   - **Edge Cases panel:** New scenarios recommended by the Analyzer
6. Accept or reject per case:
   - Click **Apply Optimization** to save a single case's changes via `PUT /api/test-cases/:id`.
   - Click **Apply All** to save all approved optimizations in one action.

> **Requires:** `testOptimizer` feature flag enabled.

---

### D. Smart PR Routing

Automatically trigger targeted test runs when code changes are pushed to your repository, routing only the relevant test folder based on the changed files.

**Webhook Setup (GitHub):**
1. Go to **Settings → Run Settings** and enable the **Smart PR Routing** toggle.
2. Copy the **Webhook URL** displayed in the callout (format: `https://api.agnox.dev/api/webhooks/ci/pr?token=<orgId>`).
3. In your **GitHub** repository, go to **Settings → Webhooks → Add webhook**:
   - **Payload URL:** paste the copied URL
   - **Content type:** `application/json`
   - **Events:** select **Just the push event**
   - Click **Add webhook**.

**Webhook Setup (GitLab):**
1. In your **GitLab** project, go to **Settings → Webhooks**.
2. Paste the Webhook URL in the **URL** field.
3. Under **Trigger**, check **Push events**.
4. Click **Add webhook**.

**How it works:**
- When a push is detected, the webhook payload's `commits[].modified` / `added` / `removed` lists are extracted.
- The AI maps the changed file paths to the most appropriate test folder in your project configuration.
- A test execution is automatically dispatched to RabbitMQ using your project's Run Settings.
- The webhook response includes `{ taskId, targetFolder, reasoning, dispatchedAt }` — the `reasoning` field explains why that folder was selected.

> **Requires:** `prRouting` feature flag enabled.

---

### E. Quality Chatbot (Ask AI)

Ask natural-language questions about your test data and receive instant answers with optional inline charts — no SQL or query language required.

**Using the Chatbot:**
1. Navigate to **Ask AI** in the sidebar (visible when `qualityChatbot` is enabled).
2. Type a question in the input field. Example queries:
   - *"How many tests failed last week?"*
   - *"What's the pass rate for the checkout group?"*
   - *"Which test images have the highest failure count this month?"*
   - *"Show me a breakdown of test results by environment for February 2026."*
3. The AI translates your question into a MongoDB aggregation pipeline and executes it securely against your organization's data.
4. The summarized answer appears as an assistant message.
5. When the response includes numeric comparisons or grouped counts, a **bar chart** is rendered inline below the answer.
6. Previous conversations appear in the **left panel** — click any session to continue a prior chat. Conversations are stored for **24 hours** and then automatically purged.

**Supported Chart Types:**
- **Bar chart** — for ranked or grouped comparisons (e.g., failures by image)
- **Line chart** — for time-series data (e.g., daily pass rate over 30 days)
- **Pie chart** — for distribution breakdowns (e.g., status proportions)

**Security model:** Every LLM-generated pipeline is sanitized through a mandatory **5-layer guard** before execution:

| Layer | What it does |
|-------|--------------|
| 1. Stage allowlist | Rejects any pipeline stage not in the approved set (`$match`, `$group`, `$project`, `$sort`, `$limit`, `$count`, `$addFields`, `$unwind`, etc.) — `$out`, `$merge`, `$function`, `$where` are always blocked |
| 2. Force `organizationId` | Overwrites (not merges) the `organizationId` field in the first `$match` stage with the authenticated user's org ID — LLM output cannot read another org's data |
| 3. `$limit` cap | Appends `{ $limit: 500 }` if absent; clamps any `$limit` above 1000 to 1000 |
| 4. Collection whitelist | Only allows queries against `executions` and `test_cycles` — no access to `users`, `organizations`, or other collections |
| 5. Operator scan | Recursively scans all values for `$`-prefixed strings in field-name positions that are not in the operator allowlist |

> **Requires:** `qualityChatbot` feature flag enabled.

---

### Dual-Agent (Actor-Critic) Architecture

Several AI features — including **Root Cause Analysis**, **Test Case Optimizer**, and **Auto-Bug Generator** — use a **Dual-Agent pipeline** to deliver high-quality, hallucination-resistant output:

```
┌──────────────────────────────────────────────────────────────────┐
│  STEP 1: Analyzer (Actor)                                        │
│  Model: gemini-2.5-flash  •  Temperature: 0.4                    │
│  Output: Structured JSON { rootCause, suggestedFix }             │
│          (or BDD steps, bug report, depending on feature)        │
└───────────────────────────┬──────────────────────────────────────┘
                            │ structured output
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 2: Critic (Evaluator)                                      │
│  Model: gemini-2.5-flash  •  Temperature: 0.0  (deterministic)   │
│  Input: Raw logs + Analyzer output                               │
│  Task: Validate every claim against source evidence.             │
│        Override hallucinated or unsupported suggestions.         │
│  Output: Final developer-facing Markdown                         │
└──────────────────────────────────────────────────────────────────┘
```

**Why two passes?**
- The Analyzer (temperature 0.4) generates creative, detailed suggestions but can occasionally hallucinate file names or APIs not present in the logs.
- The Critic (temperature 0.0, fully deterministic) cross-checks every claim against the raw evidence. Any suggestion not grounded in the provided logs is overridden before the output reaches the user.
- This pattern prevents the most common failure mode of single-pass LLM analysis: confident but wrong answers.

---

## 14. Support

- **Documentation**: [docs.agnox.dev](https://docs.agnox.dev)
- **Email**: info@digital-solution.co.il
