# 📊 GigFlow – Smart Leads Dashboard

GigFlow is a premium, full-stack MERN Lead Management Dashboard built using **TypeScript** on both the frontend and backend. It features secure token authentication, Role-Based Access Control (RBAC), multi-layered filtering, search, pagination, CSV exports, and containerization.

---

## ✨ Features Checklist

*   **🔒 Secure Auth**: JWT-based cookie session auth (HttpOnly, Secure) with route guards for public/private pages.
*   **👥 Role-Based Access Control (RBAC)**:
    *   `USER`: Can view, create, and update leads assigned specifically to them.
    *   `MANAGER`: Full access to create, view, update, and reassign all leads.
    *   `ADMIN`: Full access to create, view, update, delete, and reassign all leads.
*   **📈 Dynamic Analytics**: Quick-glance metric counters for total leads, new leads, qualified leads, and won leads.
*   **🔍 Advanced Search & Filters**: Combined searches (name, email) and filters (status, source, assignee dropdowns).
*   **📄 Pagination**: Performance-optimized database queries using offset pagination.
*   **📥 CSV Export**: Custom, server-side CSV formatting with input-escaped sanitization.
*   **🎨 Premium Glassmorphism UI**: Beautiful dark mode theme using **Tailwind CSS v4** and smooth transitions.
*   **🐳 Containerized**: Complete setup using Docker and Docker Compose.

---

## 🏗️ Repository Architecture

```
gigflow-smart-leads-dashboard/
├── client/                     # Frontend Vite + React + TS
│   ├── src/
│   │   ├── api/client.ts       # Axios client setup (withCredentials)
│   │   ├── components/         # ProtectedRoute route guard
│   │   ├── layouts/            # DashboardLayout (Sidebar, User Badge)
│   │   ├── pages/              # Dashboard, Login, Register views
│   │   ├── store/authStore.ts  # Zustand Auth Store
│   │   └── types/index.ts      # TypeScript common interfaces
│   ├── Dockerfile              # Multi-stage Nginx production build
│   └── package.json
│
├── server/                     # Backend Node + Express + TS
│   ├── src/
│   │   ├── config/             # MongoDB Connection & Env config
│   │   ├── controllers/        # Auth & Lead route handlers
│   │   ├── middlewares/        # Auth, Zod Validation, & Error handlers
│   │   ├── models/             # Mongoose Schemas (User, Lead)
│   │   ├── routes/             # API Router definitions
│   │   ├── types/              # Express declarations & TS type contracts
│   │   ├── utils/              # Custom AppError & JWT utilities
│   │   └── validations/        # Zod payload schemas
│   ├── Dockerfile              # Multi-stage production container runner
│   └── package.json
│
└── docker-compose.yml          # Container orchestrator configuration
```

---

## 🔌 API Documentation

All API endpoints are mounted under `/api`.

### 🔑 Authentication Routes (`/api/auth`)

#### 1. Register User
*   **POST** `/auth/register`
*   **Body**:
    ```json
    {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "password": "securepassword123",
      "role": "MANAGER"
    }
    ```
*   **Response**: `201 Created` with User object and issues HttpOnly JWT cookie.

#### 2. User Login
*   **POST** `/auth/login`
*   **Body**:
    ```json
    {
      "email": "jane@example.com",
      "password": "securepassword123"
    }
    ```
*   **Response**: `200 OK` and issues HttpOnly JWT cookie.

#### 3. User Logout
*   **POST** `/auth/logout` (Private)
*   **Response**: `200 OK` and clears the HttpOnly auth cookie.

#### 4. Get Current User Info
*   **GET** `/auth/me` (Private)
*   **Response**: `200 OK` with user payload.

#### 5. Get Users List
*   **GET** `/auth/users` (Private: ADMIN/MANAGER only)
*   **Response**: `200 OK` with list of team members (used to populate assignee dropdowns).

---

### 📋 Lead Management Routes (`/api/leads`)

#### 1. Get Leads (with filtering, search, pagination)
*   **GET** `/leads` (Private)
*   **Query Parameters (Optional)**:
    *   `page`: Page index (default: `1`)
    *   `limit`: Page size (default: `10`)
    *   `status`: Filter by status (`NEW`, `CONTACTED`, `QUALIFIED`, `LOST`, `WON`)
    *   `source`: Filter by source (`Web`, `Referral`, `Cold Call`, `Social Media`, `Other`)
    *   `search`: Text search string matches against lead name or email
    *   `assignedTo`: Filter by User Object ID (Admin/Manager only)
*   **Response**: `200 OK` with pagination metadata and array of leads.

#### 2. Create Lead
*   **POST** `/leads` (Private)
*   **Body**:
    ```json
    {
      "name": "Acme Corp",
      "email": "leads@acme.com",
      "phone": "+1555123456",
      "status": "NEW",
      "source": "Web",
      "assignedTo": "60a89d7b92f7c0001f3e7920", // Optional (restricted on standard USER)
      "notes": "Interested in premium tier."
    }
    ```
*   **Response**: `201 Created` with populated Lead object.

#### 3. Update Lead
*   **PUT** `/leads/:id` (Private)
*   **Response**: `200 OK` with updated Lead.

#### 4. Delete Lead
*   **DELETE** `/leads/:id` (Private: ADMIN/MANAGER only)
*   **Response**: `200 OK` confirming deletion.

#### 5. Export Leads to CSV
*   **GET** `/leads/export` (Private)
*   **Query Parameters**: Supports same filters as Get Leads.
*   **Response**: Downloads standard RFC-4180 format CSV.

---

## ⚙️ Setting Up & Running

### Option A: Local Run (Development Mode)

#### 1. Configure backend server
Create a file named `.env` in the `server/` directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
JWT_SECRET=yoursupersecurejwtsecretkeygoeshere!
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```
Then run:
```bash
cd server
npm install
npm run dev
```

#### 2. Configure frontend client
Create a file named `.env` in the `client/` directory:
```env
VITE_API_URL=http://localhost:5000/api
```
Then run:
```bash
cd client
npm install
npm run dev
```

---

### Option B: Run via Docker Compose

Configure your MongoDB Atlas string inside the root `docker-compose.yml` file under backend environment keys, then spin up the environment from the repository root:
```bash
docker-compose up --build
```
- **Frontend** will be running at `http://localhost:3000`
- **Backend** will be running at `http://localhost:5000`
