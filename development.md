# Forge development and deployment

Forge is written in Rails, heavily inspired by, with code used from, previous Hack Club programs and services such as the Hack Club rails starter template, Summer of Making, HCB, and Submit, as well as [24c02/thirdrail](https://github.com/24c02/thirdrail).

## Local Development Setup

### 1. Prerequisites

- Ruby (see `.ruby-version` or Gemfile)
- Node.js (for Vite and frontend dependencies)
- Bundler (`gem install bundler`)
- Docker (for running Postgres)

### 2. Start Postgres with Docker

You can spin up a local Postgres instance using Docker:

```sh
docker run -d \
  --name hc-rails-starter-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=starter \
  -e POSTGRES_DB=hc_rails_starter_development \
  -p 5432:5432 \
  postgres:15
```

Update your `.env` file with the database URL:

```
DATABASE_URL=postgresql://postgres:starter@localhost:5432/hc_rails_starter_development
```

### 3. Install dependencies

```sh
bundle install
npm install
```

### 4. Setup credentials

The template ships with a placeholder `config/credentials.yml.enc`. Delete it and generate fresh credentials for your project:

```sh
rm config/credentials.yml.enc
bin/rails credentials:edit
```

Then generate Active Record encryption keys and paste them into the credentials file:

```sh
bin/rails db:encryption:init
```

Copy the output into your credentials file so it looks like:

```yaml
active_record_encryption:
  primary_key: <generated>
  deterministic_key: <generated>
  key_derivation_salt: <generated>
```

This creates `config/master.key` (keep this secret, never commit it) and a new `config/credentials.yml.enc`.

### 5. Setup the database

```sh
bin/rails db:setup
```

### 6. Start the Rails server

```sh
bin/dev
```

### Cloudflare R2 (Production)

Active Storage is configured to use Cloudflare R2 in production. Development uses local disk storage by default. To set up R2 for production, create an R2 bucket and API token in the Cloudflare dashboard, then set these environment variables:

```
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET=your_bucket_name
R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
```

---

See `.env.development.example` for required environment variables.


cacaw
