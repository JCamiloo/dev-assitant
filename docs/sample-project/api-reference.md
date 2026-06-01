# TaskFlow API Reference

## Base URL

```
https://api.taskflow.app/v1
```

For local development:

```
http://localhost:3000/v1
```

## Authentication

TaskFlow uses **Bearer tokens (JWT)** to authenticate all requests to protected endpoints.

### Obtain a Token

```http
POST /v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Successful response (200):**

```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "tokenType": "Bearer"
}
```

### Use the Token

Include the token in the `Authorization` header of each request:

```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Refresh Token

The access token expires in 15 minutes. Use the refresh token to obtain a new one:

```http
POST /v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### User Registration

```http
POST /v1/auth/register
Content-Type: application/json

{
  "name": "John Smith",
  "email": "john@example.com",
  "password": "MySecurePassword123!"
}
```

**Response (201):**

```json
{
  "user": {
    "id": "usr_01HXYZ123",
    "name": "John Smith",
    "email": "john@example.com",
    "createdAt": "2024-01-15T10:00:00Z"
  },
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Tasks

### Task Model

```typescript
interface Task {
  id: string; // "tsk_01HXYZ123"
  title: string; // Maximum 255 characters
  description?: string; // Maximum 10,000 characters (Markdown)
  status: "todo" | "in_progress" | "done" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  projectId?: string; // Project reference
  assigneeId?: string; // Assigned user
  creatorId: string; // User who created the task
  dueDate?: string; // ISO 8601: "2024-03-15T17:00:00Z"
  tags: string[]; // ["backend", "bug", "frontend"]
  createdAt: string;
  updatedAt: string;
}
```

### GET /tasks — List Tasks

Returns a paginated list of tasks for the authenticated user.

```http
GET /v1/tasks?status=todo&priority=high&limit=20&cursor=tsk_01HXYZ
Authorization: Bearer {token}
```

**Query parameters:**

| Parameter    | Type   | Description                                                  |
| ------------ | ------ | ------------------------------------------------------------ |
| `status`     | string | Filter by status: `todo`, `in_progress`, `done`, `cancelled` |
| `priority`   | string | Filter by priority: `low`, `medium`, `high`, `urgent`        |
| `projectId`  | string | Filter by project                                            |
| `assigneeId` | string | Filter by assigned user                                      |
| `tags`       | string | Filter by tags (comma-separated): `bug,frontend`             |
| `limit`      | number | Results per page (1-100, default: 20)                        |
| `cursor`     | string | Cursor for pagination                                        |
| `sortBy`     | string | Sort field: `createdAt`, `dueDate`, `priority`               |
| `sortOrder`  | string | `asc` or `desc` (default: `desc`)                            |

**Response (200):**

```json
{
  "data": [
    {
      "id": "tsk_01HXYZ123",
      "title": "Implement JWT authentication",
      "status": "in_progress",
      "priority": "high",
      "dueDate": "2024-02-01T17:00:00Z",
      "tags": ["backend", "auth"],
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-16T09:30:00Z"
    }
  ],
  "pagination": {
    "total": 47,
    "limit": 20,
    "nextCursor": "tsk_01HABC456",
    "hasMore": true
  }
}
```

### POST /tasks — Create Task

```http
POST /v1/tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Review authentication PR",
  "description": "# Description\n\nReview PR #42 that implements JWT...",
  "priority": "high",
  "projectId": "prj_01HXYZ999",
  "assigneeId": "usr_01HABC123",
  "dueDate": "2024-02-15T17:00:00Z",
  "tags": ["review", "auth"]
}
```

**Required fields:** `title`

**Response (201):**

```json
{
  "data": {
    "id": "tsk_01HNEW789",
    "title": "Review authentication PR",
    "status": "todo",
    "priority": "high",
    "projectId": "prj_01HXYZ999",
    "assigneeId": "usr_01HABC123",
    "creatorId": "usr_01HCURRENT",
    "dueDate": "2024-02-15T17:00:00Z",
    "tags": ["review", "auth"],
    "createdAt": "2024-01-20T14:30:00Z",
    "updatedAt": "2024-01-20T14:30:00Z"
  }
}
```

### GET /tasks/:id — Get Task

```http
GET /v1/tasks/tsk_01HXYZ123
Authorization: Bearer {token}
```

**Response (200):** Complete `Task` object.

**Errors:**

- `404` — Task not found or no permission to view

### PUT /tasks/:id — Update Task

Partial update (only sent fields are updated):

```http
PUT /v1/tasks/tsk_01HXYZ123
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "done",
  "priority": "medium"
}
```

**Response (200):** Updated `Task` object.

**Errors:**

- `404` — Task not found
- `403` — No permission to edit this task

### DELETE /tasks/:id — Delete Task

```http
DELETE /v1/tasks/tsk_01HXYZ123
Authorization: Bearer {token}
```

**Response (204):** No body.

> **Note:** Only the task creator or a project administrator can delete it.

---

## Projects

### Project Model

```typescript
interface Project {
  id: string; // "prj_01HXYZ999"
  name: string;
  description?: string;
  ownerId: string; // Project owner
  members: ProjectMember[];
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ProjectMember {
  userId: string;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: string;
}
```

### GET /projects — List Projects

```http
GET /v1/projects?limit=10
Authorization: Bearer {token}
```

**Response (200):**

```json
{
  "data": [
    {
      "id": "prj_01HXYZ999",
      "name": "TaskFlow Backend",
      "description": "Main REST API",
      "ownerId": "usr_01HOWNER",
      "taskCount": 23,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 10,
    "hasMore": false
  }
}
```

### POST /projects — Create Project

```http
POST /v1/projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "My New Project",
  "description": "Optional description"
}
```

**Response (201):** Created `Project` object.

---

## Users

### GET /users/me — Current User Profile

```http
GET /v1/users/me
Authorization: Bearer {token}
```

**Response (200):**

```json
{
  "data": {
    "id": "usr_01HXYZ123",
    "name": "John Smith",
    "email": "john@example.com",
    "avatar": "https://cdn.taskflow.app/avatars/usr_01HXYZ123.jpg",
    "plan": "pro",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### PUT /users/me — Update Profile

```http
PUT /v1/users/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Smith Jr."
}
```

---

## Rate Limiting

Each authenticated user can make **100 requests per minute**.

Rate limiting headers are present in all responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1706793600
```

When the limit is exceeded:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 23

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Try again in 23 seconds.",
    "retryAfter": 23
  }
}
```

---

## Pagination

TaskFlow uses **cursor-based pagination** to efficiently handle large collections.

### Iterate Through All Pages

```typescript
let cursor: string | undefined;
let allTasks: Task[] = [];

do {
  const response = await fetch(
    `/v1/tasks?limit=100${cursor ? `&cursor=${cursor}` : ""}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const { data, pagination } = await response.json();

  allTasks = [...allTasks, ...data];
  cursor = pagination.hasMore ? pagination.nextCursor : undefined;
} while (cursor);
```

---

## Error Codes

| Code  | Description                                                |
| ----- | ---------------------------------------------------------- |
| `400` | Bad Request — Invalid data in body                         |
| `401` | Unauthorized — Token missing or expired                    |
| `403` | Forbidden — No permission for this action                  |
| `404` | Not Found — Resource does not exist                        |
| `409` | Conflict — Resource already exists (e.g., duplicate email) |
| `422` | Unprocessable Entity — Validation failed                   |
| `429` | Too Many Requests — Rate limit exceeded                    |
| `500` | Internal Server Error — Server error                       |

### Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid data",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      }
    ]
  }
}
```
