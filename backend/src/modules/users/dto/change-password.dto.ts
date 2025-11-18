import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ 
    example: 'OldPassword@123', 
    description: 'Current password for verification' 
  })
  @IsString()
  @MinLength(6, { message: 'Current password must be at least 6 characters long' })
  currentPassword: string;

  @ApiProperty({ 
    example: 'NewPassword@456', 
    description: 'New password (min 6 chars, must contain uppercase, lowercase, number, special char)',
    minLength: 8
  })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
    {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  newPassword: string;

  @ApiProperty({ 
    example: 'NewPassword@456', 
    description: 'Confirm new password (must match newPassword)' 
  })
  @IsString()
  confirmPassword: string;
}

