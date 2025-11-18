import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, QueryUserDto, ChangePasswordDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserThrottlerGuard } from '../../common/guards/user-throttle.guard';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  async getStats() {
    return this.usersService.getStats();
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated user list' })
  async findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid input or email already exists' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/change-password')
  @UseGuards(UserThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 2 } }) // 2 attempts per minute per IP
  @ApiOperation({ summary: 'Change user password (Admin)' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid password or passwords do not match' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 429, description: 'Too many password change attempts' })
  async changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(id, changePasswordDto);
  }

  @Patch('me/change-password')
  @UseGuards(UserThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 2 } }) // 2 attempts per minute per IP
  @ApiOperation({ summary: 'Change own password (authenticated user)' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid password or passwords do not match' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  @ApiResponse({ status: 429, description: 'Too many password change attempts. Per-user limit: 5/hour, Per-IP limit: 2/minute' })
  async changeOwnPassword(
    @CurrentUser('_id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, changePasswordDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}

