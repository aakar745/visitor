# 🚀 EasyPanel Deployment Guide

This guide will help you deploy your Visitor Management System on EasyPanel.

---

## 📋 Prerequisites

1. ✅ EasyPanel server installed and running
2. ✅ Domain names configured (optional but recommended)
3. ✅ GitHub/GitLab repository connected to EasyPanel

---

## 🎯 STEP 1: Create Backend Service

### **1.1 Create New Service**
1. Login to your EasyPanel dashboard
2. Click **"Create Service"**
3. Select **"App"** type
4. Name it: `visitor-backend`

### **1.2 Configure Source**
- **Source**: Connect your Git repository
- **Repository**: Select your backend repository
- **Branch**: `main` or `production`
- **Dockerfile Path**: `backend/Dockerfile`
- **Build Context**: `/backend`

### **1.3 Set Environment Variables**

Go to **Environment** tab and add these variables:

```bash
# Application
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Database (use EasyPanel MongoDB or external)
MONGODB_URI=mongodb://mongodb:27017/visitor_management

# JWT Secrets - GENERATE THESE!
JWT_SECRET=<YOUR_GENERATED_SECRET_HERE>
JWT_REFRESH_SECRET=<YOUR_GENERATED_REFRESH_SECRET_HERE>
SESSION_SECRET=<YOUR_GENERATED_SESSION_SECRET_HERE>

# CORS - Your frontend domain
CORS_ORIGINS=https://yourdomain.com
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
BCRYPT_ROUNDS=12

# Features
ENABLE_SWAGGER=false
ENABLE_HELMET=true
ENABLE_RATE_LIMITING=true
ENABLE_COMPRESSION=true
LOG_LEVEL=warn

# Email (optional - configure if needed)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

### **1.4 Configure Port**
- **Internal Port**: `3000`
- **Protocol**: HTTP

### **1.5 Add Domain (Optional)**
- Go to **Domains** tab
- Add domain: `api.yourdomain.com`
- Enable **SSL/HTTPS** (EasyPanel auto-provisions Let's Encrypt)

---

## 🎨 STEP 2: Create Frontend Service

### **2.1 Create New Service**
1. Click **"Create Service"**
2. Select **"App"** type
3. Name it: `visitor-admin`

### **2.2 Configure Source**
- **Source**: Connect your Git repository
- **Repository**: Select your admin repository
- **Branch**: `main` or `production`
- **Dockerfile Path**: `admin/Dockerfile`
- **Build Context**: `/admin`

### **2.3 Set Build Arguments**

EasyPanel allows you to set build-time environment variables:

Go to **Build** tab → **Build Args**:

```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_ENV=production
```

### **2.4 Set Environment Variables**

Go to **Environment** tab:

```bash
# App Configuration
VITE_APP_NAME=Visitor Management System
VITE_APP_VERSION=1.0.0

# Security
VITE_ENABLE_CSRF=true
VITE_ENABLE_CSP=true

# Features
VITE_FEATURE_EXHIBITIONS=true
VITE_FEATURE_VISITOR_REGISTRATION=true
VITE_FEATURE_USER_MANAGEMENT=true
VITE_FEATURE_ROLE_MANAGEMENT=true

# Production Optimizations
VITE_BUILD_SOURCEMAP=false
VITE_ENABLE_REACT_QUERY_DEVTOOLS=false
VITE_ENABLE_REDUX_DEVTOOLS=false
```

### **2.5 Configure Port**
- **Internal Port**: `8080` (as configured in nginx.conf)
- **Protocol**: HTTP

### **2.6 Add Domain**
- Go to **Domains** tab
- Add domain: `yourdomain.com` or `app.yourdomain.com`
- Enable **SSL/HTTPS**

---

## 🗄️ STEP 3: Create MongoDB Database

### **Option A: Use EasyPanel MongoDB Template**

1. Click **"Create Service"**
2. Select **"Database"** → **"MongoDB"**
3. Name it: `visitor-db`
4. Set password and configure
5. Note the connection string: `mongodb://mongodb:27017/visitor_management`

### **Option B: Use External MongoDB (MongoDB Atlas)**

1. Create MongoDB Atlas cluster
2. Get connection string
3. Use it in backend environment variables

---

## 🔗 STEP 4: Link Services (Networking)

EasyPanel automatically creates a private network for your services.

### **Backend needs to access:**
- MongoDB: Use service name `mongodb` in connection string
- Redis (optional): Use service name `redis`

### **Connection strings in EasyPanel:**
```bash
# MongoDB (if using EasyPanel MongoDB)
MONGODB_URI=mongodb://mongodb:27017/visitor_management

# Redis (if using EasyPanel Redis)
REDIS_HOST=redis
REDIS_PORT=6379
```

---

## 🔐 STEP 5: Generate JWT Secrets

**IMPORTANT**: Run these commands locally to generate secure secrets:

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy each output and paste into EasyPanel environment variables.

---

## 🚀 STEP 6: Deploy

### **6.1 Deploy Backend**
1. Go to backend service
2. Click **"Deploy"** button
3. Monitor logs for any errors
4. Wait for successful deployment
5. Check health: `https://api.yourdomain.com/health`

