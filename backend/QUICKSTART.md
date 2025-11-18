# 🚀 Quick Start Guide

## What's Been Created

Your **enterprise-grade NestJS backend** is ready! Here's what you have:

### ✅ Complete Infrastructure
- Latest NestJS 10.x with TypeScript 5.7
- MongoDB integration with Mongoose
- JWT authentication system
- 5 comprehensive database schemas
- Global error handling & logging
- Swagger API documentation
- Security (Helmet, CORS, Rate Limiting)
- 13 feature modules (structure ready)

---

## 🏃 Getting Started (5 Minutes)

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Environment
```bash
# Copy the example file
cp env.example.txt .env

# Open .env and update these CRITICAL settings:
# - MONGODB_URI=your_mongodb_connection_string
# - JWT_SECRET=your_secret_key_here
# - JWT_REFRESH_SECRET=your_refresh_secret_here
```

### Step 3: Start MongoDB
```bash
# If using local MongoDB, make sure it's running:
mongod

# OR use MongoDB Atlas (cloud) - just update MONGODB_URI in .env
```

### Step 4: Start the Server
```bash
npm run start:dev
```

You should see:
```
╔═══════════════════════════════════════════════════════════════╗
║   🚀 Visitor Management System API                           ║
║   Server:      http://0.0.0.0:3000                          ║
║   API Docs:    http://0.0.0.0:3000/api/docs                 ║
║   Health:      http://0.0.0.0:3000/health                   ║
╚═══════════════════════════════════════════════════════════════╝
```

### Step 5: Test the API
Open your browser and visit:
- **API Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/v1/health

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── common/                    # Shared utilities
│   │   ├── decorators/           # @Public(), @Roles(), @CurrentUser()
│   │   ├── filters/              # Global error handling
│   │   ├── guards/               # JWT & Roles guards
│   │   └── interceptors/         # Logging & transformation
│   │
│   ├── config/                   # Configuration files
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   └── jwt.config.ts
│   │
│   ├── database/
│   │   └── schemas/              # MongoDB schemas
│   │       ├── user.schema.ts
│   │       ├── role.schema.ts
│   │       ├── global-visitor.schema.ts
│   │       ├── exhibition.schema.ts
│   │       └── exhibition-registration.schema.ts
│   │
│   ├── modules/
│   │   ├── auth/                 # ✅ COMPLETE - Login & JWT
│   │   ├── health/               # ✅ COMPLETE - Health check
│   │   ├── users/                # 🔄 TODO - Implement controller/service
│   │   ├── roles/                # 🔄 TODO - Implement controller/service
│   │   ├── exhibitions/          # 🔄 TODO - Implement controller/service
│   │   ├── visitors/             # 🔄 TODO - Implement controller/service
│   │   ├── exhibitors/           # 🔄 TODO - Implement controller/service
│   │   ├── payments/             # 🔄 TODO - Implement controller/service
│   │   ├── badges/               # 🔄 TODO - Implement controller/service
│   │   ├── notifications/        # 🔄 TODO - Implement controller/service
│   │   ├── uploads/              # 🔄 TODO - Implement controller/service
│   │   ├── settings/             # 🔄 TODO - Implement controller/service
│   │   └── analytics/            # 🔄 TODO - Implement controller/service
│   │
│   ├── app.module.ts             # Root module
│   └── main.ts                   # Application entry point
│
├── test/                         # Test files
│   ├── app.e2e-spec.ts          # E2E tests
│   └── jest-e2e.json            # Jest configuration
│
├── .env.example.txt              # Environment variables template
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── nest-cli.json                 # NestJS CLI config
├── README.md                     # Documentation
├── SETUP.md                      # Detailed setup guide
├── PROJECT_STATUS.md             # Current status
└── QUICKSTART.md                 # This file!
```

---

## 🔧 What Works Right Now

### ✅ Working Endpoints:

1. **Health Check** (Public)
   ```
   GET http://localhost:3000/api/v1/health
   ```

2. **Login** (Public)
   ```
   POST http://localhost:3000/api/v1/auth/login
   Content-Type: application/json

   {
     "email": "admin@example.com",
     "password": "password123"
   }
   ```

3. **Refresh Token** (Public)
   ```
   POST http://localhost:3000/api/v1/auth/refresh
   Content-Type: application/json

   {
     "refreshToken": "your_refresh_token_here"
   }
   ```

### ✅ What's Configured:
- MongoDB connection
- JWT authentication
- Role-based access control (guards ready)
- Request validation
- Error handling
- Logging
- CORS
- Swagger documentation
- Rate limiting

---

## 📋 Next Steps - Implementation Priority

### Week 1: Core Modules
1. **Users Module**
   - Create `users.controller.ts`
   - Create `users.service.ts`
   - Add CRUD endpoints (GET, POST, PUT, DELETE)
   - Add DTOs for validation

2. **Roles Module**
   - Create `roles.controller.ts`
   - Create `roles.service.ts`
   - Implement permission management

### Week 2: Business Logic
3. **Exhibitions Module**
   - Full CRUD operations
   - Status management
   - Pricing tier handling
   - Custom fields management

4. **Visitors Module**
   - Global visitor management
   - Registration handling
   - Check-in/check-out functionality

### Week 3: Features
5. **Payments** - Razorpay integration
6. **Badges** - QR code generation
7. **Uploads** - File handling
8. **Notifications** - Email/SMS

### Week 4: Polish
9. **Analytics** - Statistics & reports
10. **Settings** - System configuration
11. **Testing** - Unit & E2E tests
12. **Documentation** - API guides

---

## 💡 Pro Tips

### Development
```bash
npm run start:dev      # Hot reload
npm run start:debug    # Debug mode
npm run lint           # Check code quality
npm run format         # Format code
```

### Testing
```bash
npm test               # Unit tests
npm run test:e2e       # E2E tests
npm run test:cov       # Coverage report
```

### Production
```bash
npm run build          # Build for production
npm run start:prod     # Run production build
```

---

## 🎯 Module Implementation Template

For each module, follow this pattern:

### 1. Create DTO (Data Transfer Object)
```typescript
// src/modules/users/dto/create-user.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

