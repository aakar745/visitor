import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Role } from '../schemas/role.schema';
import { User } from '../schemas/user.schema';
import { Country } from '../schemas/country.schema';
import { defaultRoles } from './roles.seed';
import { LocationsSeedService } from './locations.seed';

async function bootstrap() {
  console.log('🌱 Starting database seeding...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const roleModel = app.get<Model<Role>>(getModelToken(Role.name));
    const userModel = app.get<Model<User>>(getModelToken(User.name));
    const countryModel = app.get<Model<Country>>(getModelToken(Country.name));

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('📝 Checking existing data...');
    const existingRolesCount = await roleModel.countDocuments();
    const existingUsersCount = await userModel.countDocuments();
    const existingCountriesCount = await countryModel.countDocuments();

    if (existingRolesCount > 0 || existingUsersCount > 0) {
      console.log(`⚠️  Found ${existingRolesCount} roles and ${existingUsersCount} users`);
      console.log('⚠️  Skipping user/role seed to preserve existing data');
      console.log('⚠️  To force reseed, manually delete collections and run again\n');
    }

    // Seed Roles (if not exists)
    let createdRoles: any[] = [];
    if (existingRolesCount === 0) {
      console.log('🎭 Seeding roles...');
      createdRoles = await roleModel.insertMany(defaultRoles);
      console.log(`✅ Created ${createdRoles.length} roles`);
    } else {
      // Fetch existing roles
      createdRoles = await roleModel.find().lean();
    }

    // Find admin role
    const adminRole = createdRoles.find((r) => r.name === 'super_admin');
    const regularAdminRole = createdRoles.find((r) => r.name === 'admin');

    if (!adminRole) {
      throw new Error('Admin role not found!');
    }

    // Seed Default Users (if not exists)
    if (existingUsersCount === 0) {
      console.log('\n👥 Seeding users...');

      const hashedPassword = await bcrypt.hash('Admin@123', 10);

      const defaultUsers = [
        {
          name: 'Super Admin',
          email: 'admin@visitor-system.com',
          password: hashedPassword,
          role: adminRole._id,
          status: 'active',
          isActive: true,
          department: 'IT',
          position: 'System Administrator',
        },
        {
          name: 'Admin User',
          email: 'admin@example.com',
          password: await bcrypt.hash('admin123', 10),
          role: regularAdminRole?._id || adminRole._id,
          status: 'active',
          isActive: true,
          department: 'Management',
          position: 'Administrator',
        },
      ];

      const createdUsers = await userModel.insertMany(defaultUsers);
      console.log(`✅ Created ${createdUsers.length} users\n`);
    }

    // Seed Locations (India data) - Always check and seed if not present
    console.log('');
    if (existingCountriesCount === 0) {
      const locationsSeedService = app.get(LocationsSeedService);
      await locationsSeedService.seed();
    } else {
      console.log('⚠️  Location data already exists. Skipping location seed.\n');
    }

    // Display credentials
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Database seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (existingUsersCount === 0) {
      console.log('📋 Default Login Credentials:\n');
      console.log('┌─────────────────────────────────────────┐');
      console.log('│  Super Admin Account                    │');
      console.log('├─────────────────────────────────────────┤');
      console.log('│  Email:    admin@visitor-system.com     │');
      console.log('│  Password: Admin@123                    │');
      console.log('└─────────────────────────────────────────┘\n');
      console.log('┌─────────────────────────────────────────┐');
      console.log('│  Admin Account                          │');
      console.log('├─────────────────────────────────────────┤');
      console.log('│  Email:    admin@example.com            │');
      console.log('│  Password: admin123                     │');
      console.log('└─────────────────────────────────────────┘\n');
      console.log('⚠️  Please change these passwords after first login!\n');
    }

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap()
  .then(() => {
    console.log('✨ Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });

