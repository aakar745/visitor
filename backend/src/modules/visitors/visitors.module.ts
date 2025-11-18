import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GlobalVisitor, GlobalVisitorSchema } from '../../database/schemas/global-visitor.schema';
import { ExhibitionRegistration, ExhibitionRegistrationSchema } from '../../database/schemas/exhibition-registration.schema';
import { VisitorsController } from './visitors.controller';
import { VisitorsService } from './visitors.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GlobalVisitor.name, schema: GlobalVisitorSchema },
      { name: ExhibitionRegistration.name, schema: ExhibitionRegistrationSchema },
    ]),
  ],
  controllers: [VisitorsController],
  providers: [VisitorsService],
  exports: [VisitorsService],
})
export class VisitorsModule {}

