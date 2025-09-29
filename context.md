## Project Overview

This system replaces traditional QR code-based food authentication in an office setting with a web app that authenticates users via company email and biometric (face) verification. When a user scans a QR code in the office, they are authenticated by their email and face data, with all interactions logged and managed via interactive dashboards for various user roles.

## Key Goals

- Concise, clean, minimal codebase
- Role-based dashboards (User, Manager, Vendor, Admin/Super Admin)
- Integration-ready with the company’s face authentication SDK for user enrolment and verification, using custom API workflows
- Firebase backend for storage, logging, and real-time updates

---

## Core Functional Flows

## 1. User Authentication & Enrolment

- Users authenticate on the webapp via company domain emails.
- Face verification is triggered (via the SDK), with image capture and liveness detection.
- **Enrol API**: On first use, users provide a unique ID number, capture a selfie, and are cross-checked via the dedupe API to prevent duplicate enrolments and blocklisted matches. The enrolment is approved only if dedupe counts (match, suspicious, blocklist) are zero.
- **Fallback**: If face verification fails, fallback via email verification and retry flows is available. Notification emails for failures/successes are sent automatically.

## Workflow IDs and API

- WorkflowId: **`enrol`**
- Enrol API Endpoint: **`https://phl-orion.hyperverge.co/v2/search`**
- Parameters: **`transactionId`**, **`selfie`**, **`block`**, **`enrol`**, **`ignoreSelfieQuality`**, **`idNumber`**, **`idType`**
- Outcome Logic: Enrolment passes only if **`matchCount`**, **`mismatchCount`**, **`blockCount`** are zero.

## 2. Role-Based Dashboards

- **User Dashboard**: See own QR history, scan analytics (rush graph, stats by meal), menu for the day
- **Manager Dashboard**: Manage users, invite vendors, monitor user & meal stats, export data, handle vendor requests and complaints
- **Vendor Dashboard**: View menu requests, manage menu, respond to company requests
- **Admin/Super Admin Dashboard**: Manage managers, vendor list, organizational domain, role escalations, audit and logs

## 3. Onboarding & Domain Management

- Company receives email invite or signs up via public landing.
- First Admin verifies company domain (DNS/email-based).
- Domain is locked to their tenant; further users must belong to that domain.
- Admin creates/appoints additional managers for role redundancy and security.
- Managers are invited by email and complete registration via SSO or secure credential setup.

## 4. Face Verification Workflow (SDK & API Integration)

- Form collects ID number from user.
- User captures selfie; SDK runs liveness and returns QC status.
- Backend (via enrol API) checks for face duplicates, suspicious matches, blocklist hits.
- Only unique and matched faces are allowed for enrolment.
- All outcomes, retries, and fails are logged; notifications sent on verification pass/fail.

## Example SDK Integration

`javascript*// SDK script inclusion*
<script src="https://hv-camera-web-sg.s3-ap-southeast-1.amazonaws.com/hyperverge-web-sdk@{VERSION}/src/sdk.min.js"></script>

*// Token setup*
const accessToken = getTokenFromBackend(appId, appKey);
const hyperKycConfig = new window.HyperKycConfig(accessToken, 'enrol', transactionId);

*// SDK Launch*
window.HyperKYCModule.launch(hyperKycConfig, handler);
function handler(result) {
  *// Handle auto_approved, auto_declined, needs_review*
}`

