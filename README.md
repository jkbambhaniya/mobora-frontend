# 🖥️ Mobora — Frontend

The vendor-facing dashboard for the **Mobora** platform, built with **Next.js 16**, **React 19**, and **TypeScript**. It connects to the Mobora Express backend via a built-in Next.js proxy so the backend URL is never exposed to the browser.

---

## ✨ Features

- 🔐 **JWT Authentication** — Cookie-based auth with silent token refresh and role-aware middleware
- 💬 **Real-Time Chat** — Socket.IO powered vendor ↔ customer and vendor ↔ vendor messaging
- 📊 **Dashboard** — KPI cards, stats overview, and business analytics via Recharts
- 📦 **Inventory & Mobiles** — Manage stock, specifications, and trades
- 👥 **Customer Management** — Customer contact list and details
- 🧑 **Profile Module** — Avatar upload, account details, and password management
- 🔔 **Toast Notifications** — React Hot Toast for success/error feedback
- ✅ **Yup Validation** — Client-side form validation with schema-driven rules
- 🛡️ **Security Headers** — CSP, X-Frame-Options, and Referrer-Policy via next.config.ts

---

## 🛠️ Tech Stack

| Tool                  | Purpose                                   |
|-----------------------|-------------------------------------------|
| Next.js 16            | React framework (App Router)              |
| React 19              | UI rendering                              |
| TypeScript 5          | Type safety                               |
| Tailwind CSS v4       | Utility-first styling                     |
| Axios                 | HTTP client with interceptors             |
| Socket.IO Client      | Real-time bidirectional messaging         |
| Recharts              | Data visualisation                        |
| Yup                   | Schema-based form validation              |
| React Hot Toast       | Notification toasts                       |
| Notiflix              | Confirmation dialogs                      |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **Mobora backend** running on `http://localhost:5000` *(see `../backend/README.md`)*

### Install & Run

```bash
npm install
npm run dev
```

The app will be available at **[http://localhost:3000](http://localhost:3000)**.

> **No `.env` file is needed.** All `/api/*` and `/uploads/*` requests are transparently proxied to `http://127.0.0.1:5000` via Next.js rewrites.

---

## 📁 Directory Structure

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout (fonts, providers, Toaster)
│   ├── page.tsx                # Landing / redirect page
│   ├── globals.css             # Global CSS reset & variables
│   │
│   ├── (auth)/                 # Public authentication group
│   │   ├── layout.tsx          # Auth layout wrapper
│   │   ├── login/              # Login page
│   │   ├── register/           # Registration + account-under-review
│   │   ├── forgot-password/    # Forgot password request form
│   │   └── reset-password/     # Password reset with token
│   │
│   └── (dashboard)/            # Protected vendor dashboard group
│       ├── layout.tsx          # Dashboard shell (sidebar, header)
│       ├── dashboard/          # Overview KPIs & charts
│       ├── chat/               # Real-time messaging inbox
│       ├── inventory/          # Stock management
│       ├── mobiles/            # Mobile device catalogue
│       ├── specifications/     # Device spec management
│       ├── trades/             # Trade-in management
│       ├── customer/           # Customer contact list
│       └── profile/            # Account settings & avatar
│
├── actions/                    # Centralised API action functions (Axios)
├── components/
│   ├── ui/                     # Shared, reusable UI components
│   └── vendor/
│       ├── auth/               # Auth-specific components (forms, status)
│       ├── layout/             # Sidebar, header, dropdown
│       └── profile/            # Profile tabs & sub-forms
│
├── context/
│   └── vendor/
│       ├── auth-context.tsx    # Vendor auth state & token management
│       └── chat-context.tsx    # Chat sessions, messages, Socket.IO state
│
├── hooks/                      # Custom React hooks
├── utils/                      # API client (apiClient.ts) & helpers
├── public/                     # Static assets
├── next.config.ts              # Rewrites proxy + security headers
├── tsconfig.json
└── package.json
```

---

## 🔗 API Proxy

All API calls use **relative paths** (e.g. `/api/vendor/auth/login`). Next.js rewrites them server-side:

| Frontend Path         | Proxied To                                     |
|-----------------------|------------------------------------------------|
| `/api/:path*`         | `http://127.0.0.1:5000/api/:path*`             |
| `/uploads/:path*`     | `http://127.0.0.1:5000/uploads/:path*`         |

This ensures the backend URL is **never visible** in the browser network tab.

---

## 🔐 Authentication Flow

```
1. POST /api/vendor/auth/login
   └─ Server sets HttpOnly cookie: token=<jwt>
   └─ Context stores vendor data in encrypted cookie (client)

2. Every request → Axios interceptor reads token from cookie
   └─ Attaches Authorization: Bearer <token> header

3. On 401 response → interceptor calls POST /api/vendor/auth/refresh
   └─ Gets new token → retries original request

4. On token expiry / logout → cookies cleared → redirect /login
```

Middleware (`middleware.ts`) guards all `/dashboard/*` routes and redirects unauthenticated users.

---

## 📜 Available Scripts

| Script            | Description                           |
|-------------------|---------------------------------------|
| `npm run dev`     | Start development server (port 3000)  |
| `npm run build`   | Build optimised production bundle     |
| `npm start`       | Start production server               |
| `npm run lint`    | Run ESLint checks                     |

---

## 🧩 Key Dependencies

```json
{
  "next": "16.2.9",
  "react": "19.2.4",
  "axios": "^1.18.0",
  "socket.io-client": "^4.8.3",
  "recharts": "^3.8.1",
  "yup": "^1.7.1",
  "react-hot-toast": "^2.6.0",
  "notiflix": "^3.2.8",
  "tailwindcss": "^4.3.0",
  "typescript": "^5"
}
```

---

## 🗒️ Notes

- The frontend was bootstrapped with `create-next-app` and uses the **App Router**.
- The project uses **Tailwind CSS v4** with the `@tailwindcss/postcss` plugin (no `tailwind.config.js` file required).
- Socket.IO connection is managed inside `ChatContext` and auto-reconnects on token refresh.
- All form validation schemas are written in **Yup** and shared between client validation and error display from the backend.

---

<p align="center">Part of the <strong>Mobora</strong> platform — <a href="../README.md">View full project README</a></p>
