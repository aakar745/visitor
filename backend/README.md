# Visitor Management System - Backend API

Enterprise-grade NestJS backend with MongoDB for comprehensive visitor and exhibition management.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens
- **Role-Based Access Control**: Granular permissions system
- **Exhibition Management**: Complete CRUD with custom fields and pricing tiers
- **Visitor Management**: Global profiles with exhibition-specific registrations
- **Payment Integration**: Support for Razorpay, Stripe, and PayPal
- **File Uploads**: Local storage with S3/Azure support
- **Badge Generation**: Dynamic QR codes and custom badge templates
- **Email & SMS**: Multi-provider notification system
- **Real-time Updates**: WebSocket support (optional)
- **API Documentation**: Auto-generated Swagger docs
- **Caching**: Redis support for performance
- **Rate Limiting**: Protection against abuse
- **Logging**: Structured logging with multiple transports
- **Validation**: Class-validator with DTO validation
- **Testing**: Jest unit and E2E tests

## 📋 Prerequisites

- Node.js >= 20.x
- MongoDB >= 7.x
- npm or yarn
- Redis (optional, for caching)

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp env.example.txt .env

# Update .env with your configuration
```

## 🔧 Configuration

Update the `.env` file with your specific configuration:

- **Database**: MongoDB connection string
- **JWT Secrets**: Change default secrets
- **Email/SMS**: Configure your preferred providers
- **Payment**: Add your payment gateway credentials
- **Storage**: Configure file storage (local/S3/Azure)

## 🚦 Running the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

## 📚 API Documentation

Once the server is running, access the Swagger documentation at:

```
http://localhost:3000/api/docs
```

## 🗄️ Database

### MongoDB Collections

- `users` - System users and authentication
- `roles` - Roles and permissions
- `global_visitors` - Visitor profiles (deduplicated)
- `exhibitions` - Exhibition master data
- `exhibition_registrations` - Exhibition-specific visitor registrations
- `exhibitors` - Exhibitor information and links
- `payments` - Payment transaction records
- `badges` - Generated badge records
- `settings` - System configuration
- `audit_logs` - Activity audit trail

### Seed Data

```bash
# Run database seeds
npm run seed
```

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🏗️ Project Structure

```
src/
├── common/              # Shared utilities, guards, decorators
│   ├── decorators/      # Custom decorators
│   ├── filters/         # Exception filters
│   ├── guards/          # Auth guards
│   ├── interceptors/    # Request/Response interceptors
│   ├── middleware/      # Custom middleware
│   └── validators/      # Custom validators
├── config/              # Configuration modules
│   ├── app.config.ts
│   ├── database.config.ts
│   └── jwt.config.ts
├── database/            # Database configuration
│   ├── schemas/         # Mongoose schemas
│   └── seeds/           # Database seeders
├── modules/             # Feature modules
│   ├── auth/            # Authentication module
│   ├── users/           # User management
│   ├── roles/           # Roles & permissions
│   ├── exhibitions/     # Exhibition management
│   ├── visitors/        # Visitor management
│   ├── exhibitors/      # Exhibitor management
│   ├── payments/        # Payment processing
│   ├── badges/          # Badge generation
│   ├── notifications/   # Email/SMS notifications
│   ├── uploads/         # File upload management
│   ├── settings/        # System settings
│   └── analytics/       # Analytics & reporting
├── app.module.ts        # Root module
└── main.ts              # Application entry point
```

## 🔐 Security

- **Helmet**: Security headers
- **CORS**: Configurable cross-origin requests
- **Rate Limiting**: Throttling to prevent abuse
- **JWT**: Secure token-based authentication
- **Bcrypt**: Password hashing
- **Validation**: Input validation on all endpoints

## 📦 Deployment

### Docker

```bash
# Build image
docker build -t visitor-backend .

# Run container
docker run -p 3000:3000 visitor-backend
```

### PM2

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/main.js --name visitor-api

# Monitor
pm2 monit
```

## 📝 Environment Variables

See `env.example.txt` for all available configuration options.

## 🤝 Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## 📄 License

MIT

## 👥 Support

For support, email support@visitor-system.com or open an issue.

## 🔄 API Versioning

All APIs are versioned with the prefix `/api/v1`. Future versions will use `/api/v2`, etc.

## 📊 Monitoring

- Health check: `GET /health`
- Metrics: `GET /metrics` (if enabled)

## 🔄 Updates

Stay updated with the latest changes in the CHANGELOG.md file.

