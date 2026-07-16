# KVIS Connect

KVIS alumni network built with Next.js 14, FastAPI, PostgreSQL, and Redis.

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20+ |
| pnpm | 9.x |
| Python | 3.12+ |
| Docker Desktop | Current stable release |

The repository and frontend both declare `pnpm@9.0.0`. Do not use npm to
install frontend dependencies.

## Repository structure

```text
KVIS-Connect/
|-- backend/                  FastAPI application, Alembic, and tests
|-- frontend/                 Next.js App Router application
|-- docs/                     Project notes
|-- docker-compose.yml        Local PostgreSQL, Redis, backend, and frontend
|-- render.staging.yaml       Staging frontend Render Blueprint
|-- K_SKILL.md                Staging investigation and decision log
|-- package.json              Root convenience commands
`-- pnpm-lock.yaml            Root pnpm lockfile
```

The frontend has an in-browser Axios mock in `frontend/src/lib/mock.ts`.
There is no standalone `mock-server/` directory.

## Install

From the repository root:

```powershell
pnpm run install:fe
pnpm run install:be
```

To install only the frontend:

```powershell
pnpm run install:fe
```

## Run the full local application

Create the backend environment file:

```powershell
Copy-Item backend/.env.example backend/.env
```

Set a development-only `SECRET_KEY` in `backend/.env`, then run:

```powershell
pnpm run db
pnpm run migrate
```

Start the backend and frontend in separate PowerShell windows:

```powershell
pnpm run be
```

```powershell
pnpm run fe
```

The frontend is available at `http://localhost:3000` and API documentation at
`http://localhost:8000/docs`. Local PostgreSQL is exposed on port `5434` and
Redis on port `6380`.

## Admin staging frontend

The staging frontend is a separate Next.js service. Browser requests use
relative `/api/*` URLs. The existing Next.js rewrite proxies them to the
server-only `BACKEND_URL`, so authentication cookies remain first-party.

Production behavior is unchanged when the staging scripts and Blueprint are
not used.

### Required environment variables

| Variable | Staging API mode | UI-only mock mode | Purpose |
|---|---:|---:|---|
| `BACKEND_URL` | Required | Omit | Dedicated staging backend origin, without a trailing slash |
| `NEXT_PUBLIC_USE_MOCK` | `false` | `true` | Enables the isolated browser mock |
| `NEXT_PUBLIC_DISABLE_AUTH` | `false` | `false` | Development bypass; forbidden by staging validation |
| `PORT` | Render supplies it | Optional | Port consumed by `next start` |
| `NODE_VERSION` | Render only | N/A | Blueprint pins the service to `>=20.0.0 <21.0.0` |

`frontend/.env.staging.example` is a reference file. The commands below set
the values explicitly so the validation script and Next.js receive the same
environment.

### Start locally with the real staging API

PowerShell:

```powershell
pnpm run install:fe
$env:BACKEND_URL="https://kvis-connect-staging-backend.onrender.com"
$env:NEXT_PUBLIC_USE_MOCK="false"
$env:NEXT_PUBLIC_DISABLE_AUTH="false"
pnpm run fe:staging
```

Bash:

```bash
pnpm run install:fe
export BACKEND_URL="https://kvis-connect-staging-backend.onrender.com"
export NEXT_PUBLIC_USE_MOCK="false"
export NEXT_PUBLIC_DISABLE_AUTH="false"
pnpm run fe:staging
```

Open `http://localhost:3000/auth/login`. Use only a staging-specific account
and password. After login, open `http://localhost:3000/admin`.

### Start locally with the isolated admin mock

This mode does not contact the FastAPI backend or database for Axios requests.
Unhandled browser API requests return `501` instead of passing through.

PowerShell:

```powershell
pnpm run install:fe
Remove-Item Env:BACKEND_URL -ErrorAction SilentlyContinue
$env:NEXT_PUBLIC_USE_MOCK="true"
$env:NEXT_PUBLIC_DISABLE_AUTH="false"
pnpm run fe:staging
```

Bash:

```bash
pnpm run install:fe
unset BACKEND_URL
export NEXT_PUBLIC_USE_MOCK="true"
export NEXT_PUBLIC_DISABLE_AUTH="false"
pnpm run fe:staging
```

