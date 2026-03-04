---
id: flakiness-detective
title: Flakiness Detective
sidebar_position: 3
---

# Flakiness Detective (Stability Analysis)

Analyze a test group's execution history to detect flaky tests and receive actionable recommendations — powered by AI.

> **Requires:** `flakinessDetective` feature flag enabled in **Settings → Features**.

---

## How It Works

1. Navigate to **Stability** in the sidebar (visible when `flakinessDetective` is enabled).
2. Select a **group name** from the dropdown.
3. Click **Analyze Stability**.
4. Review the results:
   - **Flakiness Score** (0–100 gauge) — higher = more flaky
   - **Verdict badge**: `Stable` / `Mildly Flaky` / `Flaky` / `Highly Unstable`
   - **Findings** — specific patterns observed in the execution history (e.g., intermittent timeouts, environment-specific failures)
   - **Recommendations** — actionable steps to improve stability

> **Note:** The analysis fetches the **last 20 executions** for the selected group. Only `status`, `error`, and `output` fields are projected to keep the DB payload small.

---

## History Panel

Past analyses are listed in the **history panel** on the right side of the Stability page. Click any row to **reload a previous report** without triggering a new LLM call — useful for tracking improvement over time after applying recommendations.

---

## Flakiness Score Interpretation

| Score | Verdict |
|-------|---------|
| 0–20 | Stable |
| 21–45 | Mildly Flaky |
| 46–70 | Flaky |
| 71–100 | Highly Unstable |

---

## Related

- [AI Configuration & BYOK →](./configuration)
- [Running Executions →](../core-features/executions)
- [Scheduling →](../core-features/scheduling)
