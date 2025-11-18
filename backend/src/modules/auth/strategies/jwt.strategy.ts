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
          return request?.cookies?.accessToken || null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(), // Fallback to Authorization header
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
      passReqToCallback: false,
    });
  }

  async validate(payload: any) {
    const user = await this.userModel.findById(payload.sub).populate('role');
    
    if (!user) {
      throw new UnauthorizedException();
    }
    
    return user;
  }
}

