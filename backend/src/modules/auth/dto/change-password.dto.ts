import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'OldPass123!',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  currentPassword: string;

  @ApiProperty({
    description: 'New password (must meet complexity requirements)',
    example: 'NewPass123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
    {
      message: 'New password must contain uppercase, lowercase, number, and special character',
    },
  )
  newPassword: string;

  @ApiProperty({
    description: 'Confirm new password (must match newPassword)',
    example: 'NewPass123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Please confirm your new password' })
  confirmPassword: string;
}

