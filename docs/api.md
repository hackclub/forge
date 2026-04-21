| title | API |
| description | Public API for Forge project data |
| --- | --- |

# Forge API

Base URL: `https://forge.hackclub.com/api/v1`

No authentication required. All endpoints are read-only.

## Projects

### List all projects

```
GET /api/v1/projects
```

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `query` | string | Search by name or description |
| `status` | string | Filter by status: `draft`, `pitch_pending`, `pitch_approved`, `pending`, `approved`, `returned`, `rejected` |
| `tier` | string | Filter by tier: `tier_1`, `tier_2`, `tier_3`, `tier_4` |
| `page` | integer | Page number (default: 1) |
| `per_page` | integer | Results per page, 1–100 (default: 25) |

**Example:**

```
GET /api/v1/projects?status=approved&tier=tier_1&per_page=10
```

**Response:**

```json
{
  "data": [
    {
      "id": 42,
      "name": "Hex Bot",
      "subtitle": "Mostly 3D printed 3D printer",
      "description": "AI-generated admin summary...",
      "status": "approved",
      "tier": "tier_2",
      "tags": ["3D-printed", "DIY"],
      "repo_link": "https://github.com/user/repo",
      "cover_image_url": "https://...",
      "coin_rate": 5.5,
      "total_hours": 12.5,
      "coins_earned": 68.75,
      "built_at": "2026-04-15T00:00:00Z",
      "build_proof_url": "https://...",
      "devlog_count": 3,
      "user": {
        "id": 99,
        "display_name": "Jane D",
        "avatar": "https://..."
      },
      "created_at": "2026-04-10T05:35:14Z",
      "updated_at": "2026-04-15T12:00:00Z"
    }
  ],
  "pagination": {
    "count": 47,
    "page": 1,
    "per_page": 25,
    "pages": 2,
    "next": 2,
    "prev": null
  }
}
```

### Get a single project

```
GET /api/v1/projects/:id
```

Returns the same fields as the list endpoint, plus `devlogs` and `kudos_count`.

**Response (additional fields):**

```json
{
  "data": {
    "...": "same as above",
    "devlogs": [
      {
        "id": 1,
        "title": "Designed the PCB layout",
        "content": "Markdown content...",
        "time_spent": "3 hours",
        "created_at": "2026-04-11T10:00:00Z"
      }
    ],
    "kudos_count": 5
  }
}
```

## Users

### Get a user profile

```
GET /api/v1/users/:id
```

**Response:**

```json
{
  "data": {
    "id": 99,
    "display_name": "Jane D",
    "avatar": "https://...",
    "github_username": "janed",
    "joined_at": "2026-03-01T00:00:00Z",
    "stats": {
      "total_hours": 45.2,
      "projects_count": 3,
      "current_streak": 7,
      "longest_streak": 14
    },
    "projects": [
      {
        "id": 42,
        "name": "Hex Bot",
        "subtitle": "Mostly 3D printed 3D printer",
        "status": "approved",
        "tier": "tier_2",
        "cover_image_url": "https://...",
        "total_hours": 12.5,
        "created_at": "2026-04-10T05:35:14Z"
      }
    ]
  }
}
```

## Project Statuses

| Status | Description |
|--------|-------------|
| `draft` | Just created, not yet submitted |
| `pitch_pending` | Slack pitch submitted, awaiting pitch review (tier 1 only) |
| `pitch_approved` | Pitch approved, builder is working on it (tier 1 only) |
| `pending` | Submitted for final review |
| `approved` | Final approval; project complete |
| `returned` | Sent back for changes |
| `rejected` | Not accepted |

## Tiers

| Tier | Coin Rate | Description |
|------|-----------|-------------|
| `tier_1` | 7c/hr | Advanced ($200+), requires Slack pitch |
| `tier_2` | 5.5c/hr | Bigger builds ($0–200) |
| `tier_3` | 4.5c/hr | Standard ($0–100) |
| `tier_4` | 4c/hr | Basic ($0–50) |
