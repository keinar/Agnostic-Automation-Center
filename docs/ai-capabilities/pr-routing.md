---
id: pr-routing
title: Smart PR Routing
sidebar_position: 5
---

# Smart PR Routing

Automatically trigger targeted test runs when code is pushed to your repository — routing only the **relevant test folder** based on the changed files.

> **Requires:** `prRouting` feature flag enabled in **Settings → Features**.

---

## How It Works

When a push event is received:

1. The webhook payload's `commits[].modified` / `added` / `removed` file lists are extracted.
2. The AI maps the changed file paths to the most appropriate test folder in your project configuration.
3. A test execution is automatically dispatched to RabbitMQ using your project's Run Settings.
4. The webhook response includes `{ taskId, targetFolder, reasoning, dispatchedAt }` — the `reasoning` field explains why that folder was selected.

---

## GitHub Setup

1. Go to **Settings → Run Settings** and enable the **Smart PR Routing** toggle.
2. Copy the **Webhook URL** displayed in the callout:
   ```
   https://api.agnox.dev/api/webhooks/ci/pr?token=<orgId>
   ```
3. In your **GitHub** repository, go to **Settings → Webhooks → Add webhook**:
   - **Payload URL:** paste the copied URL
   - **Content type:** `application/json`
   - **Events:** select **Just the push event**
   - Click **Add webhook**

---

## GitLab Setup

1. In your **GitLab** project, go to **Settings → Webhooks**.
2. Paste the Webhook URL in the **URL** field.
3. Under **Trigger**, check **Push events**.
4. Click **Add webhook**.

---

## Webhook Response

```json
{
  "taskId": "abc123",
  "targetFolder": "tests/api",
  "reasoning": "Changed files include API route handlers; routing to API test folder.",
  "dispatchedAt": "2026-03-04T10:00:00.000Z"
}
```

---

## Related

- [AI Configuration & BYOK →](./configuration)
- [GitHub Actions Integration →](../integrations/github-actions)
- [Running Executions →](../core-features/executions)
