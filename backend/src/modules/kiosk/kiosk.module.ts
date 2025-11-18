import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KioskController } from './kiosk.controller';
import { KioskService } from './kiosk.service';
import { KioskSettings, KioskSettingsSchema } from '../../database/schemas/kiosk-settings.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: KioskSettings.name, schema: KioskSettingsSchema },
    ]),
  ],
  controllers: [KioskController],
  providers: [KioskService],
  exports: [KioskService], // Export for use in other modules
})
export class KioskModule {}

