import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Exhibition, ExhibitionSchema } from '../../database/schemas/exhibition.schema';
import { ExhibitionRegistration, ExhibitionRegistrationSchema } from '../../database/schemas/exhibition-registration.schema';
import { ExhibitionsController } from './exhibitions.controller';
import { ExhibitionsService } from './exhibitions.service';
import { UploadsModule } from '../uploads/uploads.module';
import { ExhibitorsModule } from '../exhibitors/exhibitors.module';
import { RegistrationsModule } from '../registrations/registrations.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Exhibition.name, schema: ExhibitionSchema },
      { name: ExhibitionRegistration.name, schema: ExhibitionRegistrationSchema },
    ]),
    UploadsModule,
    ExhibitorsModule,
    forwardRef(() => RegistrationsModule), // Import for automatic badge regeneration
  ],
  controllers: [ExhibitionsController],
  providers: [ExhibitionsService],
  exports: [ExhibitionsService],
})
export class ExhibitionsModule {}

