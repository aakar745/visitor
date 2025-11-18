import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from '../../database/schemas/role.schema';
import { CreateRoleDto, UpdateRoleDto, QueryRoleDto } from './dto';
import { sanitizeSearch } from '../../common/utils/sanitize.util';
import { sanitizePagination } from '../../common/constants/pagination.constants';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
  ) {}

  async getStats() {
    const total = await this.roleModel.countDocuments();
    const active = await this.roleModel.countDocuments({ isActive: true });
    const system = await this.roleModel.countDocuments({ isSystemRole: true });
    const custom = await this.roleModel.countDocuments({ isSystemRole: false });

    // Find most used role (placeholder - would need user join in real scenario)
    const mostUsedRole = await this.roleModel.findOne({ isActive: true }).sort({ userCount: -1 }).exec();
    
    // Count total unique permissions across all roles
    const roles = await this.roleModel.find({}, { permissions: 1 }).exec();
    const allPermissions = new Set();
    roles.forEach(role => {
      if (role.permissions && Array.isArray(role.permissions)) {
        role.permissions.forEach(perm => allPermissions.add(perm.id));
      }
    });

    return {
      totalRoles: total,
      activeRoles: active,
      inactiveRoles: total - active,
      systemRoles: system,
      customRoles: custom,
      totalPermissions: allPermissions.size,
      mostUsedRole: mostUsedRole || null,
    };
  }

  async getPermissionGroups() {
    // Return permission groups organized by category
    return [
      {
        category: 'User Management',
        permissions: [
          { id: 'users.view', name: 'View Users', description: 'View user list and details' },
          { id: 'users.create', name: 'Create Users', description: 'Create new users' },
          { id: 'users.update', name: 'Update Users', description: 'Edit user information' },
          { id: 'users.delete', name: 'Delete Users', description: 'Remove users from system' },
        ],
      },
      {
        category: 'Role Management',
        permissions: [
          { id: 'roles.view', name: 'View Roles', description: 'View roles and permissions' },
          { id: 'roles.create', name: 'Create Roles', description: 'Create new roles' },
          { id: 'roles.update', name: 'Update Roles', description: 'Edit role permissions' },
          { id: 'roles.delete', name: 'Delete Roles', description: 'Remove roles' },
        ],
      },
      {
        category: 'Exhibition Management',
        permissions: [
          { id: 'exhibitions.view', name: 'View Exhibitions', description: 'View exhibition list' },
          { id: 'exhibitions.create', name: 'Create Exhibitions', description: 'Create new exhibitions' },
          { id: 'exhibitions.update', name: 'Update Exhibitions', description: 'Edit exhibitions' },
          { id: 'exhibitions.delete', name: 'Delete Exhibitions', description: 'Remove exhibitions' },
        ],
      },
      {
        category: 'Visitor Management',
        permissions: [
          { id: 'visitors.view', name: 'View Visitors', description: 'View visitor list' },
          { id: 'visitors.create', name: 'Create Visitors', description: 'Register new visitors' },
          { id: 'visitors.update', name: 'Update Visitors', description: 'Edit visitor information' },
          { id: 'visitors.delete', name: 'Delete Visitors', description: 'Remove visitors' },
          { id: 'visitors.checkin', name: 'Check-in Visitors', description: 'Check-in visitors' },
          { id: 'visitors.checkout', name: 'Check-out Visitors', description: 'Check-out visitors' },
        ],
      },
      {
        category: 'System Settings',
        permissions: [
          { id: 'settings.view', name: 'View Settings', description: 'View system settings' },
          { id: 'settings.update', name: 'Update Settings', description: 'Modify system settings' },
        ],
      },
      {
        category: 'Analytics',
        permissions: [
          { id: 'analytics.view', name: 'View Analytics', description: 'View reports and analytics' },
        ],
      },
    ];
  }

  async getTemplates() {
    // Return predefined role templates
    return [
      {
        id: 'super_admin_template',
        name: 'Super Administrator',
        description: 'Full system access with all permissions',
        color: '#ef4444',
        icon: '👑',
        isRecommended: true,
        permissions: ['*'], // All permissions
      },
      {
        id: 'admin_template',
        name: 'Administrator',
        description: 'Administrative access to most features',
        color: '#3b82f6',
        icon: '🛡️',
        isRecommended: true,
        permissions: ['users.*', 'exhibitions.*', 'visitors.*', 'analytics.view'],
      },
      {
        id: 'manager_template',
        name: 'Manager',
        description: 'Manage exhibitions and visitors',
        color: '#8b5cf6',
        icon: '📊',
        isRecommended: true,
        permissions: ['exhibitions.view', 'exhibitions.create', 'exhibitions.update', 'visitors.*', 'analytics.view'],
      },
      {
        id: 'employee_template',
        name: 'Employee',
        description: 'Basic visitor management',
        color: '#10b981',
        icon: '👤',
        isRecommended: false,
        permissions: ['visitors.view', 'visitors.create', 'visitors.checkin', 'visitors.checkout'],
      },
      {
        id: 'viewer_template',
        name: 'Viewer',
        description: 'Read-only access',
        color: '#6b7280',
        icon: '👁️',
        isRecommended: false,
        permissions: ['visitors.view', 'exhibitions.view'],
      },
    ];
  }

  async findAll(query: QueryRoleDto) {
    // Sanitize and enforce pagination limits (defense in depth)
    const { page, limit } = sanitizePagination(query.page, query.limit);
    const { search = '', isActive, isSystemRole } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    
    // Sanitize search input to prevent regex injection
    if (search) {
      const sanitizedSearch = sanitizeSearch(search);
      filter.$or = [
        { name: { $regex: sanitizedSearch, $options: 'i' } },
        { description: { $regex: sanitizedSearch, $options: 'i' } },
      ];
    }
    
    if (isActive !== undefined) filter.isActive = isActive;
    if (isSystemRole !== undefined) filter.isSystemRole = isSystemRole;

    const [roles, total] = await Promise.all([
      this.roleModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.roleModel.countDocuments(filter),
    ]);

    return {
      roles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const role = await this.roleModel.findById(id).exec();
    
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    
    return role;
  }

  async create(createRoleDto: CreateRoleDto) {
    // Check if role with same name already exists
    const existingRole = await this.roleModel.findOne({ name: createRoleDto.name });
    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    const role = new this.roleModel(createRoleDto);
    return role.save();
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.roleModel.findById(id).exec();
    
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    
    // Prevent updating system roles
    if (role.isSystemRole) {
      throw new BadRequestException('System roles cannot be modified');
    }

    return this.roleModel.findByIdAndUpdate(id, updateRoleDto, { new: true }).exec();
  }

  async remove(id: string) {
    const role = await this.roleModel.findById(id).exec();
    
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    
    // Prevent deleting system roles
    if (role.isSystemRole) {
      throw new BadRequestException('System roles cannot be deleted');
    }
    
    // Check if role is assigned to users
    if (role.userCount > 0) {
      throw new BadRequestException('Cannot delete role that is assigned to users');
    }
    
    await this.roleModel.findByIdAndDelete(id).exec();
    return { message: 'Role deleted successfully', id };
  }
}

