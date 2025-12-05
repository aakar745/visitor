import { Injectable, NotFoundException, ConflictException, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../database/schemas/user.schema';
import { Role, RoleDocument } from '../../database/schemas/role.schema';
import { CreateUserDto, UpdateUserDto, QueryUserDto, ChangePasswordDto } from './dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { sanitizeSearch } from '../../common/utils/sanitize.util';
import { sanitizePagination, calculatePaginationMeta } from '../../common/constants/pagination.constants';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    private readonly configService: ConfigService,
  ) {}

  async getStats() {
    const total = await this.userModel.countDocuments();
    const active = await this.userModel.countDocuments({ status: 'active' });
    const inactive = await this.userModel.countDocuments({ status: 'inactive' });
    const suspended = await this.userModel.countDocuments({ status: 'suspended' });
    
    // Get recent logins (users who logged in within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentLogins = await this.userModel.countDocuments({
      lastLoginAt: { $gte: sevenDaysAgo },
    });
    
    // Pending users (users without lastLoginAt)
    const pendingUsers = await this.userModel.countDocuments({
      lastLoginAt: { $exists: false },
    });

    return {
      totalUsers: total,
      activeUsers: active,
      inactiveUsers: inactive,
      suspendedUsers: suspended,
      recentLogins,
      pendingUsers,
      growth: 0, // TODO: Calculate actual growth
    };
  }

  async findAll(query: QueryUserDto) {
    // Sanitize and enforce pagination limits (defense in depth)
    const { page, limit, skip } = sanitizePagination(query.page, query.limit);
    const { search = '', role, status } = query;

    const filter: any = {};
    
    // Sanitize search input to prevent regex injection
    if (search) {
      const sanitizedSearch = sanitizeSearch(search);
      filter.$or = [
        { name: { $regex: sanitizedSearch, $options: 'i' } },
        { email: { $regex: sanitizedSearch, $options: 'i' } },
      ];
    }
    
    if (role) filter.role = role;
    if (status) filter.status = status;

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .populate('role')
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      users,
      ...calculatePaginationMeta(page, limit, total),
    };
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).populate('role').select('-password').exec();
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user;
  }

  async create(createUserDto: CreateUserDto) {
    // Check if user with email already exists (case-insensitive)
    await this.checkEmailUniqueness(createUserDto.email);

    // Hash password before saving
    const bcryptRounds = parseInt(this.configService.get<string>('BCRYPT_ROUNDS', '10'), 10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, bcryptRounds);
    
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    
    const savedUser = await user.save();
    
    // 🔒 ROLE LOCK: Increment userCount for the assigned role
    await this.roleModel.findByIdAndUpdate(
      createUserDto.role,
      { $inc: { userCount: 1 } }
    ).exec();
    
    return this.userModel.findById(savedUser._id).populate('role').select('-password').exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Check if user exists first
    const existingUser = await this.userModel.findById(id).exec();
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // 🔒 SUPER ADMIN PROTECTION: Prevent editing Super Admin user details
    if (existingUser.email === 'admin@visitor-system.com') {
      throw new BadRequestException(
        'Super Admin user cannot be edited. Only password can be changed via the Change Password feature.'
      );
    }

    // Validate update data
    const sanitizedUpdate = await this.validateAndSanitizeUpdate(id, updateUserDto);
    
    // 🔒 ROLE LOCK: If role is being changed, update userCount for both old and new roles
    if (updateUserDto.role && updateUserDto.role.toString() !== existingUser.role.toString()) {
      // Decrement old role's userCount
      await this.roleModel.findByIdAndUpdate(
        existingUser.role,
        { $inc: { userCount: -1 } }
      ).exec();
      
      // Increment new role's userCount
      await this.roleModel.findByIdAndUpdate(
        updateUserDto.role,
        { $inc: { userCount: 1 } }
      ).exec();
      
      this.logger.log(`User ${id} role changed from ${existingUser.role} to ${updateUserDto.role}`);
    }
    
    // Perform update
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, sanitizedUpdate, { new: true })
      .populate('role')
      .select('-password')
      .exec();
    
    this.logger.log(`User ${id} updated successfully`);
    return updatedUser;
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    // Validate passwords match
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    // Find user with password field
    const user = await this.userModel.findById(id).select('+password').exec();
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Verify current password FIRST (authentication before validation)
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      this.logger.warn(`Failed password change attempt for user ${id}`);
      throw new UnauthorizedException('Current password is incorrect');
    }

    // SECURITY FIX (BUG-012): Check if new password matches current password
    // This check must happen AFTER verifying current password
    // Compare new password against the HASHED current password (not plain text)
    const isNewPasswordSameAsCurrent = await bcrypt.compare(
      changePasswordDto.newPassword,
      user.password,
    );

    if (isNewPasswordSameAsCurrent) {
      this.logger.warn(`User ${id} attempted to reuse current password`);
      throw new BadRequestException('New password must be different from your current password');
    }

    // Hash new password
    const bcryptRounds = parseInt(this.configService.get<string>('BCRYPT_ROUNDS', '10'), 10);
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, bcryptRounds);

    // SECURITY FIX (BUG-015): Reset login attempts and unlock account on password change
    // Update password and related security fields
    await this.userModel.findByIdAndUpdate(id, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
      refreshTokens: [], // Revoke all refresh tokens for security
      loginAttempts: 0, // Reset failed login attempts counter
      lockedUntil: null, // Unlock account if it was locked
    }).exec();

    this.logger.log(
      `Password changed successfully for user ${id}. ` +
      `Login attempts reset and account unlocked (if locked).`
    );
    
    return { message: 'Password changed successfully. Please login again with your new password.' };
  }

  /**
   * Reset user password by admin (no current password required)
   * This should only be accessible to Super Admin
   */
  async resetPassword(id: string, resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    // Validate passwords match
    if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    // Find user
    const user = await this.userModel.findById(id).select('+password').exec();
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if trying to reset Super Admin password
    if (user.email === 'admin@visitor-system.com') {
      throw new BadRequestException(
        'Cannot reset Super Admin password via this method. Super Admin must change their own password.'
      );
    }

    // Hash new password
    const bcryptRounds = parseInt(this.configService.get<string>('BCRYPT_ROUNDS', '10'), 10);
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, bcryptRounds);

    // Update password and related security fields
    await this.userModel.findByIdAndUpdate(id, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
      refreshTokens: [], // Revoke all refresh tokens for security
      loginAttempts: 0, // Reset failed login attempts counter
      lockedUntil: null, // Unlock account if it was locked
    }).exec();

    this.logger.log(
      `Password reset by admin for user ${id} (${user.email}). ` +
      `Login attempts reset and account unlocked (if locked).`
    );
    
    return { message: 'Password reset successfully. User can now login with the new password.' };
  }

  /**
   * Toggle user status (active/inactive)
   */
  async toggleStatus(id: string, status: 'active' | 'inactive') {
    this.logger.log(`Toggling status for user: ${id} to ${status}`);
    
    // Check if user exists
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    // 🔒 SUPER ADMIN PROTECTION: Prevent deactivating Super Admin user
    if (user.email === 'admin@visitor-system.com' && status === 'inactive') {
      throw new BadRequestException(
        'Super Admin user cannot be deactivated. This user is protected and required for system administration.'
      );
    }
    
    // Update status
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        id,
        { status, isActive: status === 'active' },
        { new: true }
      )
      .populate('role')
      .exec();
    
    this.logger.log(`User ${id} status updated to ${status}`);
    return updatedUser;
  }

  async remove(id: string) {
    // Check if user exists first
    const user = await this.userModel.findById(id).exec();
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // 🔒 SUPER ADMIN PROTECTION: Prevent deleting Super Admin user
    if (user.email === 'admin@visitor-system.com') {
      throw new BadRequestException(
        'Super Admin user cannot be deleted. This user is protected and required for system administration.'
      );
    }
    
    // Store role ID before deletion
    const roleId = user.role;
    
    // Proceed with deletion
    await this.userModel.findByIdAndDelete(id).exec();
    
    // 🔒 ROLE LOCK: Decrement userCount for the role
    await this.roleModel.findByIdAndUpdate(
      roleId,
      { $inc: { userCount: -1 } }
    ).exec();
    
    this.logger.log(`User ${id} deleted successfully`);
    return { message: 'User deleted successfully', id };
  }

  /**
   * Check if email is unique (case-insensitive)
   * @param email - Email to check
   * @param excludeUserId - Optional user ID to exclude from check (for updates)
   */
  private async checkEmailUniqueness(email: string, excludeUserId?: string): Promise<void> {
    const query: any = { 
      email: { $regex: new RegExp(`^${email}$`, 'i') } // Case-insensitive check
    };
    
    // Exclude current user when updating
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }

    const existingUser = await this.userModel.findOne(query).exec();
    
    if (existingUser) {
      this.logger.warn(`Duplicate email attempt: ${email}`);
      throw new ConflictException('User with this email already exists');
    }
  }

  /**
   * Validate and sanitize update data
   * Ensures no unauthorized fields are updated and validates business rules
   */
  private async validateAndSanitizeUpdate(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UpdateUserDto> {
    const sanitized = { ...updateUserDto };

    // Security: Explicitly block sensitive fields that should never be updated via this method
    const blockedFields = ['password', 'email', 'refreshTokens', 'passwordResetToken'];
    blockedFields.forEach(field => {
      if ((sanitized as any)[field] !== undefined) {
        this.logger.warn(`Attempt to update blocked field "${field}" for user ${userId}`);
        delete (sanitized as any)[field];
      }
    });

    // If email is somehow in the DTO (shouldn't happen due to DTO definition, but defense in depth)
    if ((updateUserDto as any).email) {
      throw new BadRequestException('Email cannot be updated. Please contact administrator.');
    }

    // If password is somehow in the DTO (shouldn't happen, but defense in depth)
    if ((updateUserDto as any).password) {
      throw new BadRequestException('Password cannot be updated via this endpoint. Use change password endpoint.');
    }

    return sanitized;
  }
}