### 2. Create Service (Business Logic)
```typescript
// src/modules/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../database/schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findAll() {
    return this.userModel.find().populate('role').exec();
  }

  async findOne(id: string) {
    return this.userModel.findById(id).populate('role').exec();
  }

  async create(createUserDto: CreateUserDto) {
    const user = new this.userModel(createUserDto);
    return user.save();
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec();
  }

  async remove(id: string) {
    return this.userModel.findByIdAndDelete(id).exec();
  }
}
```

### 3. Create Controller (HTTP Endpoints)
```typescript
// src/modules/users/users.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
```

### 4. Update Module
```typescript
// src/modules/users/users.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../database/schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

---

## 🔒 Security Checklist

- ✅ JWT authentication configured
- ✅ Password hashing with bcrypt (in auth service)
- ✅ CORS enabled
- ✅ Helmet security headers
- ✅ Rate limiting
- ✅ Input validation
- ⚠️ Change default JWT secrets in .env
- ⚠️ Use strong passwords
- ⚠️ Enable MongoDB authentication in production

---

## 📚 Documentation

- **Swagger UI**: http://localhost:3000/api/docs
- **README.md**: General overview
- **SETUP.md**: Detailed setup instructions
- **PROJECT_STATUS.md**: Current implementation status
- **env.example.txt**: All environment variables explained

---

## 🆘 Troubleshooting

### Can't connect to MongoDB?
```bash
# Check if MongoDB is running
mongod --version

# Try connecting manually
mongo

# Update connection string in .env
MONGODB_URI=mongodb://localhost:27017/visitor_management
```

### Port 3000 already in use?
```bash
# Change port in .env
PORT=3001
```

### Module import errors?
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 🎉 Success Indicators

You'll know everything is working when:
1. ✅ Server starts without errors
2. ✅ Health check returns `{ "status": "ok" }`
3. ✅ Swagger docs load at `/api/docs`
4. ✅ MongoDB connection is established
5. ✅ You can see logs for incoming requests

---

## 📞 Need Help?

- Check **SETUP.md** for detailed instructions
- Review **PROJECT_STATUS.md** for implementation status
- Consult NestJS docs: https://docs.nestjs.com
- MongoDB docs: https://docs.mongodb.com

---

**Current Status**: 🟢 **READY TO DEVELOP!**

The foundation is rock-solid. Time to build the features! 🚀

