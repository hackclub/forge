---
applyTo: "**"
---

Keep your changes as low impact as possible. You do not need to give me a summary of changes. You do not need to test the changes. Try to reference other parts of the codebase to ensure your changes are consistent with the existing code style and practices. Keep your responses concise and focused.

Never add "Co-Authored-By" lines to commits. PR descriptions should be a simple description of the changes — nothing more. No test plans, no checklists, no headings, no marketing copy. One short paragraph (or a couple of plain sentences) is enough. Do not push code or create PRs unless explicitly asked. Do not add co-authorship attribution of any kind.

Read all context and instructions carefully before making changes. Code may be manually modified between messages. Do not suggest code that has been deleted or is no longer relevant.

This project uses ruby 3.4.4, rails 8.1.2 with React 19 and tailwind 4.1.18 through inertia-rails. Make sure to only suggest changes that are applicable to those versions. When possible, prefer to use the cli to generate boilerplate rather than editing files manually. You can always modify boilerplate generated from the cli.

Inertia acts as the internal bridge between rails and React. Please be careful what objects are passed across, as all attributes (even if unused in the frontend) are sent and can be viewed through developer tools. Inertia docs for LLMs is at: https://inertia-rails.dev/llms-full.txt

Pundit policies are also used and should be modified to fit. Please be careful as this pertains to security. If you are not sure about how to modify a policy, ask for clarification. Always ensure that you are following the principle of least privilege when modifying policies. Only give access to what is necessary for the feature to function properly. Do not give access to more than what is needed. Pundit documentation is available at: https://www.rubydoc.info/gems/pundit

HCB controls money for the program, DO NOT EDIT ANY CODE RELATED TO HCB WITHOUT EXPLICIT WRITTEN APPROVAL. Alert in the chat that you're making changes to HCB code before doing so. Do not run any tests and console code containing stuff related without EXPLICIT WRITTEN APPROVAL.

When adding changes, use rails, inertia, React and pundit best practices and patterns. Use partials and helpers to keep code DRY. Use concerns to share code between models and controllers. Use inertia's features to keep the site experience high quality. Use React hooks and JSX patterns. Keep performance in mind and minimize database queries (e.g. use includes, avoid n+1 queries). Use background jobs for long running tasks. Use caching where appropriate. In rails, if you add the private keyword, please make sure to check nothing else is affected, as often there will be more existing code after your changes. Private methods should always be at the bottom of the class.

When modifying code, ensure that you maintain existing functionality and do not introduce bugs. Ensure that your changes are well-integrated with the existing codebase and follow the project's coding standards and conventions. Use `git diff` to see what you changed and run checks `bin/rubocop -f github` and `bin/brakeman --no-pager` before finishing to ensure code quality and security. In those checks, if there are issues that are unrelated to your changes, flag them, but you don't have to fix them.

If asked to change the requirements or behavior of a feature, make sure previous implementations that you suggested are also updated to reflect the new requirements. Always ask questions when needed.

Do not add comments unless they are absolutely necessary for clarity. Your code should describe what it does, not comments. If you do add comments, ensure they are clear, concise, and relevant to the code they accompany. Do not add huge blocks of comments.

## Architecture Overview

Forge is a Hack Club program where teen builders (ages 13-18) get funded for hardware projects. Users pitch projects in Slack, admins review them, and approved builders document their progress via devlogs.

### Key Models
- **User** — has roles (user/admin/reviewer/support/fulfillment), permissions array, ban status, slack_id for Slack integration
- **Project** — belongs to user, has status enum (draft/pending/approved/returned/rejected/build_pending/build_approved), slack_channel_id/slack_message_ts for Slack thread tracking, pitch_text (cleaned user pitch), description (AI-generated admin summary), hidden flag
- **Ship** — belongs to project, represents a submission of work for review
- **Devlog** — belongs to project, markdown entries documenting build progress (title, content, time_spent)
- **SupportTicket** — tracks support questions from Slack with status (open/claimed/resolved), two-way thread sync between public and BTS channels
- **FeatureFlag** — simple name/enabled toggle for app-wide feature flags
- All models use `has_paper_trail` for audit logging

### Project Lifecycle
1. User posts pitch in `#into-the-forge` Slack channel
2. `SlackPitchJob` picks it up, uses Hack Club AI to clean formatting and generate admin summary
3. Project created as `pending`, bot replies in Slack thread
4. Admin reviews in `/admin/projects/:id` — can approve/return/reject with feedback
5. `SlackNotifyJob` posts decision back to the Slack thread
6. Once approved, user can add devlogs on the project page or sync from JOURNAL.md in their GitHub repo

### Slack Integration
- **Webhook endpoint:** `POST /slack/events` — receives Slack events, routes to pitch or support handlers
- **Interactivity endpoint:** `POST /slack/interactivity` — handles Block Kit button clicks (support ticket claim/resolve)
- **SlackPitchJob** — processes pitches, creates projects, replies in thread, adds :eyes: reaction
- **SlackNotifyJob** — posts review decisions back to Slack threads
- **SupportTicketJob** — processes support questions, auto-responds, posts to BTS channel with buttons
- **SupportRelayJob** — relays BTS thread replies to public thread with staff name/avatar
- **SupportForwardJob** — forwards public thread replies to BTS thread with user name/avatar
- Bot ignores its own messages (`bot_id`) and messages with subtypes
- Events controller routes by channel: forge channel → pitches, support channel → tickets, BTS channel threads → relay
- Required env vars: `SLACK_SIGNING_SECRET`, `SLACK_FORGE_CHANNEL_ID`, `SLACK_BOT_TOKEN`, `SLACK_SUPPORT_CHANNEL_ID`, `SLACK_BTS_CHANNEL_ID`
- Required Slack app scopes: `channels:history`, `groups:history`, `chat:write`, `chat:write.customize`, `reactions:write`
- Event subscription: `message.channels` and `message.groups`

