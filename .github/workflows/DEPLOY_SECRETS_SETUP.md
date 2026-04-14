# GitHub Actions Secrets Setup Guide

## Problem
The deploy.yml workflow is failing because required secrets are not configured in the GitHub repository settings.

**Error:** `Secret SERVER_HOST is required, but not provided while calling.`

## Required Secrets

You need to configure these secrets in your GitHub repository:

### Repository Settings → Secrets and variables → Actions

---

### 1. SERVER_HOST
**Type:** Repository Secret  
**Value:** IP address or hostname of your Ubuntu production server  
**Example:** `192.168.1.100` or `my-server.example.com`

---

### 2. SERVER_USER
**Type:** Repository Secret  
**Value:** SSH login username on the production server  
**Example:** `ubuntu` or `deploy`

---

### 3. SERVER_SSH_KEY
**Type:** Repository Secret  
**Value:** Full PEM-formatted private SSH key contents  
**How to get it:**
```bash
# On your local machine, generate a new SSH key pair:
ssh-keygen -t rsa -b 4096 -C "github-actions@yourdomain.com" -f ~/.ssh/github-deploy-key

# Copy the PRIVATE key (not the .pub file) to GitHub secret:
cat ~/.ssh/github-deploy-key

# Copy the PUBLIC key to your server:
ssh-copy-id -i ~/.ssh/github-deploy-key.pub ubuntu@YOUR_SERVER_IP
```

---

### 4. BACKEND_ENV
**Type:** Repository Secret  
**Value:** Complete contents of your `backend/.env` file  
**Example:**
```
DATABASE_URL=mysql://user:password@127.0.0.1:3306/eventhub
JWT_SECRET=your-very-long-random-jwt-secret-here
PORT=3001
NODE_ENV=production
```

---

### 5. FRONTEND_ENV
**Type:** Repository Secret  
**Value:** Complete contents of your `frontend/.env` file  
**Example:**
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## Step-by-Step Setup Instructions

### Step 1: Access GitHub Repository Settings
1. Go to your GitHub repository
2. Click **Settings** tab
3. Scroll down to **Secrets and variables** section
4. Click **Actions**

### Step 2: Add Each Secret
For each secret listed above:
1. Click **New repository secret**
2. Enter the **Name** (exactly as shown)
3. Enter the **Secret** value
4. Click **Add secret**

### Step 3: Verify Server SSH Access
Before running deployment, ensure:
1. Your server is running Ubuntu
2. SSH key is properly installed on the server
3. The deployment user has sudo access
4. PM2 is installed and configured
5. The `/home/ubuntu/eventhub` directory exists

### Step 4: Test the Deployment
After setting up all secrets:
1. Push a commit to the `main` branch, or
2. Go to **Actions** tab → **Deploy – Production** → **Run workflow**

---

## Troubleshooting

### If SSH connection fails:
```bash
# Test SSH connection from your local machine:
ssh -i ~/.ssh/github-deploy-key ubuntu@YOUR_SERVER_IP

# If it works locally but fails in GitHub Actions:
# - Check that the private key was copied correctly (no extra spaces/newlines)
# - Verify the server hostname/IP is correct
# - Ensure the SSH key has proper permissions (600)
```

### If deployment fails:
- Check the GitHub Actions logs for detailed error messages
- SSH into your server and check PM2 status: `pm2 status`
- Verify environment files were written: `cat /home/ubuntu/eventhub/backend/.env`

### Common Issues:
1. **Extra whitespace** in secret values (especially SSH keys)
2. **Wrong user** (must match the user who can SSH to server)
3. **Missing sudo permissions** for PM2 commands
4. **Database connection** issues in production

---

## Security Notes

- **SSH keys** should be dedicated to GitHub Actions (not reused)
- **Environment variables** contain sensitive data - keep them secret
- **Database credentials** should use strong passwords
- **JWT secrets** should be long random strings (256+ bits)

---

## Alternative: Skip Deployment for Now

If you want to disable deployment temporarily:

1. Go to **Settings** → **Environments**
2. Click **production** environment
3. Add required reviewers or disable the environment
4. Or comment out the deployment job in `deploy.yml`

This allows CI checks to run without attempting deployment.