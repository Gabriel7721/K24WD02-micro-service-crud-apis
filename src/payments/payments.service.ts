import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from 'src/order/entities/order.entity';
import { Model } from 'mongoose';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
  ) {}

  // private sign(rawSignature: string): string {
  //   const secretKey = this.configService.get<string>('MOMO_SECRET_KEY');
  //   if (!secretKey) {
  //     throw new Error('secretkey is not provided');
  //   }

  //   return crypto.createHmac('sha256', secretKey);
  // }
}
