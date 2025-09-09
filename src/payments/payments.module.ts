import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';

@Module({
  controllers: [PaymentsController],
  providers: [],
  exports: [],
})
export class PaymentsModule {}