### **6.2 Deploy Frontend**
1. Go to frontend service
2. Click **"Deploy"** button
3. Monitor build logs
4. Wait for successful deployment
5. Visit: `https://yourdomain.com`

---

## ✅ STEP 7: Verify Deployment

### **Backend Health Check**
```bash
curl https://api.yourdomain.com/health
# Should return: {"status":"ok"}
```

### **Frontend Access**
1. Open browser: `https://yourdomain.com`
2. Try to login
3. Check browser console for errors
4. Verify cookies are set
5. Test CSRF protection

### **Check Logs in EasyPanel**
- Go to each service
- Click **"Logs"** tab
- Look for:
  ```
  🔒 CORS Configuration:
     Allowed Origins: [ 'https://yourdomain.com' ]
     Credentials: true
  ```

---

## 🎯 STEP 8: Configure Domains & SSL

### **Backend Domain**
1. In backend service → **Domains** tab
2. Add: `api.yourdomain.com`
3. Enable **Force HTTPS**
4. EasyPanel auto-provisions SSL certificate

### **Frontend Domain**
1. In frontend service → **Domains** tab
2. Add: `yourdomain.com` and `www.yourdomain.com`
3. Enable **Force HTTPS**
4. Set `www` to redirect to non-www (or vice versa)

### **DNS Configuration**
Point your domains to EasyPanel server IP:

```
A     api.yourdomain.com    →    YOUR_EASYPANEL_IP
A     yourdomain.com        →    YOUR_EASYPANEL_IP
CNAME www.yourdomain.com    →    yourdomain.com
```

---

## 🔧 STEP 9: Environment Variables Summary

### **Backend Critical Variables**
```bash
NODE_ENV=production
MONGODB_URI=mongodb://mongodb:27017/visitor_management
JWT_SECRET=<128-char-hex-string>
JWT_REFRESH_SECRET=<different-128-char-hex-string>
SESSION_SECRET=<another-128-char-hex-string>
CORS_ORIGINS=https://yourdomain.com
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### **Frontend Critical Build Args**
```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_ENV=production
```

---

## 📊 STEP 10: Monitoring & Maintenance

### **Monitor Logs**
- EasyPanel provides real-time logs
- Check for errors regularly
- Set up log alerts if available

### **Database Backups**
- Enable automatic backups in MongoDB service
- Or use MongoDB Atlas automated backups

### **Scaling**
- EasyPanel allows horizontal scaling
- Increase resources as needed
- Add load balancer for high traffic

### **Updates**
1. Push code to Git repository
2. EasyPanel auto-detects changes (if auto-deploy enabled)
3. Or manually click **"Deploy"** button
4. Zero-downtime deployments

---

## 🐛 Troubleshooting

### **CORS Errors**
- Check `CORS_ORIGINS` matches frontend URL exactly
- Ensure HTTPS is enabled
- Verify no trailing slashes in URLs

### **Database Connection Failed**
- Check MongoDB service is running
- Verify connection string format
- Test with MongoDB Compass

### **Build Failures**
- Check Dockerfile paths
- Verify build context is correct
- Review build logs in EasyPanel

### **401 Unauthorized**
- Verify JWT secrets are set correctly
- Check tokens are being sent in cookies
- Review authentication logs

### **502 Bad Gateway**
- Backend service not running
- Check internal port configuration (3000 for backend, 8080 for frontend)
- Review service logs

---

## 🎉 Quick Start Checklist

- [ ] Created backend service in EasyPanel
- [ ] Set all backend environment variables
- [ ] Generated and set JWT secrets
- [ ] Configured MongoDB connection
- [ ] Set CORS_ORIGINS to frontend domain
- [ ] Deployed backend successfully
- [ ] Created frontend service
- [ ] Set build args (VITE_API_BASE_URL)
- [ ] Set frontend environment variables
- [ ] Deployed frontend successfully
- [ ] Configured domains and SSL
- [ ] Verified login works
- [ ] Checked cookies are set
- [ ] CSRF protection working
- [ ] Logs showing no errors

---

## 📞 Support Resources

- **EasyPanel Docs**: https://easypanel.io/docs
- **EasyPanel Discord**: https://discord.gg/easypanel
- **Project Repo**: Your repository URL

---

## 🔒 Security Reminders

1. ✅ Never commit `.env` files to Git
2. ✅ Use strong, randomly generated JWT secrets
3. ✅ Enable HTTPS/SSL on all domains
4. ✅ Keep EasyPanel and dependencies updated
5. ✅ Regular database backups
6. ✅ Monitor logs for suspicious activity
7. ✅ Use strong MongoDB passwords
8. ✅ Disable Swagger in production (`ENABLE_SWAGGER=false`)

---

**You're all set! 🚀**

Your Visitor Management System is now deployed on EasyPanel with:
- ✅ Production-ready Docker containers
- ✅ Secure HTTPS with auto SSL
- ✅ HttpOnly cookies for authentication
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Proper CORS configuration
- ✅ Database persistence

**Need help?** Check EasyPanel logs or review this guide!

