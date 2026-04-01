# Frontend Integration API Contract

This contract maps APIs to:
- `src/app/dashboard/employee/page.js`
- `src/app/dashboard/employee/components/TimerCard.tsx`
- `src/app/dashboard/employee/components/TimesheetsTable.tsx`
- `src/components/dashboard/Table.js`
- `src/components/dashboard/Header.js`

Base URL: `/api`
Auth header: `Authorization: Bearer <access_token>`

## 1) Login + current user

### `POST /api/auth/login`
Request:
```json
{
  "username": "employee1",
  "password": "Pass@12345"
}
```
Response:
```json
{
  "access": "<jwt>",
  "refresh": "<jwt>",
  "user": {
    "id": 1,
    "username": "employee1",
    "email": "employee1@example.com",
    "first_name": "Employee",
    "last_name": "One",
    "role": "employee"
  }
}
```

### `GET /api/me/`
Response:
```json
{
  "id": 1,
  "username": "employee1",
  "email": "employee1@example.com",
  "first_name": "Employee",
  "last_name": "One",
  "role": "employee"
}
```

## 2) Employee page data

### `GET /api/employee/dashboard-summary`
Use in `src/app/dashboard/employee/page.js` and `src/components/dashboard/Header.js`.

Response:
```json
{
  "active_entry": {
    "id": 12,
    "employee": 1,
    "project": {
      "id": 1,
      "name": "Tenant Platform",
      "code": "PRJ-1001",
      "client_name": "Acme Corp",
      "is_active": true
    },
    "source": "punch",
    "start_time": "2026-02-23T09:00:00Z",
    "end_time": null,
    "duration_minutes": 0,
    "note": "Starting shift",
    "created_at": "2026-02-23T09:00:00Z"
  },
  "weekly_hours": 15.5,
  "draft_count": 1,
  "submitted_count": 1,
  "approved_count": 1,
  "unread_notifications": 2
}
```

## 3) TimerCard integration
Use in `src/app/dashboard/employee/components/TimerCard.tsx`.

### Punch in
`POST /api/time-entries/punch-in`
```json
{
  "project_id": 1,
  "note": "Start shift"
}
```

### Punch out
`POST /api/time-entries/{id}/punch-out`
```json
{
  "note": "End shift"
}
```

### Manual entry
`POST /api/time-entries/manual`
```json
{
  "project_id": 1,
  "start_time": "2026-02-23T10:00:00Z",
  "end_time": "2026-02-23T12:30:00Z",
  "note": "Manual correction"
}
```

All return a `TimeEntry` object.

## 4) Timesheet table integration
Use in `src/app/dashboard/employee/components/TimesheetsTable.tsx` and `src/components/dashboard/Table.js`.

### Get current timesheet
`GET /api/timesheets/current`
```json
{
  "id": 3,
  "employee": 1,
  "week_start": "2026-02-23",
  "status": "DRAFT",
  "submitted_at": null,
  "total_hours": 8,
  "lines": [
    {
      "id": 7,
      "timesheet": 3,
      "date": "2026-02-23",
      "project": {
        "id": 1,
        "name": "Tenant Platform",
        "code": "PRJ-1001",
        "client_name": "Acme Corp",
        "is_active": true
      },
      "description": "Feature work",
      "hours": "8.00",
      "shift": "DAY",
      "time_entry": null,
      "created_at": "2026-02-23T08:00:00Z",
      "updated_at": "2026-02-23T08:00:00Z"
    }
  ],
  "approvals": []
}
```

### Update line
`PATCH /api/timesheet-lines/{id}`
```json
{
  "description": "Updated text",
  "hours": "7.50",
  "shift": "EVENING"
}
```

### Delete line
`DELETE /api/timesheet-lines/{id}`

### Submit timesheet
`POST /api/timesheets/{id}/submit`
Returns updated timesheet with `status = "SUBMITTED"`.

## 5) Notifications

### List
`GET /api/notifications`

### Mark read
`POST /api/notifications/mark-read`
```json
{
  "ids": [1, 2]
}
```
Or send `{}` to mark all unread as read.

## 6) Manager APIs

### List
`GET /api/manager/timesheets?status=pending`

### Detail
`GET /api/manager/timesheets/{id}`

### Approve
`POST /api/manager/timesheets/{id}/approve`
```json
{
  "comment": "Approved"
}
```

### Reject
`POST /api/manager/timesheets/{id}/reject`
```json
{
  "comment": "Need corrections"
}
```

## 7) Finance/Admin APIs

### Clients
- `GET /api/finance/clients`
- `POST /api/finance/clients`
- `GET /api/finance/clients/{id}`
- `PATCH /api/finance/clients/{id}`
- `DELETE /api/finance/clients/{id}`

### Projects
- `GET /api/finance/projects`
- `POST /api/finance/projects`
- `GET /api/finance/projects/{id}`
- `PATCH /api/finance/projects/{id}`
- `DELETE /api/finance/projects/{id}`

### Rates
- `GET /api/finance/rates/projects`
- `POST /api/finance/rates/projects`
- `PATCH /api/finance/rates/projects/{id}`
- `DELETE /api/finance/rates/projects/{id}`
- `GET /api/finance/rates/roles`
- `POST /api/finance/rates/roles`
- `PATCH /api/finance/rates/roles/{id}`
- `DELETE /api/finance/rates/roles/{id}`
- `GET /api/finance/rates/employees`
- `POST /api/finance/rates/employees`
- `PATCH /api/finance/rates/employees/{id}`
- `DELETE /api/finance/rates/employees/{id}`

### Billing inputs
- `GET /api/finance/approved-time-entries`
- `GET /api/finance/expenses`
- `POST /api/finance/expenses`
- `PATCH /api/finance/expenses/{id}`
- `DELETE /api/finance/expenses/{id}`
- `POST /api/finance/expenses/{id}/approve`
- `POST /api/finance/expenses/{id}/reject`

### Invoices
- `GET /api/finance/invoices`
- `POST /api/finance/invoices`
- `GET /api/finance/invoices/{id}`
- `PATCH /api/finance/invoices/{id}`
- `DELETE /api/finance/invoices/{id}`

### Exports
- `GET /api/finance/exports`
- `POST /api/finance/exports`
- `GET /api/finance/exports/{id}/download`

### Admin policies
- `GET /api/admin/policies`
- `GET /api/admin/overtime-rules`
- `GET /api/admin/billing-rates`

## 8) Error contract (all endpoints)
```json
{
  "success": false,
  "error": {
    "code": "http_400",
    "message": "Readable message",
    "details": {
      "field": ["error"]
    }
  }
}
```
