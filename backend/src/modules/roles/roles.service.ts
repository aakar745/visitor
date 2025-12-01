import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from '../../database/schemas/role.schema';
import { User, UserDocument } from '../../database/schemas/user.schema';
import { CreateRoleDto, UpdateRoleDto, QueryRoleDto } from './dto';
import { sanitizeSearch } from '../../common/utils/sanitize.util';
import { sanitizePagination, calculatePaginationMeta } from '../../common/constants/pagination.constants';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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
    // Return permission groups organized by actual pages and functionalities
    return [
      {
        category: 'Dashboard',
        permissions: [
          { id: 'dashboard.view', name: 'View Dashboard', description: 'Access main dashboard and overview statistics', action: 'view', resource: 'dashboard' },
        ],
      },
      {
        category: 'Exhibition Management',
        permissions: [
          { id: 'exhibitions.view', name: 'View Exhibitions', description: 'View exhibition list and details', action: 'view', resource: 'exhibitions' },
          { id: 'exhibitions.create', name: 'Create Exhibitions', description: 'Create new exhibitions', action: 'create', resource: 'exhibitions' },
          { id: 'exhibitions.update', name: 'Edit Exhibitions', description: 'Edit exhibition information', action: 'update', resource: 'exhibitions' },
          { id: 'exhibitions.delete', name: 'Delete Exhibitions', description: 'Remove exhibitions from system', action: 'delete', resource: 'exhibitions' },
          { id: 'exhibitions.duplicate', name: 'Duplicate Exhibitions', description: 'Duplicate existing exhibitions', action: 'duplicate', resource: 'exhibitions' },
          { id: 'exhibitions.publish', name: 'Publish/Unpublish', description: 'Change exhibition status (draft/active)', action: 'publish', resource: 'exhibitions' },
          { id: 'exhibitions.qrcode', name: 'Generate QR Codes', description: 'Generate and download QR codes', action: 'qrcode', resource: 'exhibitions' },
          { id: 'exhibitions.copylink', name: 'Copy Registration Links', description: 'Copy registration URLs', action: 'copylink', resource: 'exhibitions' },
          { id: 'exhibitions.export', name: 'Export Exhibitions', description: 'Export exhibition data', action: 'export', resource: 'exhibitions' },
        ],
      },
      {
        category: 'Exhibitor Management',
        permissions: [
          { id: 'exhibitors.view', name: 'View Exhibitors', description: 'View exhibitor links and details', action: 'view', resource: 'exhibitors' },
          { id: 'exhibitors.create', name: 'Create Exhibitors', description: 'Create new exhibitor links', action: 'create', resource: 'exhibitors' },
          { id: 'exhibitors.update', name: 'Edit Exhibitors', description: 'Edit exhibitor information', action: 'update', resource: 'exhibitors' },
          { id: 'exhibitors.delete', name: 'Delete Exhibitors', description: 'Remove exhibitor links', action: 'delete', resource: 'exhibitors' },
          { id: 'exhibitors.qrcode', name: 'Generate QR Codes', description: 'Generate exhibitor QR codes', action: 'qrcode', resource: 'exhibitors' },
          { id: 'exhibitors.toggle', name: 'Enable/Disable Links', description: 'Toggle exhibitor link status', action: 'toggle', resource: 'exhibitors' },
        ],
      },
      {
        category: 'Visitor Management',
        permissions: [
          { id: 'visitors.view', name: 'View Visitors', description: 'View visitor list and details', action: 'view', resource: 'visitors' },
          { id: 'visitors.delete', name: 'Delete Visitors', description: 'Remove visitor records', action: 'delete', resource: 'visitors' },
          { id: 'visitors.import', name: 'Import Visitors', description: 'Bulk import visitors from CSV/Excel', action: 'import', resource: 'visitors' },
          { id: 'visitors.export', name: 'Export Visitors', description: 'Export visitor data to CSV/Excel', action: 'export', resource: 'visitors' },
          { id: 'visitors.search', name: 'Advanced Search', description: 'Use advanced search and filters', action: 'search', resource: 'visitors' },
          { id: 'visitors.bulk', name: 'Bulk Operations', description: 'Perform bulk actions on visitors', action: 'bulk', resource: 'visitors' },
        ],
      },
      {
        category: 'Analytics',
        permissions: [
          { id: 'analytics.view', name: 'View Analytics Dashboard', description: 'Access analytics dashboard with charts and insights', action: 'view', resource: 'analytics' },
          { id: 'analytics.export', name: 'Export Analytics', description: 'Export analytics data', action: 'export', resource: 'analytics' },
        ],
      },
      {
        category: 'Exhibition Reports',
        permissions: [
          { id: 'reports.view', name: 'View Exhibition Reports', description: 'Access exhibition-specific registration reports', action: 'view', resource: 'reports' },
          { id: 'reports.filter', name: 'Filter Reports', description: 'Use advanced filters (type, timing, payment, dates)', action: 'filter', resource: 'reports' },
          { id: 'reports.search', name: 'Search Registrations', description: 'Search visitors in reports', action: 'search', resource: 'reports' },
          { id: 'reports.export', name: 'Export Reports', description: 'Export registration data (Excel/CSV)', action: 'export', resource: 'reports' },
          { id: 'reports.delete', name: 'Delete Registrations', description: 'Remove visitor registrations from exhibitions', action: 'delete', resource: 'reports' },
          { id: 'reports.details', name: 'View Registration Details', description: 'View detailed visitor information', action: 'details', resource: 'reports' },
        ],
      },
      {
        category: 'User Management',
        permissions: [
          { id: 'users.view', name: 'View Users', description: 'View system users and details', action: 'view', resource: 'users' },
          { id: 'users.create', name: 'Create Users', description: 'Add new system users', action: 'create', resource: 'users' },
          { id: 'users.update', name: 'Edit Users', description: 'Edit user information and roles', action: 'update', resource: 'users' },
          { id: 'users.reset_password', name: 'Reset User Password', description: 'Reset password for any user (Super Admin only)', action: 'reset_password', resource: 'users' },
          { id: 'users.delete', name: 'Delete Users', description: 'Remove users from system', action: 'delete', resource: 'users' },
          { id: 'users.export', name: 'Export Users', description: 'Export user data', action: 'export', resource: 'users' },
        ],
      },
      {
        category: 'Role Management',
        permissions: [
          { id: 'roles.view', name: 'View Roles', description: 'View roles and permissions', action: 'view', resource: 'roles' },
          { id: 'roles.create', name: 'Create Roles', description: 'Create custom roles', action: 'create', resource: 'roles' },
          { id: 'roles.update', name: 'Edit Roles', description: 'Edit role permissions', action: 'update', resource: 'roles' },
          { id: 'roles.delete', name: 'Delete Roles', description: 'Remove custom roles', action: 'delete', resource: 'roles' },
          { id: 'roles.duplicate', name: 'Duplicate Roles', description: 'Duplicate existing roles', action: 'duplicate', resource: 'roles' },
          { id: 'roles.export', name: 'Export Roles', description: 'Export role configurations', action: 'export', resource: 'roles' },
        ],
      },
      {
        category: 'Location Management',
        permissions: [
          { id: 'locations.view', name: 'View Locations', description: 'View countries, states, cities, pincodes', action: 'view', resource: 'locations' },
          { id: 'locations.create', name: 'Create Locations', description: 'Add new location data', action: 'create', resource: 'locations' },
          { id: 'locations.update', name: 'Edit Locations', description: 'Edit location information', action: 'update', resource: 'locations' },
          { id: 'locations.delete', name: 'Delete Locations', description: 'Remove location data', action: 'delete', resource: 'locations' },
          { id: 'locations.import', name: 'Import Locations', description: 'Bulk import location data', action: 'import', resource: 'locations' },
          { id: 'locations.export', name: 'Export Locations', description: 'Export location data', action: 'export', resource: 'locations' },
          { id: 'locations.toggle', name: 'Enable/Disable', description: 'Toggle location status', action: 'toggle', resource: 'locations' },
        ],
      },
      {
        category: 'System Settings',
        permissions: [
          { id: 'settings.view', name: 'View Settings', description: 'View system configuration', action: 'view', resource: 'settings' },
          { id: 'settings.update', name: 'Update Settings', description: 'Modify system settings', action: 'update', resource: 'settings' },
          { id: 'settings.kiosk', name: 'Kiosk Settings', description: 'Manage kiosk mode settings', action: 'kiosk', resource: 'settings' },
        ],
      },
      {
        category: 'System Monitoring',
        permissions: [
          { id: 'system.monitor', name: 'Queue Monitor', description: 'Monitor system queues and jobs', action: 'monitor', resource: 'system' },
          { id: 'system.logs', name: 'View Logs', description: 'Access system logs', action: 'logs', resource: 'system' },
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
    const { page, limit, skip } = sanitizePagination(query.page, query.limit);
    const { search = '', isActive, isSystemRole } = query;

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
      ...calculatePaginationMeta(page, limit, total),
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
    
    // 🔒 SUPER ADMIN PROTECTION: Prevent updating Super Admin role
    if (role.name === 'super_admin' && role.isSystemRole) {
      throw new BadRequestException(
        'Super Admin role cannot be modified. This role is protected and maintains full system access.'
      );
    }
    
    // Prevent updating other system roles
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
    
    // 🔒 SUPER ADMIN PROTECTION: Prevent deleting Super Admin role
    if (role.name === 'super_admin' && role.isSystemRole) {
      throw new BadRequestException(
        'Super Admin role cannot be deleted. This role is protected and required for system administration.'
      );
    }
    
    // Prevent deleting other system roles
    if (role.isSystemRole) {
      throw new BadRequestException('System roles cannot be deleted');
    }
    
    // 🔒 ROLE LOCK: Check if role is assigned to any users
    // Query the User collection directly for accurate count
    const usersWithRole = await this.userModel.countDocuments({ role: role._id }).exec();
    
    if (usersWithRole > 0) {
      this.logger.warn(`Attempted to delete role "${role.name}" which is assigned to ${usersWithRole} user(s)`);
      throw new BadRequestException(
        `Cannot delete role "${role.name}". This role is currently assigned to ${usersWithRole} user(s). ` +
        `Please reassign these users to a different role before deleting.`
      );
    }
    
    this.logger.log(`Deleting role "${role.name}" (ID: ${id})`);
    await this.roleModel.findByIdAndDelete(id).exec();
    
    return { 
      message: 'Role deleted successfully', 
      id,
      name: role.name 
    };
  }
}

