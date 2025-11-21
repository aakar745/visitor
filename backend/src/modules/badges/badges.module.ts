import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BadgesService } from './badges.service';
import { BadgesController } from './badges.controller';
import {
  ExhibitionRegistration,
  ExhibitionRegistrationSchema,
} from '../../database/schemas/exhibition-registration.schema';
import {
  Exhibition,
  ExhibitionSchema,
} from '../../database/schemas/exhibition.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExhibitionRegistration.name, schema: ExhibitionRegistrationSchema },
      { name: Exhibition.name, schema: ExhibitionSchema }, // For smart badge cleanup
    ]),
  ],
  controllers: [BadgesController], // ✅ Enabled for on-demand badge generation
  providers: [BadgesService],
  exports: [BadgesService], // Export for use in RegistrationsModule
})
export class BadgesModule {}

