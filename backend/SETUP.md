# Backend Setup Guide

## ✅ What's Been Created

### Core Infrastructure
- ✅ NestJS project structure with latest packages (2025 versions)
- ✅ TypeScript configuration with path aliases
- ✅ MongoDB integration with Mongoose
- ✅ Environment configuration system
- ✅ Security (Helmet, CORS, Rate Limiting)
- ✅ Global error handling and logging
- ✅ Request/Response transformation
- ✅ Swagger API documentation (auto-generated)

### Database Schemas (MongoDB)
- ✅ User Schema (with roles, authentication)
- ✅ Role Schema (with permissions)
- ✅ GlobalVisitor Schema (deduplicated visitor profiles)
- ✅ Exhibition Schema (comprehensive with pricing, custom fields)
- ✅ ExhibitionRegistration Schema (visitor registrations)

### Modules Created
- ✅ **Auth Module**: JWT authentication, login, refresh tokens
- ✅ **Health Module**: Health check endpoint

### Common Utilities
- ✅ Exception filters (centralized error handling)
- ✅ Logging interceptor (HTTP request logging)
- ✅ Transform interceptor (response standardization)
- ✅ JWT Auth Guard (route protection)
- ✅ Roles Guard (permission-based access)
- ✅ Decorators: @Public(), @Roles(), @CurrentUser()

## 📦 Installation Steps

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup MongoDB
Make sure MongoDB is running locally or update the connection string in `.env`:
```bash
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/visitor_management

# OR MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/visitor_management
```

### 3. Configure Environment
```bash
# Copy the example environment file
cp env.example.txt .env

# Edit .env and update:
# - MONGODB_URI (your database connection)
# - JWT_SECRET (change the default secret!)
# - JWT_REFRESH_SECRET (change the default secret!)
# - CORS_ORIGINS (add your frontend URL)
```

### 4. Start the Server
```bash
# Development mode with hot reload
npm run start:dev

# The server will start on http://localhost:3000
# API docs available at http://localhost:3000/api/docs
```

## 🎯 Next Steps - Modules to Create

You now need to create the remaining feature modules. Here's the recommended order:

### Priority 1: Core Modules
1. **Users Module** (`src/modules/users/`)
   - CRUD operations for users
   - User profile management
   - User search and filtering

2. **Roles Module** (`src/modules/roles/`)
   - CRUD operations for roles
   - Permission management
   - Role assignment

### Priority 2: Business Logic Modules
3. **Exhibitions Module** (`src/modules/exhibitions/`)
   - Create, update, delete exhibitions
   - Exhibition status management
   - Pricing tier management
   - Custom fields management

4. **Visitors Module** (`src/modules/visitors/`)
   - Global visitor profile management
   - Visitor search across exhibitions
   - Visitor analytics

5. **Exhibition Registrations Module** (can be part of Visitors or separate)
   - Handle visitor registrations for exhibitions
   - Check-in/check-out functionality
   - Registration status management

### Priority 3: Supporting Modules
6. **Exhibitors Module** (`src/modules/exhibitors/`)
   - Exhibitor management
   - Link generation
   - QR code generation

7. **Payments Module** (`src/modules/payments/`)
   - Razorpay integration
   - Payment webhook handling
   - Payment status tracking

8. **Badges Module** (`src/modules/badges/`)
   - Badge generation with QR codes
   - Badge template management
   - PDF generation

9. **Notifications Module** (`src/modules/notifications/`)
   - Email service (SMTP/SendGrid)
   - SMS service (Twilio/MSG91)
   - Notification templates

10. **Uploads Module** (`src/modules/uploads/`)
    - File upload handling
    - S3/Azure/Local storage
    - Image processing

11. **Settings Module** (`src/modules/settings/`)
    - System settings CRUD
    - Settings categories
    - Settings history/audit

12. **Analytics Module** (`src/modules/analytics/`)
    - Dashboard statistics
    - Report generation
    - Data aggregation

## 🏗️ Module Creation Template

For each module, create this structure:
```
src/modules/[module-name]/
├── dto/
│   ├── create-[entity].dto.ts
│   ├── update-[entity].dto.ts
│   └── query-[entity].dto.ts
├── [module-name].controller.ts
├── [module-name].service.ts
└── [module-name].module.ts
```

## 🔐 Database Seeding

Create a seed script to populate initial data:
```typescript
// src/database/seeds/run-seed.ts
// - Create default roles (super_admin, admin, manager, etc.)
// - Create default admin user
// - Create system settings
```

## 🧪 Testing

Run tests:
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 📚 API Documentation

Once the server is running, access Swagger documentation:
- URL: http://localhost:3000/api/docs
- All endpoints are automatically documented
- Try out APIs directly from the browser

## 🚀 Deployment Checklist

Before deploying to production:
- [ ] Change all default secrets in `.env`
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS origins
- [ ] Set up MongoDB with authentication
- [ ] Configure email/SMS providers
- [ ] Set up file storage (S3/Azure)
- [ ] Configure payment gateway
- [ ] Set up error monitoring (Sentry)
- [ ] Configure backup strategy
- [ ] Set up SSL/TLS

## 📝 Additional Resources

- NestJS Documentation: https://docs.nestjs.com
- Mongoose Documentation: https://mongoosejs.com
- MongoDB Best Practices: https://docs.mongodb.com/manual/administration/

## ⚡ Quick Commands

```bash
# Development
npm run start:dev         # Start with hot reload
npm run build             # Build for production
npm run start:prod        # Start production server

# Code Quality
npm run lint              # Run ESLint
npm run format            # Format code with Prettier

# Database
npm run seed              # Run database seeders

# Testing
npm test                  # Run unit tests
npm run test:e2e          # Run E2E tests
npm run test:cov          # Generate coverage report
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod --version`
- Check connection string format
- Verify network access (if using MongoDB Atlas)

### Port Already in Use
- Change PORT in `.env` file
- Or kill the process using the port

### Module Not Found Errors
- Run `npm install` again
- Clear node_modules and reinstall

## 📞 Support

For issues or questions:
- Check the README.md
- Review Swagger documentation
- Check NestJS official docs

---

**Status**: ✅ Core infrastructure complete and ready for module development!

