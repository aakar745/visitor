# 🔌 Port Configuration

## Application Ports

| Application | Port | URL | Purpose |
|-------------|------|-----|---------|
| **Backend API** | **3000** | http://localhost:3000 | NestJS REST API |
| **Admin Panel** | **5173** | http://localhost:5173 | React Admin Dashboard (Vite) |
| **Visitor Frontend** | **3001** | http://localhost:3001 | Next.js Public Registration |

---

## API Endpoints

### Backend (Port 3000)
```
http://localhost:3000/api/v1        - API Base URL
http://localhost:3000/api/docs      - Swagger Documentation
http://localhost:3000/health         - Health Check
http://localhost:3000/uploads/       - Static File Uploads
```

### Admin Panel (Port 5173)
```
http://localhost:5173                - Admin Dashboard
http://localhost:5173/login          - Admin Login
http://localhost:5173/exhibitions    - Exhibition Management
http://localhost:5173/visitors       - Visitor Management
```

### Visitor Frontend (Port 3001)
```
http://localhost:3001                - Home Page
http://localhost:3001/[slug]         - Exhibition Registration
http://localhost:3001/[slug]/exhibitor/[id] - Exhibitor Referral
http://localhost:3001/success        - Registration Success
```

---

## Environment Configuration

### Backend (.env or .env.local)
```bash
PORT=3000
HOST=0.0.0.0
CORS_ORIGINS=http://localhost:5173,http://localhost:3001
```

### Admin (.env or .env.local)
```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### Frontend (.env.local)
```bash
PORT=3001
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```

---

## Running All Applications

### Start Backend
```bash
cd backend
npm run start:dev
# Runs on http://localhost:3000
```

### Start Admin
```bash
cd admin
npm run dev
# Runs on http://localhost:5173
```

### Start Frontend
```bash
cd frontend
npm run dev
# Runs on http://localhost:3001
```

---

## Production Ports

In production, you'll typically use:
- **Backend**: Standard port (3000) or 80/443 behind reverse proxy
- **Admin**: Served via Nginx on custom domain (e.g., admin.yourdomain.com)
- **Frontend**: Served via Nginx on main domain (e.g., register.yourdomain.com)

---

## CORS Configuration

**Backend must allow requests from:**
- Admin Panel: `http://localhost:5173`
- Visitor Frontend: `http://localhost:3001`

Update `backend/.env`:
```bash
CORS_ORIGINS=http://localhost:5173,http://localhost:3001
```

Or in production:
```bash
CORS_ORIGINS=https://admin.yourdomain.com,https://register.yourdomain.com
```

---

## Troubleshooting

### Port Already in Use
```bash
# Windows - Kill process on port
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# Or use different port
PORT=3002 npm run dev
```

### CORS Errors
- Check backend CORS_ORIGINS includes frontend URL
- Verify credentials are enabled
- Check browser console for specific error

### API Connection Failed
- Ensure backend is running on port 3000
- Check NEXT_PUBLIC_API_BASE_URL in frontend/.env.local
- Verify no firewall blocking

