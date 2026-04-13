# 🔍 StrongerNotes - Testing & Visualization Guide

This guide explains how to verify the current state of the project (Phase 2).

## 1. Automated Testing (Backend)
We use `vitest` and `mongodb-memory-server` for isolated integration tests.
```bash
cd back
npm test
```
**What is tested:**
*   User creation and listing.
*   Duplicate email prevention (409 Conflict).
*   JWT Authentication (Login with correct/wrong credentials).

## 2. Manual Testing Flow

### Setup
1.  **Backend:** 
    ```bash
    cd back
    npm install
    npm run dev
    ```
2.  **Frontend:**
    ```bash
    cd front
    npm install
    npm run dev
    ```

### Recommended Test Scenario
1.  **Open the App:** Navigate to `http://localhost:5173` (or the port shown by Vite).
2.  **Registration:**
    *   Click "Get Started Free".
    *   Fill in your name, email, and a password (min 8 chars).
    *   **Success:** You should be automatically redirected to the Dashboard.
3.  **Dashboard Visualization:**
    *   Verify your name and email appear in the sidebar.
    *   Test the **Theme Toggle** (Sun/Moon icon) - it should switch between light and dark modes instantly.
4.  **Logout & Login:**
    *   Click "Sign Out" in the dashboard sidebar.
    *   You should be redirected to the Login page.
    *   Log in with the credentials you just created.
    *   **Success:** You should return to the Dashboard.
5.  **Protected Routes:**
    *   Try to access `http://localhost:5173/dashboard` while logged out.
    *   **Success:** You should be automatically redirected to `/login`.

## 3. Database Visualization
Since we are using MongoDB Atlas or a local instance:
*   **Atlas:** Log in to your MongoDB Atlas dashboard to see the `users` collection in the `strongernotes` database.
*   **Local:** Use **MongoDB Compass** and connect to `mongodb://localhost:27017` to inspect the data.

## 4. Troubleshooting
*   **API Connection Error:** Ensure the backend is running on port 3333 and `front/.env` has `VITE_API_URL=http://localhost:3333`.
*   **Validation Errors:** Check that the email is valid and the password has at least 8 characters.
