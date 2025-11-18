import { IsString, IsArray, IsOptional, IsBoolean, ValidateNested, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PermissionDto {
  @ApiProperty({ example: 'users.view', description: 'Unique permission ID' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'View Users', description: 'Permission name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'View user list and details', description: 'Permission description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'view', description: 'Action type' })
  @IsString()
  action: string;

  @ApiProperty({ example: 'users', description: 'Resource type' })
  @IsString()
  resource: string;

  @ApiProperty({ example: 'User Management', description: 'Permission category' })
  @IsString()
  category: string;
}

export class CreateRoleDto {
  @ApiProperty({ example: 'Manager', description: 'Role name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Manage exhibitions and visitors', description: 'Role description' })
  @IsString()
  description: string;

  @ApiProperty({ 
    type: [PermissionDto], 
    description: 'Array of permissions',
    example: [{ id: 'users.view', name: 'View Users', action: 'view', resource: 'users', category: 'User Management' }]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  @ArrayMinSize(0)
  permissions: PermissionDto[];

  @ApiPropertyOptional({ example: '#1890ff', description: 'Role color code' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: '🛡️', description: 'Role icon emoji' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: false, description: 'Is this a system role?' })
  @IsOptional()
  @IsBoolean()
  isSystemRole?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Is this role active?' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

