# Training Trak API Documentation

## Overview

This document describes the REST API endpoints available in the Training Trak application.

## Authentication

All API endpoints (except auth endpoints) require authentication via NextAuth session.

### Headers

```
Cookie: next-auth.session-token=<session-token>
```

## Base URL

```
/api
```

## Response Format

### Success Response

```json
{
  "data": <response_data>
}
```

### Error Response

```json
{
  "error": "Error message",
  "details": {} // Optional additional error details
}
```

### Validation Error Response

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

## HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## Authentication Endpoints

### Sign Up

Create a new user account (requires approval).

**Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123",
  "siteId": "site_id",
  "departmentId": "dept_id",
  "positionId": "pos_id",
  "shift": "FIRST" // Optional: FIRST, SECOND, THIRD, WEEKEND
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "PENDING"
  }
}
```

### Forgot Password

Request a password reset email.

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "success": true
  }
}
```

### Reset Password

Reset password using a token.

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset_token",
  "password": "newpassword123"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "success": true
  }
}
```

---

## User Endpoints

### Get All Users

Get a list of all users (Admin only).

**Endpoint:** `GET /api/users`

**Permissions:** OWNER, ADMIN

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER",
      "siteId": "site_id",
      "departmentId": "dept_id",
      "positionId": "pos_id",
      "isActive": true,
      "site": { ... },
      "department": { ... },
      "position": { ... }
    }
  ]
}
```

### Get Current User

Get the currently authenticated user.

**Endpoint:** `GET /api/users/me`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  }
}
```

### Create User

Create a new user (Admin only).

**Endpoint:** `POST /api/users`

**Permissions:** OWNER, ADMIN

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123",
  "role": "USER",
  "siteId": "site_id",
  "departmentId": "dept_id",
  "positionId": "pos_id",
  "shift": "FIRST",
  "ssoId": "optional_sso_id"
}
```

**Response:** `201 Created`

### Update User

Update an existing user (Admin only).

**Endpoint:** `PUT /api/users`

**Permissions:** OWNER, ADMIN

**Request Body:**
```json
{
  "id": "user_id",
  "email": "newemail@example.com",
  "name": "Jane Doe",
  "role": "MANAGER",
  "isActive": true
}
```

**Response:** `200 OK`

### Delete User

Deactivate a user (Admin only).

**Endpoint:** `DELETE /api/users?id=<user_id>`

**Permissions:** OWNER, ADMIN

**Response:** `200 OK`

### Approve User

Approve a pending user.

**Endpoint:** `POST /api/users/approve`

**Permissions:** OWNER, ADMIN

**Request Body:**
```json
{
  "id": "user_id",
  "role": "USER"
}
```

**Response:** `200 OK`

---

## Site Endpoints

### Get All Sites

Get a list of all sites with statistics.

