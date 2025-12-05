import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request } from 'express';
import { User, UserDocument } from '../../../database/schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    super({
      // Extract JWT from cookie first, then fall back to Authorization header
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Try to get token from httpOnly cookie first (more secure)
          const token = request?.cookies?.accessToken || null;
          // Note: Debug logging removed for production - use debug level if needed
          return token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(), // Fallback to Authorization header
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
      passReqToCallback: false,
    });
  }

  async validate(payload: any) {
    this.logger.debug(`Validating JWT for user ID: ${payload.sub}`);
    
    const user = await this.userModel.findById(payload.sub).populate('role');
    
    if (!user) {
      this.logger.warn(`User not found for ID: ${payload.sub}`);
      throw new UnauthorizedException('User not found');
    }

    this.logger.debug(`User found: ${user.email}, IsActive: ${user.isActive}, Status: ${user.status}`);

    // Check if user account is active
    if (!user.isActive || user.status === 'inactive') {
      this.logger.warn(`Account deactivated: ${user.email}`);
      throw new UnauthorizedException('Your account has been deactivated. Please contact the administrator for assistance.');
    }

    const validatedUser = {
      _id: user._id,
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };
    
    this.logger.debug(`User validated: ${user.email}`);
    return validatedUser;
  }
}

