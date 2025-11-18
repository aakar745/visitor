import { Module } from '@nestjs/common';
import { BadgesService } from './badges.service';
// import { BadgesController } from './badges.controller';

@Module({
  // controllers: [BadgesController], // Will be enabled when admin endpoints are needed
  providers: [BadgesService],
  exports: [BadgesService], // Export for use in RegistrationsModule
})
export class BadgesModule {}

