# Alumni Verification With Manual Email

## Current Students

The join page now offers **Current student** and **Alumnus**. Both require student ID (or the forgot-ID path), cohort, full name, nickname, classroom, and personal email. Current students provide their current grade (M.4/10, M.5/11, or M.6/12) and homeroom teacher instead of an alumni project title/advisor. Required evidence is enforced by the backend as well as the form. The admin list labels the applicant type and displays the corresponding evidence.

The additive migration `c7d8e9f002`, following `b6c7d8e9f001`, marks existing verification requests as alumni and adds nullable grade and homeroom teacher fields. It does not change existing user accounts or import a roster. A newly activated student account receives its submitted grade and cohort; existing account holders still sign in directly. Apply migrations before deploying the updated API/frontend. Tests also cover student evidence validation, forgot-ID approval, and activation.

## Workflow

1. `/auth/join` collects a five-digit student ID (leading zeros preserved), a two-digit cohort, full name, personal email, nickname, former classroom, project title, advisor, and optional notes. The forgot-ID path permits no student ID at submission.
2. The backend stores the request in PostgreSQL. Public responses are intentionally generic, including for existing accounts and duplicate submissions; no account lookup or private request list is public.
3. An eligible account with `admin.verification.manage` reviews requests at `/admin/verification-requests`. The navigation menu shows **Alumni verification** only to authorized reviewers. A general administrator does not automatically receive this permission.
4. Reviewers compare submissions with trusted school records and check for existing accounts. Names, student IDs and shared memories are supporting information, not sufficient proof of identity. For a forgotten ID, confirm the correct ID before approval. A decision note is required and remains private to reviewers.
5. Approval does not yet create a user account. Select **Generate activation link**, then **Copy email message**, and send it manually to exactly the recipient displayed. No email service or school domain is required for this manual step. Do not send passwords.
6. The recipient opens `/auth/activate#token=...`, sets a password of at least 12 characters (at most 72 UTF-8 bytes), then continues to existing profile onboarding. Possession of this private, correctly delivered link verifies control of the submitted email. The account and token consumption are committed atomically.

Links expire after 48 hours and work once. Generating a replacement invalidates the previous link. Raw tokens are returned only at generation and are not stored in PostgreSQL, browser local storage, request-list responses, or URL query strings. The activation page removes the URL fragment once read. Do not enable request-body/session-replay logging on these pages or APIs.

Rejection creates no account or activation link. The applicant may submit again; rejection notification is manual. Approved/rejected decisions cannot be edited in this version. Existing account recovery, correction of an approved identity, and reversal of mistaken approval require operator assistance, not a second account.

## Before Deployment

These changes are local source code until deployed. A Vercel frontend deployment alone is not enough: it must proxy to a reachable backend with PostgreSQL.

1. Back up the database and test migrations on staging. Stop old application workers before migrating, especially workers using development `create_all`. From `backend`, run `python -m alembic upgrade heads` (matching the existing Docker startup command), then start the updated API. The new revision is `b6c7d8e9f001`, following `a5b6c7d8e9f0`. Do not stamp over an unknown schema or run this on a database already changed by `create_all` without reconciling its migration history.
2. Configure backend `DATABASE_URL`, a strong private `SECRET_KEY`, `ENVIRONMENT=production`, and `FRONTEND_URL` containing only trusted frontend origins. Set `VERIFICATION_FRONTEND_URL` to one HTTPS origin, for example `https://kvis-connect-ochre.vercel.app`, without a path or comma-separated list. Local development may use `http://localhost:3000`. Links are never built from a request's Host header.
3. Set Vercel's server-side `BACKEND_URL` to the actual public HTTPS API origin, then redeploy the frontend so the existing `/api/*` rewrite points there. Keep `NEXT_PUBLIC_DISABLE_AUTH` and `NEXT_PUBLIC_USE_MOCK` disabled. No database credentials or other secrets belong in `NEXT_PUBLIC_*` variables.
4. Run the backend tests and staging acceptance checks below. There is no automatic import of previous browser-local prototype requests or the private alumni CSV. Existing legacy accounts have no authoritative student-ID column, so duplicate identity matching across different legacy email addresses still requires reviewer checks against trusted records.

The new migration seeds a dedicated reviewer role but grants it to nobody. Choose an existing active, email-verified and KVIS-verified account by its exact UUID. From `backend`, inspect the dry run first:

```sh
python -m scripts.provision_verification_reviewer --user-id ACCOUNT_UUID
python -m scripts.provision_verification_reviewer --user-id ACCOUNT_UUID --apply
```

This script adds only reviewer access. It does not create an account, approve an unverified administrator, grant data-export permissions, or revoke other roles. Sign in again or refresh the page after provisioning. If no eligible administrator exists, stop and establish the initial trusted operator through the existing account-provisioning process; do not approve an arbitrary public applicant as the operator.

Public submission and activation are limited respectively to 10 and 20 attempts per client IP per hour, shared across API workers using database records. IP keys are HMAC hashed; old counters are pruned. Configure the deployment's trusted proxy chain correctly so the API sees a trustworthy client IP. The application does not parse arbitrary forwarded headers. Otherwise multiple users behind a proxy or school NAT may share a limit. Do not blindly trust all proxy sources. Add edge abuse controls as appropriate before opening broadly.

## Verification

From `backend`:

```sh
python -m pip install -r requirements-dev.txt
python -m pytest -q
```

`tests/test_verification.py` uses isolated SQLite tables and synthetic data, not real alumni records. It covers validation, generic duplicate receipts, authorization, mutation headers, forgotten IDs, conflicting approvals, rejection/resubmission, token hashing, expiry/reissue/single use, password checks, account creation, cookies, rate limits, trusted origins, and explicit reviewer provisioning.

Before inviting users, also exercise the PostgreSQL-backed staging deployment:

- Submit from one browser; verify that a different, authorized browser sees the saved request. Anonymous and ordinary accounts must not read or decide requests.
- Approve and manually send a link to a test mailbox you control. Confirm password setup, profile onboarding, logout, and subsequent password login.
- Test an expired link, a replaced link, and replay after activation. Each must fail without creating another user.
- Send concurrent approval/activation requests from separate connections. Confirm one approved record per student-ID/cohort and one user per consumed token. SQLite does not validate PostgreSQL row-lock behavior.
- Check mobile digit entry, paste, deletion, keyboard navigation, errors, manual-copy actions, and secure cookies through the deployed Next.js proxy.
- Verify backups, database access restrictions, correct frontend origin, no sensitive response caching or analytics capture, and the retention/access policy for private verification evidence.

Manual email applies only to this new activation workflow. Existing OTP/password-reset endpoints still depend on their existing mail configuration. Do not advertise automated account recovery until that service is configured and tested.