Use these public mock-only credentials:

```text
Administrator email: 00123@kvis.ac.th
Administrator password: password

Normal-user email: test.member@kvis.ac.th
Normal-user password: TestOnly-2026!
```

These credentials only exist in the local browser mock. Never use either
password for a real account.

### Refresh the local population demo

The admin population card can use a local CSV export without exposing personal
records to the frontend. This command reads the export only on your computer
and writes aggregate counts by KVIS year, current grade, and teacher/staff
status to the demo source file.

On the network desk, current Grade 12 is displayed as KVIS 10, Grade 11 as KVIS
11, and Grade 10 as KVIS 12. The grade remains visible under each generation
label so current students are not mistaken for alumni records.

```powershell
$env:POPULATION_EXPORT_PATH = "C:\\Users\\asus\\Downloads\\kvis-export\\everyone-production.csv"
pnpm run refresh:population-snapshot
$env:NEXT_PUBLIC_POPULATION_SNAPSHOT = "production-export"
pnpm run fe:staging
```

Do not commit, upload, or place the CSV inside `frontend`, `public`, or the
repository. Only the generated aggregate counts are used by the UI.

### Export relational statistics safely

The user CSV does not include education and career tables. To prepare the
four-section stats page, use the read-only aggregate query in
`scripts/export-stats-aggregates.sql`. It returns one JSON document with
suppressed small groups and no identities, emails, or contact data.

```powershell
& ".\scripts\export-stats-aggregates.ps1"
```

The helper asks whether the target is staging or production, requires an exact
extra confirmation for production, and reads the External Database URL as
hidden input. It forces TLS and a read-only PostgreSQL transaction with bounded
timeouts, passes the password to Docker without putting it in command
arguments, and validates the aggregate JSON before atomically writing
`Downloads\kvis-export\stats-aggregates.json`. An existing export is preserved
unless you explicitly type `OVERWRITE`. Review the resulting file before using
it. Do not paste the connection URL into a source file, command, or chat.
Render's internal database URLs only work from services within Render and are
rejected by this local helper.

### Build and start staging locally

Set the real staging API environment values shown above, then run:

```powershell
pnpm run lint:fe
pnpm run typecheck:fe
pnpm run build:fe:staging
pnpm --dir frontend run start:staging
```

The ordinary production-compatible frontend build remains:

```powershell
pnpm run build:fe
```

### Create the Render staging frontend

Recommended Blueprint setup:

1. Push `feature/admin-dashboard` to GitHub.
2. In Render, create a new Blueprint for this repository.
3. Set the Blueprint file path to `render.staging.yaml`.
4. Confirm that Render will create only `kvis-connect-staging-frontend`.
5. Deploy and wait for the health check at `/auth/login` to pass.

The Blueprint uses the Node runtime, `frontend/` root directory, pnpm frozen
install, lint, type-check, staging build, and `next start`. It points only to
the dedicated staging backend.

Manual Render settings, if a Blueprint is not used:

| Setting | Value |
|---|---|
| Service type | Web Service |
| Name | `kvis-connect-staging-frontend` |
| Branch | `feature/admin-dashboard` |
| Runtime | Node |
| Root directory | `frontend` |
| Build command | `pnpm install --frozen-lockfile && pnpm run lint && pnpm run type-check && pnpm run build:staging` |
| Start command | `pnpm run start:staging` |
| Health check | `/auth/login` |
| `NODE_VERSION` | `>=20.0.0 <21.0.0` |
| `BACKEND_URL` | `https://kvis-connect-staging-backend.onrender.com` |
| `NEXT_PUBLIC_USE_MOCK` | `false` |
| `NEXT_PUBLIC_DISABLE_AUTH` | `false` |

### Verify access behavior

1. Logged out: `/admin` redirects to `/auth/login?next=/admin`.
2. Authenticated normal user: backend admin requests return `403`, and the
   dashboard displays its restricted state.
3. Verified administrator: `/api/users/me` returns the admin permissions and
   `/admin` loads overview and user-list data.
