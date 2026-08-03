# AGENTS.md

## Cursor Cloud specific instructions

NetLiveness is a monorepo. The end-to-end **web platform** is three services; the
`NetLiveness` and `NetLiveness.Tray` projects are **Windows-only WinForms apps and
do not run on this Linux VM** (ignore them here).

### Services (dev mode)

| Service | Dir | Dev command | Port |
|---|---|---|---|
| API (ASP.NET Core 8 + SignalR + SQLite) | `NetLiveness.Api` | `dotnet run` | 5006 |
| Frontend (React 19 + Vite) | `netliveness-frontend` | `npm run dev` | 5137 |
| Monitor Worker (background .NET service) | `NetLiveness.MonitorWorker` | `dotnet run` | none |
| Phishing server (Node/Express, optional) | `netliveness-phishing-server` | `node server.js` | 3001 |

Standard per-service commands (install/build/lint/test) are in `SETUP_GUIDE.md`
and the respective `package.json` / `.csproj`. Lint/test/build for the frontend:
`npm run lint`, `npm test`, `npm run build`.

### Toolchain (already provisioned in the VM image)

- .NET 8 SDK is installed at `/usr/share/dotnet` with a `dotnet` symlink in
  `/usr/local/bin`, so `dotnet` is on `PATH` in non-login shells. `~/.bashrc` also
  exports `DOTNET_ROOT` and adds `~/.dotnet/tools` (where `dotnet-ef` lives).
- Node/npm come from the base image PATH. Do **not** install a second Node via nvm.

### Database setup (IMPORTANT, non-obvious)

The API uses a local SQLite DB at `NetLiveness.Api/netliveness_v2.db` (gitignored).

**Do not use `dotnet ef database update` to create the DB from scratch — it fails.**
The EF migration history is broken for a clean build (several tables/columns such
as `AppUsers`, `DirectoryEntries`, `Onboardings`, `Iso9001Requirements` and various
`Settings`/`Personnels` columns are never created by any migration `Up`, and
`AppDbContextModelSnapshot` is stale). The apps never call `Database.Migrate()` at
runtime, so the DB only has to match the runtime model.

To (re)create the dev DB from the authoritative runtime-model schema:

```bash
# run from the repo root
rm -f NetLiveness.Api/netliveness_v2.db NetLiveness.Api/netliveness_v2.db-wal NetLiveness.Api/netliveness_v2.db-shm
sqlite3 NetLiveness.Api/netliveness_v2.db < dev-db/dev_schema.sql   # full schema + default Settings row
sqlite3 NetLiveness.Api/netliveness_v2.db < dev-db/dev_seed.sql     # seeds admin / admin
```

`dev-db/dev_schema.sql` was generated from `AppDbContext` via EF `EnsureCreated()` (the
exact runtime model). Default login is **`admin` / `admin`** (the API compares the
plaintext password against `PasswordHash`). The DB file normally persists in the VM
snapshot, so this rebuild is only needed if it is missing/corrupt.

### Running the Monitor Worker (non-obvious)

The worker resolves the shared SQLite DB via `NETLIVENESS_DB_PATH`; in this dev
layout it does not find the API DB automatically. Start it with:

```bash
cd NetLiveness.MonitorWorker
NETLIVENESS_DB_PATH=/workspace/NetLiveness.Api/netliveness_v2.db dotnet run
```

On Linux the WMI/user-activity features are Windows-only and log warnings — this is
expected and harmless; the worker keeps running.

### Frontend ↔ API wiring

When the frontend runs on port 5137, `src/api.js` targets the API at
`http://<hostname>:5006/api` automatically; the API enables permissive CORS. No
`.env` is required for local dev.

### Known pre-existing issues (not environment problems)

- `npm run lint` fails (~69 errors, mostly `react-hooks/set-state-in-effect`) and
  `npm test` fails because `src/tests/setup.js` contains JSX but is named `.js`.
  These are pre-existing code issues, unrelated to environment setup.
