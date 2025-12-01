import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { Settings, SettingsSchema } from '../../database/schemas/settings.schema';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Settings.name, schema: SettingsSchema }]),
    UploadsModule,
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule implements OnModuleInit {
  constructor(private readonly settingsService: SettingsService) {}

  async onModuleInit() {
    // Initialize default settings on app startup
    await this.settingsService.initializeDefaults();
  }
}

