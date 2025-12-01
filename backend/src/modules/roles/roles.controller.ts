import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, QueryRoleDto } from './dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('Roles')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('stats')
  @RequirePermissions('roles.view')
  @ApiOperation({ summary: 'Get role statistics' })
  async getStats() {
    return this.rolesService.getStats();
  }

  @Get('templates')
  @RequirePermissions('roles.view')
  @ApiOperation({ summary: 'Get role templates' })
  async getTemplates() {
    return this.rolesService.getTemplates();
  }

  @Get('permissions/groups')
  @RequirePermissions('roles.view', 'roles.create', 'roles.update')
  @ApiOperation({ summary: 'Get permission groups' })
  async getPermissionGroups() {
    return this.rolesService.getPermissionGroups();
  }

  @Get()
  @RequirePermissions('roles.view')
  @ApiOperation({ summary: 'Get all roles with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated role list' })
  async findAll(@Query() query: QueryRoleDto) {
    return this.rolesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('roles.view')
  @ApiOperation({ summary: 'Get role by ID' })
  async findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @RequirePermissions('roles.create')
  @ApiOperation({ summary: 'Create new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Put(':id')
  @RequirePermissions('roles.update')
  @ApiOperation({ summary: 'Update role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @RequirePermissions('roles.delete')
  @ApiOperation({ summary: 'Delete role' })
  async remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}

