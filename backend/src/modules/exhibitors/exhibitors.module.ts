import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExhibitorsController } from './exhibitors.controller';
import { ExhibitorsService } from './exhibitors.service';
import { Exhibitor, ExhibitorSchema } from '../../database/schemas/exhibitor.schema';
import { Exhibition, ExhibitionSchema } from '../../database/schemas/exhibition.schema';
import { ExhibitionRegistration, ExhibitionRegistrationSchema } from '../../database/schemas/exhibition-registration.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Exhibitor.name, schema: ExhibitorSchema },
      { name: Exhibition.name, schema: ExhibitionSchema },
      { name: ExhibitionRegistration.name, schema: ExhibitionRegistrationSchema },
    ]),
  ],
  controllers: [ExhibitorsController],
  providers: [ExhibitorsService],
  exports: [ExhibitorsService],
})
export class ExhibitorsModule {}

