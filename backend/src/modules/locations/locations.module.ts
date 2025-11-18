import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { Country, CountrySchema } from '../../database/schemas/country.schema';
import { State, StateSchema } from '../../database/schemas/state.schema';
import { City, CitySchema } from '../../database/schemas/city.schema';
import { Pincode, PincodeSchema } from '../../database/schemas/pincode.schema';
import { LocationsSeedService } from '../../database/seeds/locations.seed';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Country.name, schema: CountrySchema },
      { name: State.name, schema: StateSchema },
      { name: City.name, schema: CitySchema },
      { name: Pincode.name, schema: PincodeSchema },
    ]),
  ],
  controllers: [LocationsController],
  providers: [LocationsService, LocationsSeedService],
  exports: [LocationsService, LocationsSeedService], // Export service for use in other modules
})
export class LocationsModule {}
