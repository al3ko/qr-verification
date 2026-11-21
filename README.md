# EntryCode

EntryCode is a campus QR identity-verification prototype. It combines a React progressive web application (PWA), a FastAPI service, a PostgreSQL database, and an Isolation Forest model used to flag unusual verification activity. Students and eligible staff generate short-lived QR credentials; Security Staff scan credentials at a selected campus building; administrators review registrations, access activity, and anomaly alerts.

This README describes the repository as implemented. The local setup is intended for development and controlled evaluation. It is not a statement that the system has been approved for public or production deployment.

## Contents

- [Capabilities and roles](#capabilities-and-roles)
- [Architecture and repository layout](#architecture-and-repository-layout)
- [Technology](#technology)
- [Requirements](#requirements)
- [Local setup](#local-setup)
- [Database and accounts](#database-and-accounts)
- [Run the application](#run-the-application)
- [Application workflows](#application-workflows)
- [API overview](#api-overview)
- [Anomaly detection model](#anomaly-detection-model)
- [Verification and troubleshooting](#verification-and-troubleshooting)
- [Security, privacy, and deployment notes](#security-privacy-and-deployment-notes)

## Capabilities and roles

### Student

- Registers with a student profile and waits for administrator approval.
- Signs in and views profile and approval status.
- After approval, generates a QR credential that expires after 90 seconds. A newly issued credential revokes earlier active credentials for that owner.
- Views recent access history and the latest verification outcome.

### Staff

- Signs in using an account provisioned by an administrator.
- Staff accounts can generate a QR credential and view their own access history, subject to the assigned work role.
- Accounts whose work role is **Security Staff** can choose a campus phase and building, scan QR codes with a camera, and view scan results and verification history. The API prevents other staff roles from using the verification endpoint.

### Administrator

- Reviews pending student registrations and approves or rejects them.
- Creates staff and administrator accounts.
- Views access analytics and anomaly alerts.

## Architecture and repository layout

```text
.
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ backend/
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ app/
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ api/             # Authentication, student, staff, and admin routes
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ core/            # Settings, JWT and password security
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ db/              # SQLAlchemy engine and session
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ models/          # User, Student, QRCode, VerificationLog, AnomalyAlert
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ services/        # QR credential and anomaly-scoring services
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ migrations/          # Alembic schema history
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ tests/               # Test directory (currently no checked-in test files)
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ create_admin.py      # Interactive first-administrator setup
Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ requirements.txt
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ frontend/
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ src/pages/           # Login, registration, student, staff, and admin screens
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ src/components/      # Shared portal and verification UI
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ public/              # PWA icons and static assets
Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ package.json
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ ml/
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ qr_verification.ipynb
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ qr_verification_dataset.csv
Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ qr_verification_test_200.csv
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ README.md
```

The browser communicates with the FastAPI routes. During local development, Vite proxies `/api` requests to `http://127.0.0.1:8000`. The backend uses SQLAlchemy with PostgreSQL and Alembic migrations. Passwords are hashed; API access tokens use JWT bearer authentication. QR token values are generated with Python's secure random generator; only SHA-256 token hashes are stored in the database.

The principal database entities are `users`, `students`, `qr_codes`, `verification_logs`, and `anomaly_alerts`. Their models and schema changes are in `backend/app/models/` and `backend/migrations/`.

## Technology

The dependency files in this repository specify the following stack:

| Layer | Technology | Version information in repository |
|---|---|---|
| Frontend | React, React DOM, React Router | Declared in `frontend/package.json`; resolved versions are recorded in `frontend/package-lock.json` |
| Frontend build/PWA | Vite, `vite-plugin-pwa`, ESLint | Declared in `frontend/package.json`; use `npm ci` to install the lockfile versions |
| QR scanning | `html5-qrcode`; QR display via `qrcode.react` | Declared in `frontend/package.json` |
| Backend API | Python, FastAPI, Uvicorn | Version ranges are specified in `backend/requirements.txt` |
| Persistence | SQLAlchemy, Alembic, PostgreSQL, Psycopg 3 | Python dependency ranges are specified in `backend/requirements.txt` |
| Authentication | PyJWT, `pwdlib` with Argon2 support | Python dependency ranges are specified in `backend/requirements.txt` |
| ML/data | scikit-learn, joblib, pandas, NumPy | scikit-learn/joblib/pandas are declared in `backend/requirements.txt`; NumPy is used by the notebook and is installed as a pandas/scikit-learn dependency |

There is no Python lockfile in the repository, so `requirements.txt` contains supported version ranges rather than a fully pinned reproducible Python environment. The frontend lockfile is committed.

## Requirements

- Git
- Python 3.10 or newer
- Node.js and npm versions compatible with the Vite version resolved by `frontend/package-lock.json`
- A running PostgreSQL server and a database role permitted to create/use the project database
- A camera-enabled browser on `localhost` or an HTTPS origin to use live QR scanning. Browsers generally restrict camera access on insecure non-local origins.

The instructions below use Windows PowerShell. Commands for other shells are included where the activation syntax differs.

## Local setup

### 1. Get the source

```powershell
git clone https://github.com/al3ko/qr-verification.git
cd qr-verification
```

### 2. Create and configure the backend environment

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

On macOS/Linux, create and activate the environment with `python3 -m venv .venv` and `source .venv/bin/activate` instead.

Create `backend/.env` (the file is ignored by Git) with values for your local PostgreSQL instance. Replace the database role/password and generate a private JWT key; these are examples/placeholders, not project credentials:

```dotenv
DATABASE_URL=postgresql+psycopg://<database-user>:<url-encoded-password>@localhost:5432/qr_verification
JWT_SECRET_KEY=<long-random-private-value>
DEBUG=true
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Generate a random signing key locally with:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Copy the printed value into your local `.env` file. Do not commit the `.env` file or paste secrets into this README. URL-encode special characters in the PostgreSQL password portion of `DATABASE_URL`.

The backend requires `DATABASE_URL` and `JWT_SECRET_KEY`; configuration fails at startup if either value is missing. Set both in `.env` for local development, and provide them through an appropriate secret store in a deployed environment.

### 3. Create the PostgreSQL database and apply migrations

Create the database using a PostgreSQL administrative account. For example, if `createdb` is on `PATH`:

```powershell
createdb -U <database-user> qr_verification
```

Then, from the `backend` directory with the virtual environment active:

```powershell
alembic upgrade head
```

The migration history creates and updates the application schema. Re-run `alembic upgrade head` after pulling a change that adds a migration. Do not use SQLAlchemy `create_all()` as a replacement for the checked-in migration history.

### 4. Install frontend dependencies

In a second terminal, from the repository root:

```powershell
cd frontend
npm ci
```

`npm ci` installs the versions recorded in `package-lock.json`.

## Database and accounts

There is no checked-in production seed dataset or default administrator password. Create an initial administrator interactively after applying the migrations. From `backend` with its virtual environment active, run:

```powershell
python create_admin.py
```

The script prompts for an administrator School ID, name, email, school code, and password. It reads the password without echoing it and requires matching entries of at least eight characters. The script currently accepts administrator School IDs from 100 to 1000 and school codes `SCES`, `SBS`, `SLS`, `SHSS`, or `SIMS`. Use non-production test identities for local evaluation.

Students register through the application. New registrations have a `pending` approval status and cannot generate a QR credential until an administrator approves them. Staff accounts are created from the administrator account dashboard or the protected API.

## Run the application

### Start the backend

From `backend` with the virtual environment active:

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The local API is at `http://127.0.0.1:8000`. Interactive API documentation is available at `http://127.0.0.1:8000/docs`, and the OpenAPI schema is at `http://127.0.0.1:8000/openapi.json`.

### Start the frontend

From `frontend` in the second terminal:

```powershell
npm run dev -- --host 127.0.0.1
```

Open the local address printed by Vite, normally `http://127.0.0.1:5173`. The Vite configuration proxies `/api` to the local backend port 8000. Leave both processes running while using the application.

The frontend accepts an optional `VITE_API_URL` value at build time. It defaults to the same origin and relies on the Vite development proxy. For a separate frontend/backend deployment, configure the API URL and update the backend CORS allowlist in `backend/app/main.py` to the exact trusted frontend origin.

## Application workflows

### Student QR verification

1. A student registers and signs in.
2. An administrator approves the registration.
3. The approved student requests a QR credential. The backend generates a random token, stores its hash, and returns the token and QR image to the frontend. The expiry is 90 seconds.
4. Security Staff select a campus phase and building, then scan the QR using the browser camera or submit a token to the verification route.
5. The backend checks the QR hash, expiry, revocation, single-use state, and role permissions. It records a verification log, evaluates the scan for risk, and returns the result to the scanner UI. Replayed, expired, revoked, or invalid QR values are rejected and logged.
6. The student and staff history screens and the administrator dashboards read the relevant access records. Administrators can inspect flagged anomaly alerts.

### QR credential safeguards

- QR token text is not stored as plain text in the database; the SHA-256 digest is used to find the record during verification.
- A credential expires 90 seconds after generation.
- Verification atomically claims an eligible credential so it cannot be used a second time.
- Issuing a replacement credential revokes the owner's previous active credentials.
- Student QR generation is restricted to an approved student account.
- Only Security Staff work-role accounts can call the QR verification endpoint.

## API overview

All application routes are prefixed with `/api`. Protected routes require an `Authorization: Bearer <access_token>` header. Role restrictions are enforced by the backend.

| Method | Route | Access | Purpose |
|---|---|---|---|
| `GET` | `/` | Public | API service status |
| `GET` | `/api/health` | Public | Checks the API and database connection |
| `POST` | `/api/auth/register` | Public | Register a student |
| `POST` | `/api/auth/login` | Public | Authenticate and return a JWT |
| `GET` | `/api/auth/me` | Authenticated | Return the signed-in account |
| `GET` | `/api/student/me` | Student | Read the student profile and approval status |
| `POST` | `/api/student/qr-code` | Approved student | Generate a student QR credential |
| `GET` | `/api/student/history` | Student | Read recent student verification history |
| `GET` | `/api/student/latest-verification` | Student | Read the latest verification result |
| `GET` | `/api/staff/me` | Staff | Read the staff account |
| `POST` | `/api/staff/qr-code` | Eligible staff | Generate a staff QR credential |
| `GET` | `/api/staff/history` | Staff | Read role-scoped verification history |
| `POST` | `/api/staff/verify-qr` | Security Staff | Verify a QR token at a selected phase/building |
| `GET` | `/api/admin/access-analytics` | Administrator | Read access analytics; `days` may be 1Ã¢â‚¬â€œ365 |
| `GET` | `/api/admin/anomaly-alerts` | Administrator | Read recent anomaly alerts |
| `POST` | `/api/admin/users` | Administrator | Create a staff or administrator account |
| `GET` | `/api/admin/students/pending` | Administrator | List pending student applications |
| `POST` | `/api/admin/students/{school_id}/approve` | Administrator | Approve a student registration |
| `POST` | `/api/admin/students/{school_id}/reject` | Administrator | Reject a student registration with a reason |

The health endpoint returns HTTP `200` with a healthy/database-connected status when PostgreSQL is reachable; it returns HTTP `503` if the database check fails.

## Anomaly detection model

The model training and evaluation work is in [`ml/qr_verification.ipynb`](ml/qr_verification.ipynb). The training CSV is [`ml/qr_verification_dataset.csv`](ml/qr_verification_dataset.csv); the separate file [`ml/qr_verification_test_200.csv`](ml/qr_verification_test_200.csv) contains 209 records in the current repository version, despite `200` in its filename. The training CSV has 2,480 records: 2,246 labelled normal and 234 labelled anomalous. It covers seven named buildings across Phase 1 and Phase 2. The anomaly labels comprise cross-phase impossible travel, Phase 2 impossible travel, outside-operating-hours activity, same-building replay, and repeated failed attempts. To reduce re-identification risk, the checked-in CSVs omit record IDs, subject IDs, school affiliations, and raw timestamps. The feature columns and labels used by the notebook remain. These files contain structured scan features and labels; they should not be treated as a substitute for a properly governed live campus dataset.

The notebook uses a stratified 80/20 split with `random_state=42` and five-fold stratified cross-validation on the training partition. Its Isolation Forest uses 200 estimators, `max_samples=256`, `max_features=0.7`, a contamination value derived from the training labels, and `random_state=42`. Notebook code computes classification metrics and saves a model bundle and report under `ml/artifacts/`; evaluation values should be taken from an executed, retained report rather than inferred from the code.

The backend looks for `ml/artifacts/isolation_forest_qr.joblib` at the repository root. If the artifact is absent but the training CSV is present, the backend attempts to fit the configured Isolation Forest once per process. If both the saved artifact and training data are unavailable, model scoring is unavailable. Deterministic checks for outside-hours activity and selected high-risk patterns run before model scoring; model scoring is advisory, and an inference exception is caught so it does not interrupt QR verification.

### Train/package the model locally

Run the notebook from the `ml` directory so its relative dataset and artifact paths resolve correctly:

```powershell
cd ml
python -m pip install -r ..\backend\requirements.txt jupyter
python -m jupyter notebook qr_verification.ipynb
```

Execute the notebook cells to generate `ml/artifacts/isolation_forest_qr.joblib` and its evaluation report. The `ml/artifacts/` directory is ignored by Git, so the artifact must be generated or transferred through an approved secure process in each environment. Keep the report and evaluation data anonymised if they are shared.

## Verification and troubleshooting

### Health check

With the backend running and the database migrated, open `http://127.0.0.1:8000/api/health` or use:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
```

Expected response:

```json
{"status":"healthy","database":"connected"}
```

### Frontend checks

From `frontend`, the repository provides these scripts:

```powershell
npm run lint
npm run build
```

`npm run dev` starts the development server; `npm run preview` serves the production build locally. The backend `tests/` directory currently contains no checked-in automated test files, so these frontend scripts do not replace API, database, security, or end-to-end verification.

### Common issues

| Symptom | Checks |
|---|---|
| Backend cannot connect to PostgreSQL | Confirm PostgreSQL is running, the database exists, the role/password in `backend/.env` are correct, and `DATABASE_URL` is URL-encoded where necessary. |
| Health check returns `503` | Check the backend console and database connection, then confirm `alembic upgrade head` completed successfully. |
| Frontend reports network/API errors | Confirm the backend is listening on port 8000 and Vite is running on port 5173. Check the Vite `/api` proxy and browser console. |
| Camera does not start | Grant camera permission and use `localhost` or HTTPS. Confirm the device has a working camera and no other application is holding it. |
| QR rejected as expired or already used | Generate a new credential and scan it within 90 seconds. Each credential is single-use. |
| Student cannot generate a QR | Check that the student registration is approved and the account is active. |
| Anomaly scoring is unavailable | Check that the training CSV exists at `ml/qr_verification_dataset.csv` or that the model artifact is present at `ml/artifacts/isolation_forest_qr.joblib`; inspect backend logs for load errors. |

## Security, privacy, and deployment notes

- Never commit `.env` files, passwords, signing keys, live student data, or unredacted database exports. `.gitignore` excludes `.env`, virtual environments, build output, and local model artifacts.
- Use a unique, high-entropy `JWT_SECRET_KEY` in every environment and rotate it if exposed. The checked-in settings module contains development fallback values; configure secrets explicitly before use beyond an isolated local machine.
- Keep `DEBUG` disabled for a deployed environment. Configure CORS to allow only the deployed frontend origin; the current backend allowlist is configured for development and should be reviewed before deployment.
- Serve the frontend and API over HTTPS when used beyond localhost. Use a managed secret store, restricted database accounts, encrypted backups, and operational logging with access controls.
- Treat anomaly alerts as review signals rather than proof of misconduct. Validate the model against representative, approved campus data before operational use; monitor false positives and false negatives.
- Protect backups because account, identity, access-history, and alert tables can contain sensitive information. Define retention and deletion rules with the institution before a real deployment.
- The current repository documents a local development workflow. A public deployment additionally needs environment-specific CORS and frontend API configuration, secure secret management, database backup/recovery procedures, monitoring, and an assessed data-protection process.

## Contributing changes

1. Create a branch for the change.
2. Keep credentials and personal data out of source, screenshots, logs, and commits.
3. Add an Alembic migration when changing database schema; do not edit already-applied migration history without a coordinated migration plan.
4. Update this README when setup, routes, configuration, or workflows change.
5. Run the relevant frontend lint/build and manually verify affected API workflows against a non-production database before proposing the change.
