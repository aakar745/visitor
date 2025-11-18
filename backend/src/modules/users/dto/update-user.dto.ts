import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// Update DTO excludes password for security - use separate change password endpoint
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password', 'email'] as const)
) {}

