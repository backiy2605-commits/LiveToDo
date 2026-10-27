# 🔥 LiveToDo – Google Sign-In Setup Guide

## Quick Start (No Setup Needed)
Just click **"Continue as Demo User"** on the login screen — no Google account required!

---

## Setting Up Real Google Sign-In

To use your actual Google account, follow these steps:

### Step 1: Create a Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Click **"New Project"** → name it `LiveToDo`
3. Click **"Create"**

### Step 2: Enable Google Identity API
1. In your project, go to **APIs & Services → Library**
2. Search for **"Google Identity"** and enable it

### Step 3: Create OAuth Credentials
1. Go to **APIs & Services → Credentials**
2. Click **"+ CREATE CREDENTIALS" → OAuth client ID**
3. Application type: **Web application**
4. Name: `LiveToDo`
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:8080`
   - `http://localhost`
6. Click **Create**
7. **Copy your Client ID** (looks like: `123456789-abc...apps.googleusercontent.com`)

### Step 4: Add Your Client ID to the App
Open `index.html` and find this line:

```html
data-client_id="YOUR_GOOGLE_CLIENT_ID"
```

Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID.

### Step 5: Run with the Local Server
Google Sign-In requires HTTP (not file://), so use the local server:

```powershell
# In the livetodo folder:
python -m http.server 8080
```

Then open: http://localhost:8080

---

## Why Can't I Use file:// with Google Sign-In?
Google OAuth requires a proper HTTP origin for security. The local Python server provides this.
The "Demo User" mode works without any of this setup.
