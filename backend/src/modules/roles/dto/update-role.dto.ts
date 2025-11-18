import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateRoleDto } from './create-role.dto';

// Prevent updating isSystemRole to protect system roles
export class UpdateRoleDto extends PartialType(
  OmitType(CreateRoleDto, ['isSystemRole'] as const)
) {}

