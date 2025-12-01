import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '../../../database/schemas/user.schema';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password@123', description: 'User password', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Role ID' })
  @IsMongoId({ message: 'Role must be a valid MongoDB ObjectId' })
  role: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'Avatar URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ 
    example: 'active', 
    enum: UserStatus, 
    description: 'User status' 
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

