# Training Tracker Web App Requirements

## Overview

The Training Tracker is a corporate web application designed to manage and track training compliance across multiple locations. It facilitates role-based training assignments, monitors progress, and ensures associates meet Standard Operating Procedures (SOP) requirements.

---

## Technical Stack

- [x] **Frontend**: Next.js 14 (or newer version if available, not `@latest`)
- [x] **Backend**: Prisma ORM with Neon.tech database
- [x] **Authentication**: Local authentication using NextAuth
- [x] **Design**: Sleek, corporate, and theme-aware (dark/light mode)
- [ ] **Hosting**: Cloudflare Pages/Workers (if applicable)

---

## Core Features

### 1. User Management

- **Associates**:
  - [x] Belong to departments.
  - [x] Have roles and associated SOPs to complete.
- **Departments**:
  - [x] Managed by Supervisors.
- **Supervisors**:
  - [x] Report to Managers.
- **Roles**:
  - [x] Define specific SOP requirements.

### 2. Roles & SOP Management

- [x] Assign SOPs to roles.
- [x] Track SOP completion per associate.
- [x] Support for versioned SOPs with audit trails.

### 3. Administrative Features

- **Admins**:
  - [x] Manage users, roles, SOPs, and departments.
  - [ ] Generate training compliance reports.
- **Approvers**:
  - [x] Approve training completions.
- **Trainers**:
  - [x] Mark trainings as complete for associates.

### 4. Training Progress Tracking

- [x] Dashboard for associates to view training assignments and progress.
- [x] Supervisors and Managers can monitor department compliance.

### 5. Document Management

- Upload and manage documents, including:
  - [x] Training documents.
  - [x] Signature sheets.
  - [x] SOPs themselves.
- [x] Scalable database table to handle document metadata:
  - [x] Attributes: `id`, `name`, `type`, `uploadedById`, `uploadedAt`, `relatedSopId`, etc.

---

## Design & UI

- [x] Sleek, corporate design with responsiveness for mobile and desktop.
- [x] **Theme-Aware**: Dynamic dark/light mode using Tailwind CSS or equivalent.
- [x] Intuitive navigation for all user roles.

---

## Authentication & Security

- Local authentication with NextAuth:
  - [x] Email/password-based login.
  - [x] Role-based access control (RBAC).
- [x] Password hashing and salting.
- [x] Secure database storage using Prisma with Neon.tech.

---

## Initial Data Relationships

1. **Users**:
   - [x] Attributes: `id`, `name`, `email`, `password`, `roleId`, `departmentId`, etc.
2. **Departments**:
   - [x] Attributes: `id`, `name`, `supervisorId`, `managerId`, etc.
3. **Roles**:
   - [x] Attributes: `id`, `name`, `description`, etc.
4. **SOPs**:
   - [x] Attributes: `id`, `name`, `description`, `version`, etc.
5. **Training Progress**:
   - [x] Attributes: `id`, `userId`, `sopId`, `completionDate`, `approvedById`, etc.
6. **Documents**:
   - [x] Attributes: `id`, `name`, `type` (e.g., training doc, signature sheet, SOP), `uploadedById`, `uploadedAt`, `relatedSopId`, `metadata` (JSON for extensibility), etc.

---

## Remaining Tasks

### 1. Hosting & Deployment

- [ ] **Cloudflare Pages Setup**:
  - Configure build settings for Next.js deployment
  - Set up environment variables
  - Configure custom domain (if applicable)
- [ ] **Performance Optimization**:
  - Enable caching strategies
  - Implement CDN configuration
  - Optimize asset delivery

### 2. Training Compliance Reports

- [ ] **Report Generation**:
  - Export reports in multiple formats (PDF, CSV)
  - Customizable date ranges for reporting periods
  - Filter options by department, position, and training type
- [ ] **Report Types**:
  - Training completion status by department
  - Individual associate training history
  - Overdue training notifications
  - Department compliance percentages
- [ ] **Data Visualization**:
  - Progress charts and graphs
  - Compliance trend analysis
  - Department comparison views
- [ ] **Automated Reports**:
  - Schedule recurring reports
  - Email delivery to stakeholders
  - Customizable report templates

## Future Enhancements

- Notification system for training deadlines and updates
- Mobile app development
- Integration with external training platforms
- Advanced analytics and predictive compliance tracking
