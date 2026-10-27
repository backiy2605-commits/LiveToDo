# 🚀 How to Deploy LiveToDo to Vercel (With Backend & Cloud Database)

LiveToDo is now fully equipped with:
- **Frontend:** Unique Ember Dark UI with interactive dashboard, client management, payments tracking, week-by-week monthly planner, and daily todos.
- **Backend API:** Vercel Serverless Functions (`/api/auth/google`, `/api/data`, `/api/config`).
- **Cloud Database:** MongoDB Atlas (Free Tier) to store every user's projects, clients, payments, and todos online, isolated per user.
- **Google Sign-In:** Authenticates each user with their Google Account and loads their personal cloud workspace.

---

## ⚡ Quick 3-Step Vercel Deployment

### Step 1: Push Code to GitHub
1. Create a new repository on [GitHub](https://github.com/new) called `livetodo`.
2. In your terminal inside `C:\Users\HIRO\.gemini\antigravity\scratch\livetodo`, run:
```bash
git init
git add .
git commit -m "LiveToDo fullstack freelance command center"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/livetodo.git
git push -u origin main
```

---

### Step 2: Import into Vercel
1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Click **"Import"** next to your `livetodo` repository.
3. Framework Preset: Leave as **Other** (Vercel automatically detects the static frontend and `/api` serverless backend).
4. Click **Deploy**!

---

### Step 3: Add Your Free Cloud Database & Google Auth (In Vercel)
In your Vercel Project Dashboard, navigate to **Settings** → **Environment Variables** and add these 3 variables:

| Variable Name | Description | Example / How to Get |
|---|---|---|
| `MONGODB_URI` | Free MongoDB Atlas URI | `mongodb+srv://admin:pass@cluster0.xyz.mongodb.net/livetodo?retryWrites=true&w=majority` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `123456789-abc.apps.googleusercontent.com` |
| `JWT_SECRET` | Secret key for sessions | Any random string (e.g. `livetodo-my-secure-key-2026`) |

Click **Save** and trigger a **Redeploy** (Deployments → Latest → Redeploy).

---

## ☁️ Getting Your Free MongoDB Atlas Database (2 Minutes)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Choose the **M0 Free Cluster** (Free forever, 512MB storage).
3. Under **Database Access**, create a user (e.g. username: `admin`, password: `yourpassword`).
4. Under **Network Access**, click **Add IP Address** → Choose **"Allow Access from Anywhere"** (`0.0.0.0/0`) so Vercel serverless functions can connect.
5. Click **Connect** → **Drivers** → Copy the connection string.
6. Replace `<password>` with your database user password and paste it as `MONGODB_URI` in Vercel!

---

## 🔑 Getting Your Google OAuth Client ID
1. Visit [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project named `LiveToDo`.
3. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth Client ID**.
4. Application type: **Web application**.
5. Under **Authorized JavaScript origins**, add:
   - Your Vercel URL (e.g. `https://livetodo.vercel.app`)
   - `http://localhost:3000` (for local development)
6. Copy the **Client ID** and set it as `GOOGLE_CLIENT_ID` in Vercel!

---

## 💻 Running Locally (Optional)
If you want to test the full backend locally on your computer:
```powershell
npm install
node server.js
```
Then open: **http://localhost:3000**
