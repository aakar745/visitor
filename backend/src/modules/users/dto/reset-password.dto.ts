import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ 
    example: 'newpassword123', 
    description: 'New password (minimum 6 characters)',
    minLength: 6
  })
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword: string;

  @ApiProperty({ 
    example: 'NewPassword@456', 
    description: 'Confirm new password (must match newPassword)' 
  })
  @IsString()
  confirmPassword: string;
}

