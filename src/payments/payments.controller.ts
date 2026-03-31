import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import type { Response } from 'express';

@Controller('payments/momo')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create/:orderId')
  async createPayment(@Param('orderId') orderId: string) {
    return this.paymentsService.createMomoPayment(orderId);
  }
  @Post('ipn')
  async ipn(@Body() body: any) {
    return this.paymentsService.handleMomoIpn(body);
  }
  @Get('return')
  async momoReturn(@Query() query: any, @Res() res: Response) {
    return res.json({
      message: 'Momo redirected back.',
      data: query,
    });
  }
}
