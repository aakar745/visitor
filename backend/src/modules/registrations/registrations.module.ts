import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import { ExhibitionRegistration, ExhibitionRegistrationSchema } from '../../database/schemas/exhibition-registration.schema';
import { GlobalVisitor, GlobalVisitorSchema } from '../../database/schemas/global-visitor.schema';
import { Exhibition, ExhibitionSchema } from '../../database/schemas/exhibition.schema';
import { Exhibitor, ExhibitorSchema } from '../../database/schemas/exhibitor.schema';
import { RegistrationCounter, RegistrationCounterSchema } from '../../database/schemas/registration-counter.schema';
import { Pincode, PincodeSchema } from '../../database/schemas/pincode.schema';
import { Country, CountrySchema } from '../../database/schemas/country.schema';
import { State, StateSchema } from '../../database/schemas/state.schema';
import { City, CitySchema } from '../../database/schemas/city.schema';
import { BadgesModule } from '../badges/badges.module';
import { PrintQueueModule } from '../print-queue/print-queue.module';
import { WhatsAppQueueModule } from '../whatsapp-queue/whatsapp-queue.module';
import { MeilisearchModule } from '../meilisearch/meilisearch.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExhibitionRegistration.name, schema: ExhibitionRegistrationSchema },
      { name: GlobalVisitor.name, schema: GlobalVisitorSchema },
      { name: Exhibition.name, schema: ExhibitionSchema },
      { name: Exhibitor.name, schema: ExhibitorSchema },
      { name: RegistrationCounter.name, schema: RegistrationCounterSchema },
      { name: Pincode.name, schema: PincodeSchema },
      { name: Country.name, schema: CountrySchema },
      { name: State.name, schema: StateSchema },
      { name: City.name, schema: CitySchema },
    ]),
    BadgesModule, // Import for badge generation
    PrintQueueModule, // Import for print job queue
    WhatsAppQueueModule, // Import for WhatsApp message delivery
    MeilisearchModule, // Import for auto-indexing visitors
  ],
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
  exports: [RegistrationsService], // Export for use in ExhibitionsModule
})
export class RegistrationsModule {}