Refer to [Web SDK docs](https://github.com/SolutionsTeamHV/HyperKYC_Sample_Apps/tree/main/Web_SDK) for more examples.

---

## Backend (Firebase)

- Store user enrolments, scan events, and dashboard metrics.
- User role management via Firestore collections (users, managers, vendors, admins).
- Audit logs for authentication events, failed verifications, and admin actions.
- Real-time updates for dashboards via Firebase listeners.

---

## Edge Cases & Industry Best Practices

- **Lost Admin Access**: Prompt Admin to add secondary super admin; provider-side recovery for lockouts.
- **Domain Typos/Misregistration**: Verification-of-domain flow after first registration; admin can request correction/change with provider assistance.
- **Face Auth Failures**: Offer fallback to mail verification and alternate recovery steps.
- **Vendor Data Leakage Risk**: Strict RBAC in Firebase; vendors access only assigned company requests.
- **Session Security**: Short session expiries, anti-CSRF, MFA on sensitive actions, secure password resets.

---

## Example Diagrams (Describe for Excalidraw/Latex)

- **User Flow**: Scan QR → Face Verify → Email Fallback if needed → Dashboard Access
- **Role Segregation**: Admin → Managers → Users & Vendors (each with isolated dashboard views and access)
- **Enrol Workflow**: ID Form → Liveness Capture → Dedupe API → Approve/Decline → Notification → Dashboard

---

## Code Quality Checklist

- No unnecessary code; keep logic, files, and UI as minimal and readable as possible.
- Components split by role (User, Manager, Vendor, Admin).
- Comments only for business logic, not redundant explanations.
- All API/SDK integration isolated and abstracted for easy updates.

---

## References & Integration Links

- Face Auth & Dedupe API: [HyperKYC Sample Apps](https://github.com/SolutionsTeamHV/HyperKYC_Sample_Apps/tree/main/Web_SDK)
- Firebase setup: [Firebase Documentation](https://firebase.google.com/docs)
- Role management: See SaaS RBAC examples at [Frontegg](https://frontegg.com/guides/roles-and-permissions-handling-in-saas-applications) and [Aserto](https://www.aserto.com/use-cases/multi-tenant-saas-rbac)
- UX inspiration for dash: Diagrams and flows as in provided Excalidraw images

---

This documentation may be used as your system context for any ML agent, new developer onboarding, and project requirements—ensuring the same architecture and business rules are always referenced for future improvements and maintenance.Here is your permanent system documentation, combining your diagrams, workflow explanation, best practices, and architectural principles—optimized for reference by developers and any future LLM-based agent.

---

## WebApp System Documentation — QR + Face Authentication for Food Attendance

## 1. Background & Objective

This SaaS webapp replaces a legacy QR code wall-scan for food attendance. Users scan a QR code, authenticate with company domain email and face verification (using a third-party SDK and API), with activity logged in dashboards. All roles and flows are managed securely and kept minimal for maintainability.

---

## 2. Technical Architecture

## User Authentication & Flow

- **Frontend:**
    - Collect email (must match company domain @company.co)
    - Face verification via SDK (selfie + liveness/check)
    - Fallback to email verification if face fails
    - Onboarding via unique ID number with validation regex
- **Backend (Firebase):**
    - Store enrolments, events, logs, menu requests
    - Real-time updates for dashboard analytics
    - Role records for Admins, Managers, Vendors, Users

## Face Enrolment API (Company Docs)

- Workflow ID: **`enrol`**
- Flow:
    1. Collect unique ID, run liveness via SDK
    2. Submit to **`https://phl-orion.hyperverge.co/v2/search`** with **`enrol:yes`**, ID, selfie
    3. Approve if matchCount, mismatchCount, blockCount all zero
    4. Response determines workflow pass/fail
- Deduplication ensures a user isn’t double-enrolled

## Role Hierarchy & Onboarding

- **Super Admin:** Invited via email, confirms domain, sets up tenant, assigns at least one backup admin
    - Can add Managers, audit, vendor relations, domain verification
    - If sole super admin leaves, setup required for secure recovery via provider
- **Manager:** Added by admin, invited via secure link/email, can onboard users/vendors, export data, review logs, limited audit powers
- **User:** Added via company SSO or manager invitation, scans QR and runs face auth for food attendance, personal dashboard of activity
- **Vendor:** Invited by managers, independent credential workflow, sees only their company’s requests

---

## 3. UI/UX & Dashboard Features

- **User Dashboard:** Analytics (rush graphs, per-meal stats), daily menu, personal logs, reminders (e.g. missed breakfast)
- **Manager/Admin Dash:** Add/remove users/vendors, export data, visualize user scan logs, invite/role management, handle complaints, trigger API calls as needed
- **Vendor Dash:** Menu updates, fulfillment requests, activity log

---

## 4. Edge Cases & Security

- **Domain Typos:** Verification step after first admin registers. Manual correction by provider if needed.
- **Locked Out Admin:** Require at least two super admins per tenant. Provider-side secure escalation for recovery.
- **Failed Biometric Auth:** Automatic fallback to secondary email verification; retry or manual review.
- **RBAC Enforcement:** Strict permissions by role, zero trust between tenants/vendors. Vendors never see other company data.
- **Session Handling:** Short expiry, MFA for privilege changes, secure password reset.

---

## 5. Integration Principles (For SDK/API)

- Use only what’s required—minimal code, no bloat.
- SDK script (latest version), token via appId/appKey, handler for workflow states.
- Workflow:
    - ID entry -> Liveness/selfie -> Deduplication API -> Decision (approve/decline)
- Modularize logic for easy UI/SDK upgrade

Refer to:

- [HyperKYC Sample Web SDK Integration](https://github.com/SolutionsTeamHV/HyperKYC_Sample_Apps/tree/main/Web_SDK)
- Firebase Auth + Role Setup: [Firebase Docs](https://firebase.google.com/docs)

---

## 6. Best Practices

- Concise, self-explanatory UI
- Isolate code by role (User, Manager, Vendor, Admin)
- RBAC assignment at user creation, not post-hoc
- All admin actions auditable
- Secure onboarding (invite/mail link with expiry), MFA recommended

---

**Summary:**

This doc is structured to be directly reusable as dev and ML context, for onboarding, development, and operation. All flows, edge cases, and interfaces are documented above, ensuring continuity, compliance, and scalability.

## PHASE 1: Core Authentication & User Flow, SDK Mock Placeholder

- Implement core authentication and user frontend login using fallback (email verification) as primary login method
- Prepare SDK integration placeholders (UI/logic ready, but not invoked yet)
- Integrate backend (Firebase) for user management, roles, logging fallback login events
- User dashboard placeholder with basic scan logging
- Admin login and basic dashboard for managing users and invites

---

## PHASE 2: Enhanced User Dashboard & SDK Integration

- Develop full-featured User Dashboard with insights and analytics (rush graph, meal-wise stats)
- Begin real SDK integration for biometric face verification and enrolment workflow
- Replace fallback face verification simulation with actual SDK calls
- Backend logging of SDK verification results and statuses

---

## FUTURE PHASES: Vendor & Admin Features, Edge Cases

- Extend system to support Vendors with dedicated dashboards and request flows
- Complete and refine Admin and Manager dashboards for full lifecycle management
- Implement domain verification and multi-admin handling, fallback edge cases
- Add notifications, audit logs, compliance, and security enhancements