**Endpoint:** `GET /api/sites`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "site_id",
      "code": "SITE01",
      "name": "Main Site",
      "description": "Main facility",
      "isActive": true,
      "stats": {
        "totalUsers": 50,
        "activeUsers": 45,
        "totalDocuments": 100,
        "totalSOPs": 25,
        "completedTrainings": 200
      }
    }
  ]
}
```

### Get Site by ID

Get a specific site.

**Endpoint:** `GET /api/sites/:id`

**Response:** `200 OK`

### Create Site

Create a new site (Admin only).

**Endpoint:** `POST /api/sites`

**Permissions:** OWNER, ADMIN

**Request Body:**
```json
{
  "code": "SITE01",
  "name": "Main Site",
  "description": "Main facility"
}
```

**Response:** `201 Created`

### Update Site

Update an existing site (Admin only).

**Endpoint:** `PUT /api/sites`

**Permissions:** OWNER, ADMIN

**Request Body:**
```json
{
  "id": "site_id",
  "code": "SITE01",
  "name": "Updated Site Name",
  "isActive": true
}
```

**Response:** `200 OK`

### Delete Site

Deactivate a site (Admin only).

**Endpoint:** `DELETE /api/sites?id=<site_id>`

**Permissions:** OWNER, ADMIN

**Response:** `200 OK`

---

## Site-Specific Endpoints

### Get Site Users

Get all users for a specific site.

**Endpoint:** `GET /api/sites/:id/users`

**Permissions:** Site access required

**Response:** `200 OK`

### Get Site Departments

Get all departments for a specific site.

**Endpoint:** `GET /api/sites/:id/departments`

**Response:** `200 OK`

### Get Site Positions

Get all positions for a specific site.

**Endpoint:** `GET /api/sites/:id/positions`

**Response:** `200 OK`

### Get Site Trainings

Get all trainings for a specific site.

**Endpoint:** `GET /api/sites/:id/trainings`

**Response:** `200 OK`

### Get Site Documents

Get all documents for a specific site.

**Endpoint:** `GET /api/sites/:id/documents`

**Response:** `200 OK`

### Get Site SOPs

Get all SOPs for a specific site.

**Endpoint:** `GET /api/sites/:id/sops`

**Response:** `200 OK`

### Get Site Admins

Get all admins for a specific site.

**Endpoint:** `GET /api/sites/:id/admins`

**Permissions:** OWNER, ADMIN

**Response:** `200 OK`

---

## Department Endpoints

### Get All Departments

Get a list of all departments.

**Endpoint:** `GET /api/departments`

**Response:** `200 OK`

### Create Department

Create a new department.

**Endpoint:** `POST /api/departments`

**Permissions:** OWNER, ADMIN, SITE_ADMIN

**Request Body:**
```json
{
  "name": "Engineering",
  "description": "Engineering department",
  "siteId": "site_id"
}
```

**Response:** `201 Created`

---

## Position Endpoints

### Get All Positions

Get a list of all positions.

**Endpoint:** `GET /api/positions`

**Response:** `200 OK`

### Create Position

Create a new position.

**Endpoint:** `POST /api/positions`

**Permissions:** OWNER, ADMIN, SITE_ADMIN

**Request Body:**
```json
{
  "name": "Software Engineer",
  "description": "Develops software",
  "siteId": "site_id"
}
```

**Response:** `201 Created`

---

## Training Endpoints

### Get All Trainings

Get a list of all trainings.

**Endpoint:** `GET /api/trainings`

**Response:** `200 OK`

### Create Training

Create a new training.

**Endpoint:** `POST /api/trainings`

**Permissions:** OWNER, ADMIN, SITE_ADMIN

**Response:** `201 Created`

---

## Document Endpoints

### Get All Documents

Get a list of all documents.

**Endpoint:** `GET /api/documents`

**Response:** `200 OK`

### Upload Document

Upload a new document.

**Endpoint:** `POST /api/documents`

**Permissions:** OWNER, ADMIN, SITE_ADMIN, MANAGER

**Response:** `201 Created`

### Download Document

Download a specific document.

**Endpoint:** `GET /api/documents/:id/download`

**Response:** File download

---

## SOP Endpoints

### Get All SOPs

Get a list of all SOPs.

**Endpoint:** `GET /api/sops`

**Response:** `200 OK`

### Create SOP

Create a new SOP.

**Endpoint:** `POST /api/sops`

**Permissions:** OWNER, ADMIN, SITE_ADMIN, MANAGER

**Response:** `201 Created`

---

## Roles and Permissions

### Role Hierarchy

1. **OWNER** - Full system access
2. **ADMIN** - Full system access
3. **SITE_ADMIN** - Manage assigned sites
4. **MANAGER** - Limited management within site
5. **USER** - Basic access
6. **PENDING** - No access until approved

### Permission Matrix

| Action | OWNER | ADMIN | SITE_ADMIN | MANAGER | USER |
|--------|-------|-------|------------|---------|------|
| Manage Users | ✓ | ✓ | ✓* | ✗ | ✗ |
| Manage Sites | ✓ | ✓ | ✗ | ✗ | ✗ |
| Manage Departments | ✓ | ✓ | ✓* | ✗ | ✗ |
| Manage Positions | ✓ | ✓ | ✓* | ✗ | ✗ |
| Manage Trainings | ✓ | ✓ | ✓* | ✓* | ✗ |
| Upload Documents | ✓ | ✓ | ✓ | ✓ | ✗ |
| Create SOPs | ✓ | ✓ | ✓ | ✓ | ✗ |
| View Reports | ✓ | ✓ | ✓ | ✓ | ✗ |

\* Within assigned sites only

---

## Rate Limiting

Currently not implemented. Consider adding rate limiting for production use.

## Versioning

API versioning is not currently implemented. All endpoints are at the base `/api` path.