### Admin Panel
- Dashboard at `/admin` with links filtered by user permissions
- **Projects** (`/admin/projects`) — table view, status filters, review panel with approve/return/reject/draft actions
- **Users** (`/admin/users`) — role management, permission toggles, ban/unban with reasons, soft/hard delete, restore, role filter
- **Support** (`/admin/support`) — support ticket list with stats, leaderboard, status filters. Detail page with Slack thread view, reply from web, claim/resolve/delete
- **Ships** (`/admin/reviews`) — review and manage ship submissions
- **Feature Flags** (`/admin/feature_flags`) — create/toggle/delete feature flags, use `FeatureFlag.enabled?("name")` to check
- **Audit Log** (`/admin/audit_log`) — PaperTrail versions with human-readable descriptions, filterable by type/event, clickable detail view
- **Jobs** (`/admin/jobs`) — MissionControl::Jobs engine with dark theme override
- **Database** (`/admin/database`) — raw SQL query/execute, admin-only
- Route constraints: `StaffConstraint` for all admin routes, individual controllers enforce permissions

### Permissions System
- **Roles** (array on User): `user`, `admin`, `reviewer`, `support`, `fulfillment`
- **Permissions** (array on User): `pending_reviews`, `projects`, `users`, `ships`, `feature_flags`, `audit_log`, `jobs`, `third_party`, `support`
- Permissions are explicit for all roles including admin — `has_permission?` checks the permissions array only
- Assigning a role auto-grants default permissions (see `ROLE_DEFAULT_PERMISSIONS`), but individual permissions can be revoked afterwards
- Default permissions: admin gets all, reviewer gets pending_reviews/projects/ships, support gets projects/users/support, fulfillment gets projects/ships
- `staff?` returns true for admin, reviewer, support, or fulfillment roles

### AI Integration
- Uses Hack Club AI (`https://ai.hackclub.com/proxy/v1/chat/completions`) with `qwen/qwen3-32b` model
- **Pitch processing:** cleans formatting (preserves wording), generates admin summary, extracts tags
- **GitHub import:** fetches repo metadata/README/commits, generates project description
- Env var: `HACKCLUB_AI_API_KEY`

### Devlog / JOURNAL.md
- Users can add devlog entries directly on the project page (title, markdown content, time spent)
- Or create a `JOURNAL.md` in their GitHub repo and click "Sync JOURNAL.md" to import entries
- JOURNAL.md format: YAML frontmatter + entries separated by `# Date: Title` headers with `**Total time spent: X**`
- `SyncJournalJob` fetches and parses the file, skips duplicates by title
- Documentation at `/docs/journal`

### Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (production)
- `SECRET_KEY_BASE` — Rails secret key (production)
- `HACKCLUB_AI_API_KEY` — Hack Club AI API key
- `SLACK_BOT_TOKEN` — Slack bot token for posting messages
- `SLACK_SIGNING_SECRET` — Slack request verification
- `SLACK_FORGE_CHANNEL_ID` — Channel ID for `#into-the-forge`
- `HCA_CLIENT_ID` / `HCA_CLIENT_SECRET` — HCA OAuth credentials
- `SLACK_SUPPORT_CHANNEL_ID` — Channel ID for support questions
- `SLACK_BTS_CHANNEL_ID` — Channel ID for behind-the-scenes support staff
- `APP_URL` — Base URL for links in Slack messages (defaults to `https://forge.hackclub.com`)

### Deployment
- Dockerfile with Thruster (port 80) proxying to Puma (port 3000)
- docker-compose.yml with Traefik labels for `forge.hackclub.com`
- Deployed via Coolify on Hetzner
- Solid Cache for caching (PostgreSQL-backed), Solid Queue for background jobs
- `bin/docker-entrypoint` runs `db:prepare` on startup

## UI Design System

The UI uses a dark theme with warm orange/stone accents. NOT the gold/medieval theme described below — that was the original Quarry design. The current Forge design uses:

### Current Color Palette
- **Background:** `#0e0e0e` (near-black)
- **Card/surface:** `#1c1b1b` with `ghost-border` (1px solid rgba(168,138,126,0.15))
- **Primary accent:** `#ffb595` (warm peach/orange) for links and highlights
- **Active accent:** `#ee671c` (deep orange) for buttons (`signature-smolder` class)
- **Button text:** `#4c1a00` (dark brown) on `signature-smolder` backgrounds
- **Heading text:** `#e5e2e1`
- **Body text:** `text-stone-400`
- **Muted text:** `text-stone-500`, `text-stone-600`
- **Labels:** `text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500`

### Typography
- **Headings:** `font-headline` (Space Grotesk), `font-bold`, `tracking-tight`
- **Body:** Inter
- **Labels:** `text-[10px] uppercase tracking-[0.2em] font-bold`

### Components
- **No border-radius** — `* { border-radius: 0 !important; }` in CSS
- **Cards:** `bg-[#1c1b1b] ghost-border` with hover `bg-[#2a2a2a]`
- **Primary buttons:** `signature-smolder text-[#4c1a00]` class (orange gradient background)
- **Secondary buttons:** `ghost-border bg-[#1c1b1b] text-stone-400 hover:bg-[#2a2a2a]`
- **Inputs:** `bg-[#0e0e0e] border-none focus:ring-1 focus:ring-[#ee671c]/30`
- **Status colors:** emerald for approved, amber for pending, orange for returned, red for rejected, stone for draft
- **Danger zones:** `border border-red-500/20` with red-tinted buttons
