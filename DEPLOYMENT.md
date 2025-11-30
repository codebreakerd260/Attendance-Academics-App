# Deployment Guide

This guide explains how to deploy the Attendance & Academics Management System to production. We recommend using **Render** for the backend and **Vercel** for the frontend.

## Prerequisites

1.  Push this project to a **GitHub repository**.
2.  Sign up for accounts on [Render](https://render.com) and [Vercel](https://vercel.com).

---

## Part 1: Deploy Backend (Render)

1.  **Create a Web Service**:
    -   Go to the Render Dashboard and click **New +** -> **Web Service**.
    -   Connect your GitHub repository.

2.  **Configure Service**:
    -   **Name**: `attendance-backend` (or similar)
    -   **Runtime**: `Python 3`
    -   **Build Command**: `pip install -r backend/requirements.txt`
    -   **Start Command**: `gunicorn backend.app:app`

3.  **Environment Variables**:
    -   Add the following variables in the "Environment" tab:
        -   `PYTHON_VERSION`: `3.11.0` (or your local version)
        -   `SECRET_KEY`: Generate a strong random string.
        -   `flask_env`: `production`

4.  **Database (PostgreSQL)**:
    -   Render offers a managed PostgreSQL database. Create one from the dashboard.
    -   Copy the **Internal Database URL**.
    -   Go back to your Web Service -> Environment.
    -   Add a variable `DATABASE_URL` and paste the connection string.
    -   *Note*: The application is already configured to use `DATABASE_URL` if present, switching from SQLite to PostgreSQL automatically.

5.  **Deploy**:
    -   Click **Create Web Service**.
    -   Wait for the deployment to finish. Copy the **Service URL** (e.g., `https://attendance-backend.onrender.com`).

---

## Part 2: Deploy Frontend (Vercel)

1.  **Import Project**:
    -   Go to the Vercel Dashboard and click **Add New...** -> **Project**.
    -   Import your GitHub repository.

2.  **Configure Project**:
    -   **Framework Preset**: Vite
    -   **Root Directory**: Click "Edit" and select `frontend`.

3.  **Environment Variables**:
    -   Expand "Environment Variables".
    -   Add `VITE_API_URL` and set it to your **Backend Service URL** from Part 1 (e.g., `https://attendance-backend.onrender.com`).
    -   *Important*: Ensure there is NO trailing slash at the end of the URL.

4.  **Deploy**:
    -   Click **Deploy**.
    -   Vercel will build and deploy your frontend.

---

## Part 3: Final Configuration

1.  **CORS Update (Optional)**:
    -   Currently, the backend allows all origins (`*`). For better security in production, you might want to restrict this to your Vercel domain in `backend/app.py`.

2.  **Create Admin User**:
    -   Since the production database is empty, you need to seed it.
    -   You can run the seed script remotely via the Render Shell or SSH.
    -   **Render Shell**:
        1.  Go to your Web Service -> Shell.
        2.  Run: `python backend/seed_mock_data.py` (This will create the admin user and mock data).

## Troubleshooting

-   **Database Connection**: Ensure `DATABASE_URL` starts with `postgresql://`. If Render provides `postgres://`, SQLAlchemy might need it changed to `postgresql://`. You can manually edit the variable in Render.
-   **Build Fails**: Check the logs. Ensure all dependencies are in `backend/requirements.txt`.
