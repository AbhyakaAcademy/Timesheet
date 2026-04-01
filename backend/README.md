# Timesheet Backend (Django + DRF)

## Completed scope
- Phase 1: backend setup, apps, DRF, JWT/token auth, CORS, `.env`, PostgreSQL, role-aware user
- Phase 2: timesheet lifecycle APIs + notification APIs
- Phase 3: manager review/approval APIs with audit trail
- Phase 4: finance/admin CRUD APIs for clients, projects, rates, expenses, invoices, approved time, and exports
- Phase 5: frontend integration API contract in `API_CONTRACT.md`

## Tech stack
- Django 6
- Django REST Framework
- SimpleJWT
- DRF Token auth
- django-cors-headers
- PostgreSQL only

## Apps
- `accounts`
- `timesheets`
- `notifications`
- `finance`

## Setup and run (Windows PowerShell)
```powershell
cd C:\Users\Aditya\Documents\Project\landing-login-tenant-dashboard\backend

python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt

Copy-Item .env.example .env -Force

# ensure PostgreSQL database exists (example: timesheet_db)

.\.venv\Scripts\python manage.py makemigrations
.\.venv\Scripts\python manage.py migrate

# optional demo data
.\.venv\Scripts\python manage.py seed_demo_data

.\.venv\Scripts\python manage.py runserver
```

## Demo users
After `seed_demo_data`:
- `employee1` / `Pass@12345`
- `manager1` / `Pass@12345`
- `admin1` / `Pass@12345`
- `finance1` / `Pass@12345`
- `tenant1` / `Pass@12345`

## Base URL
- `http://127.0.0.1:8000/api`

## Implemented endpoints

### Auth/accounts
- `GET /api/health/`
- `POST /api/auth/login`
- `POST /api/auth/token/`
- `POST /api/auth/token/refresh/`
- `GET /api/me/`

### Employee timesheets
- `GET /api/employee/dashboard-summary`
- `POST /api/time-entries/punch-in`
- `POST /api/time-entries/{id}/punch-out`
- `POST /api/time-entries/manual`
- `GET /api/timesheets/current`
- `PATCH /api/timesheet-lines/{id}`
- `DELETE /api/timesheet-lines/{id}`
- `POST /api/timesheets/{id}/submit`

### Notifications
- `GET /api/notifications`
- `POST /api/notifications/mark-read`

### Manager approvals
- `GET /api/manager/timesheets?status=pending|approved|rejected`
- `GET /api/manager/timesheets/{id}`
- `POST /api/manager/timesheets/{id}/approve`
- `POST /api/manager/timesheets/{id}/reject`

### Finance/admin
- `GET|POST /api/finance/clients`
- `GET|PATCH|DELETE /api/finance/clients/{id}`
- `GET|POST /api/finance/projects`
- `GET|PATCH|DELETE /api/finance/projects/{id}`
- `GET|POST /api/finance/rates/projects`
- `PATCH|DELETE /api/finance/rates/projects/{id}`
- `GET|POST /api/finance/rates/roles`
- `PATCH|DELETE /api/finance/rates/roles/{id}`
- `GET|POST /api/finance/rates/employees`
- `PATCH|DELETE /api/finance/rates/employees/{id}`
- `GET /api/finance/approved-time-entries`
- `GET|POST /api/finance/expenses`
- `PATCH|DELETE /api/finance/expenses/{id}`
- `POST /api/finance/expenses/{id}/approve`
- `POST /api/finance/expenses/{id}/reject`
- `GET|POST /api/finance/invoices`
- `GET|PATCH|DELETE /api/finance/invoices/{id}`
- `GET|POST /api/finance/exports`
- `GET /api/finance/exports/{id}/download`
- `GET /api/admin/policies`
- `GET /api/admin/overtime-rules`
- `GET /api/admin/billing-rates`

## Business rules enforced
- Employee can edit/delete timesheet lines only when timesheet is `DRAFT`.
- Submit moves timesheet `DRAFT -> SUBMITTED`.
- Manager can approve/reject only `SUBMITTED` timesheets.
- Every manager decision writes a `TimesheetApproval` audit record.

## Error shape
```json
{
  "success": false,
  "error": {
    "code": "http_400",
    "message": "Readable message",
    "details": {"field": ["error"]}
  }
}
```