4. Without `admin.feedback.read`, the feedback link and page remain blocked.
5. With `admin.feedback.read`, `/admin/feedback` loads feedback through the
   backend-protected endpoint.
6. Without `admin.data_export.download`, the export button is hidden and all
   `/api/admin/data-export/*` endpoints return `403`.
7. With `admin.data_export.download`, `/admin/export` provides an allowlisted,
   masked preview and requires acknowledgement before an audited CSV download.

Frontend checks are supplementary. FastAPI permission checks remain the source
of truth for every admin data request.

### Administrator data export

The data-export panel is intended for approved maintenance work. Authentication
secrets are never selectable. Education and career records are available as
JSON-formatted CSV cells, previews are masked, soft-deleted accounts are omitted
by default, and completed downloads are recorded in
`admin_data_export_audit`. Apply the Alembic migration before testing this panel
against a real staging backend.

Use **Complete user dataset for maintenance** in `/admin/export` to select every
safe user-table column, including `kvis_email`, and complete education and career JSON records in one
action. This is the safe admin equivalent of the complete SQL export:
authentication secrets are still excluded, and soft-deleted accounts require a
separate explicit selection.

The filename editor locks the `.csv` suffix and sanitizes the editable basename.
After generating a masked sample, the panel shows total rows and a bounded-sample
file-size estimate before the administrator confirms the download.

The theme editor's **Background / Main page canvas** control also updates the
admin dashboard canvas through `--admin-canvas`. With no saved custom theme,
admin pages fall back to their original `#f4f1ea` cream background.
In local mock mode, saved theme colors are kept in browser storage so the admin
canvas and public preview remain consistent after a refresh. **Reset to
built-in** clears that local mock setting. Real staging and production themes
remain database-backed.

Theme controls show advisory WCAG AA warnings beside affected inputs whenever
main text, surface text, primary links, or green labels fall below a `4.5:1`
contrast ratio against their configured background.

## Frontend quality commands

```powershell
pnpm run lint:fe
pnpm run typecheck:fe
pnpm run build:fe
```

## Root commands

| Command | Description |
|---|---|
| `pnpm run db` | Start local PostgreSQL |
| `pnpm run be` | Start FastAPI on port 8000 |
| `pnpm run fe` | Start the ordinary Next.js development server |
| `pnpm run fe:staging` | Validate and start the staging frontend |
| `pnpm run build:fe` | Build the ordinary frontend |
| `pnpm run build:fe:staging` | Validate and build the staging frontend |
| `pnpm run lint:fe` | Lint the frontend |
| `pnpm run typecheck:fe` | Type-check the frontend |
| `pnpm run migrate` | Apply Alembic migrations |
| `pnpm run migration "message"` | Generate an Alembic revision |
| `pnpm run install:be` | Create the backend virtual environment and install dependencies |
| `pnpm run install:fe` | Install frontend dependencies with pnpm |

## Authentication notes

- Registration is restricted to `@kvis.ac.th` addresses.
- Authentication uses HTTP-only cookies; browser JavaScript does not store JWTs.
- Admin pages depend on permissions returned by `/api/users/me`.
- Backend admin dependencies require an active, email-verified, verified user
  with the requested active permission.
- Administrative capabilities are split across three roles: `administrator`
  provides read-only dashboard access, `theme_manager` controls the site theme,
  and `data_exporter` controls audited maintenance exports. The latter two are
  not inherited by ordinary administrators.
- Email OTP delivery requires Microsoft Graph configuration supplied by the
  organization administrator.

### Provision the sole privileged administrator

Apply migrations first. From `backend`, preview the changes for the verified
account without writing to the database:

```powershell
python -m scripts.provision_privileged_admin --user-id YOUR_USER_UUID
```

After confirming the preview, grant that account all three roles and revoke the
two sensitive roles from every other account:

```powershell
python -m scripts.provision_privileged_admin --user-id YOUR_USER_UUID --apply --exclusive
```

The command refuses deleted, email-unverified, or KVIS-unverified accounts. It
also refuses to write unless `--exclusive` is supplied. Keep the database URL
in the `DATABASE_URL` environment variable; do not paste it into source files
or command history.
