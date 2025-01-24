# Training Tracker Web App Requirements

## Overview

The Training Tracker is a corporate web application designed to manage and track training compliance across multiple locations. It facilitates role-based training assignments, monitors progress, and ensures associates meet Standard Operating Procedures (SOP) requirements.

---

## Technical Stack

- **Frontend**: Next.js 14 (or newer version if available, not `@latest`)
- **Backend**: Prisma ORM with Neon.tech database
- **Authentication**: Local authentication using NextAuth
- **Design**: Sleek, corporate, and theme-aware (dark/light mode)
- **Hosting**: Cloudflare Pages/Workers (if applicable)

---

## Core Features

### 1. User Management

- **Associates**:
  - Belong to departments.
  - Have roles and associated SOPs to complete.
- **Departments**:
  - Managed by Supervisors.
- **Supervisors**:
  - Report to Managers.
- **Roles**:
  - Define specific SOP requirements.

### 2. Roles & SOP Management

- Assign SOPs to roles.
- Track SOP completion per associate.
- Support for versioned SOPs with audit trails.

### 3. Administrative Features

- **Admins**:
  - Manage users, roles, SOPs, and departments.
  - Generate training compliance reports.
- **Approvers**:
  - Approve training completions.
- **Trainers**:
  - Mark trainings as complete for associates.

### 4. Training Progress Tracking

- Dashboard for associates to view training assignments and progress.
- Supervisors and Managers can monitor department compliance.

### 5. Document Management

- Upload and manage documents, including:
  - Training documents.
  - Signature sheets.
  - SOPs themselves.
- Scalable database table to handle document metadata:
  - Attributes: `id`, `name`, `type`, `uploadedById`, `uploadedAt`, `relatedSopId`, etc.

---

## Design & UI

- Sleek, corporate design with responsiveness for mobile and desktop.
- **Theme-Aware**: Dynamic dark/light mode using Tailwind CSS or equivalent.
- Intuitive navigation for all user roles.

---

## Authentication & Security

- Local authentication with NextAuth:
  - Email/password-based login.
  - Role-based access control (RBAC).
- Password hashing and salting.
- Secure database storage using Prisma with Neon.tech.

---

## Initial Data Relationships

1. **Users**:
   - Attributes: `id`, `name`, `email`, `password`, `roleId`, `departmentId`, etc.
2. **Departments**:
   - Attributes: `id`, `name`, `supervisorId`, `managerId`, etc.
3. **Roles**:
   - Attributes: `id`, `name`, `description`, etc.
4. **SOPs**:
   - Attributes: `id`, `name`, `description`, `version`, etc.
5. **Training Progress**:
   - Attributes: `id`, `userId`, `sopId`, `completionDate`, `approvedById`, etc.
6. **Documents**:
   - Attributes: `id`, `name`, `type` (e.g., training doc, signature sheet, SOP), `uploadedById`, `uploadedAt`, `relatedSopId`, `metadata` (JSON for extensibility), etc.

---

## Next Steps

- Define additional workflows (e.g., training assignments, notification system).
- Detail reporting and analytics requirements.
- Clarify specific user interface components and interactions.
