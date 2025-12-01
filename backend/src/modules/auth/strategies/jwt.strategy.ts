import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request } from 'express';
import { User, UserDocument } from '../../../database/schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
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
          if (token) {
            console.log(`[JWT EXTRACT] Token found in cookie, length: ${token.length}`);
          } else {
            console.log(`[JWT EXTRACT] No token in cookie, checking Authorization header`);
          }
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
    console.log(`[JWT VALIDATE] Payload received:`, JSON.stringify(payload));
    console.log(`[JWT VALIDATE] Looking up user ID: ${payload.sub}`);
    
    const user = await this.userModel.findById(payload.sub).populate('role');
    
    if (!user) {
      console.error(`[JWT VALIDATE FAILED] User not found for ID: ${payload.sub}`);
      throw new UnauthorizedException('User not found');
    }

    console.log(`[JWT VALIDATE] User found: ${user.email}, IsActive: ${user.isActive}, Status: ${user.status}`);
    console.log(`[JWT VALIDATE] Role data:`, JSON.stringify(user.role));

    // Check if user account is active
    if (!user.isActive || user.status === 'inactive') {
      console.warn(`[JWT VALIDATE FAILED] Account deactivated: ${user.email}, IsActive: ${user.isActive}, Status: ${user.status}`);
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
    
    console.log(`[JWT VALIDATE SUCCESS] Returning user:`, JSON.stringify(validatedUser));
    return validatedUser;
  }
}

