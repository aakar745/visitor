import { Module, Global } from '@nestjs/common';
import { MeilisearchService } from './meilisearch.service';

@Global() // Make Meilisearch service available everywhere
@Module({
  providers: [MeilisearchService],
  exports: [MeilisearchService],
})
export class MeilisearchModule {}

