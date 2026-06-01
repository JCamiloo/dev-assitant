# Getting Started with TaskFlow API

This guide takes you from zero to making your first request in less than 5 minutes.

## Quick Start — 5 minutes

### Step 1: Get Your Credentials

1. Create an account at [taskflow.app/signup](https://taskflow.app/signup)
2. Go to **Settings → API Keys**
3. Click **"Create New API Key"**
4. Save the token in a secure place — it won't be shown again

### Step 2: Make Your First Request

```bash
# Verify the API is responding
curl https://api.taskflow.app/v1/health

# Expected response:
# {"status": "ok", "version": "1.4.2"}
```

### Step 3: Authenticate

```bash
curl -X POST https://api.taskflow.app/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "your-password"
  }'
```

Save the `accessToken` from the response:

```bash
export TASKFLOW_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Step 4: Create Your First Task

```bash
curl -X POST https://api.taskflow.app/v1/tasks \
  -H "Authorization: Bearer $TASKFLOW_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My first task with TaskFlow API",
    "priority": "high",
    "tags": ["getting-started", "test"]
  }'
```

Done! You just created your first task via API.

---

## Autenticación con JWT

TaskFlow usa JWT (JSON Web Tokens) con algoritmo RS256.

### Flujo de autenticación

```
Usuario → POST /auth/login → [accessToken (15min) + refreshToken (7 días)]
     ↓
Usar accessToken en headers de cada request
     ↓
Cuando expire → POST /auth/refresh con refreshToken → nuevo accessToken
```

### Implementación en JavaScript

```javascript
class TaskFlowClient {
  constructor(baseURL = "https://api.taskflow.app/v1") {
    this.baseURL = baseURL;
    this.accessToken = null;
    this.refreshToken = null;
  }

  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) throw new Error("Login fallido");

    const { accessToken, refreshToken } = await response.json();
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  async request(path, options = {}) {
    const response = await fetch(`${this.baseURL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    // Si el token expiró, renovarlo automáticamente
    if (response.status === 401) {
      await this.refreshAccessToken();
      return this.request(path, options); // Reintentar
    }

    return response.json();
  }

  async refreshAccessToken() {
    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });

    const { accessToken } = await response.json();
    this.accessToken = accessToken;
  }
}
```

---

## Webhooks

Webhooks allow TaskFlow to notify your application when important events occur.

### Available Events

| Event                  | Description                       |
| ---------------------- | --------------------------------- |
| `task.created`         | A new task was created            |
| `task.updated`         | A task was updated                |
| `task.completed`       | A task moved to `done` status     |
| `task.deleted`         | A task was deleted                |
| `project.member.added` | A member was added to the project |

### Configure a Webhook

```http
POST /v1/webhooks
Authorization: Bearer {token}
Content-Type: application/json

{
  "url": "https://my-app.com/webhooks/taskflow",
  "events": ["task.created", "task.completed"],
  "secret": "my-secret-to-verify"
}
```

### Verify Webhook Signature

Each webhook request includes an `X-TaskFlow-Signature` header with an HMAC-SHA256 of the body:

```typescript
import { createHmac } from "crypto";

function verifyWebhook(
  body: string,
  signature: string,
  secret: string,
): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex");

  return `sha256=${expected}` === signature;
}

// In your webhook endpoint:
app.post("/webhooks/taskflow", (req, res) => {
  const signature = req.headers["x-taskflow-signature"] as string;
  const isValid = verifyWebhook(
    JSON.stringify(req.body),
    signature,
    process.env.WEBHOOK_SECRET!,
  );

  if (!isValid) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const { event, data } = req.body;

  switch (event) {
    case "task.completed":
      console.log(`Task completed: ${data.task.title}`);
      break;
    // ... handle other events
  }

  res.json({ received: true });
});
```

---

## Official SDKs

### JavaScript / TypeScript

```bash
npm install @taskflow/sdk
```

```typescript
import { TaskFlowClient } from "@taskflow/sdk";

const client = new TaskFlowClient({
  apiKey: process.env.TASKFLOW_API_KEY,
});

// Create a task
const task = await client.tasks.create({
  title: "My task",
  priority: "high",
});

// List tasks
const { data: tasks } = await client.tasks.list({
  status: "todo",
  limit: 20,
});

// Update a task
await client.tasks.update(task.id, {
  status: "done",
});
```

### Python

```bash
pip install taskflow-python
```

```python
from taskflow import TaskFlowClient

client = TaskFlowClient(api_key=os.environ["TASKFLOW_API_KEY"])

# Create a task
task = client.tasks.create(
    title="My task",
    priority="high"
)

# List tasks
tasks = client.tasks.list(status="todo", limit=20)
```

---

## Frequently Asked Questions (FAQ)

### How do I handle pagination for large collections?

TaskFlow uses cursor-based pagination. The `nextCursor` field in the response is the cursor for the next page. When `hasMore` is `false`, you've reached the end.

```javascript
// Get all tasks in a project
async function getAllTasks(projectId) {
  let cursor = undefined;
  let allTasks = [];

  do {
    const result = await client.tasks.list({
      projectId,
      limit: 100,
      cursor,
    });

    allTasks.push(...result.data);
    cursor = result.pagination.hasMore
      ? result.pagination.nextCursor
      : undefined;
  } while (cursor);

  return allTasks;
}
```

### What do I do if I get a 429 error?

Respect the `Retry-After` header which indicates how many seconds to wait:

```javascript
async function requestWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After") || "60");
      console.log(`Rate limit reached. Waiting ${retryAfter}s...`);
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      continue;
    }

    return response;
  }
  throw new Error("Max retries reached");
}
```

### My token expired, what do I do?

Access tokens last 15 minutes. When you receive `401 Unauthorized`, use the refresh token to get a new one:

```javascript
const { accessToken } = await fetch("/v1/auth/refresh", {
  method: "POST",
  body: JSON.stringify({ refreshToken: myRefreshToken }),
}).then((r) => r.json());
```

Refresh tokens last 7 days. If the refresh token also expires, the user must log in again.

### Can I use the API without JavaScript or Python?

Yes. The API accepts any HTTP client that supports JSON. Examples with other tools:

```bash
# With HTTPie
http POST api.taskflow.app/v1/tasks \
  Authorization:"Bearer $TOKEN" \
  title="My task" priority=high

# With curl
curl -X POST https://api.taskflow.app/v1/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "My task", "priority": "high"}'
```

### How do I add members to a project?

```http
POST /v1/projects/{projectId}/members
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "new.member@example.com",
  "role": "member"
}
```

Available roles: `admin`, `member`, `viewer`.

### Can I filter tasks by multiple tags?

Yes, pass tags separated by commas:

```http
GET /v1/tasks?tags=bug,frontend&status=todo
```

This returns tasks that have the `bug` tag OR the `frontend` tag (logical OR). For logical AND, filter on the client after getting the results.
