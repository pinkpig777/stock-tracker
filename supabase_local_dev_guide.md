# 🛠️ Supabase Local Development Guide

## Bypassing Email Rate Limits & Offline Testing

This guide documents the process of setting up the Supabase CLI to run a local instance of your backend. This allows for unlimited testing of Auth (Magic Links) using a mock email server (Inbucket).

---

### 1. Prerequisites
* **Docker Desktop:** Must be installed and running. [Download Here](https://www.docker.com/products/docker-desktop/)
* **Node.js/NPM:** Required to run the CLI via `npx`.

---

### 2. Installation & Initialization

Open your terminal in the project root directory.

#### A. Install & Login
```bash
# 1. Login to link your Supabase account (opens browser)
npx supabase login
```

#### B. Initialize Project
```bash
# 2. Create the configuration folder (creates /supabase directory)
npx supabase init
```
> **Note:** Commit the generated `supabase/` folder to Git.

---

### 3. Starting the Local Server
Ensure Docker is running, then execute:

```bash
npx supabase start
```
* **First run:** This may take 5-10 minutes to download Docker images.
* **Success Output:** You will see a list of local URLs:

> - **API URL:** `http://127.0.0.1:54321`
> - **Studio URL:** `http://127.0.0.1:54323` (Your Local Dashboard)
> - **Inbucket URL:** `http://127.0.0.1:54324` (Your Fake Email Server)
> - **anon key:** `eyJ...` (Copy this for step 5)

---

### 4. Handling "Rate Limited" Emails (Inbucket)
When testing login in your app locally, emails are intercepted, not sent.

1.  Trigger the "Send Magic Link" in your React App.
2.  Open your browser to: [http://127.0.0.1:54324](http://127.0.0.1:54324)
3.  You will see the email there. Click the link inside to log in.

**Benefit:** 0 latency, unlimited emails, no rate limits.

---

### 5. Connecting Frontend to Local Backend
Update your `.env` file to switch between Cloud (Production) and Local (Development).

```ini
# --- PROD (Vercel / Cloud) ---
# VITE_SUPABASE_URL=https://your-cloud-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-cloud-anon-key

# --- DEV (Local / Docker) ---
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=paste_the_anon_key_from_step_3_output
```
Restart your Vite server (`npm run dev`) after saving this file.

---

### 6. Setting up the Local Database
Your local database starts empty. You must recreate the tables.

1.  Go to the Local Studio: [http://127.0.0.1:54323](http://127.0.0.1:54323)
2.  Navigate to **SQL Editor**.
3.  Paste and Run your Master SQL Script (the one creating `portfolios`, `user_settings`, and RLS policies).

---

### 7. Daily Workflow

**To Start Work:**
1.  Open Docker Desktop.
2.  Run `npx supabase start` in the terminal.
3.  Run `npm run dev` in a second terminal.

**To Stop Work:**
```bash
npx supabase stop
```
