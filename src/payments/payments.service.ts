import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from 'src/order/entities/order.entity';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
  ) {}

  private sign(rawSignature: string): string {
    const secretKey = this.configService.get<string>('MOMO_SECRET_KEY');

    if (!secretKey) {
      throw new InternalServerErrorException('MOMO_SECRET_KEY is not provided');
    }

    return crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');
  }

  async createMomoPayment(orderId: string) {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new BadRequestException('OrderId not found');
    }
    if (order.paymentStatus === 'PAID') {
      throw new BadRequestException('Order already paid');
    }

    // Install Raw Signature
    const partnerCode = this.configService.get<string>('MOMO_PARTNER_CODE');
    const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY');
    const endpoint = this.configService.get<string>('MOMO_ENDPOINT');
    const redirectUrl = this.configService.get<string>('MOMO_REDIRECT_URL');
    const ipnUrl = this.configService.get<string>('MOMO_IPN_URL');
    const requestType =
      this.configService.get<string>('MOMO_REQUEST_TYPE') || 'captureWallet';

    if (!partnerCode || !accessKey || !endpoint || !redirectUrl || !ipnUrl) {
      throw new InternalServerErrorException('Missing MoMo config');
    }

    const momoOrderId = `ORDER_${order._id}_${Date.now()}`;
    const requestId = `REQ_${order._id}_${Date.now()}`;
    const amount = order.total;
    const orderInfo = `Thanh toan don hang ${order._id}`;
    const extraData = Buffer.from(
      JSON.stringify({ internalOrderId: String(order._id) }),
    ).toString('base64');

    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}` +
      `&orderId=${momoOrderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}` +
      `&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=${requestType}`;

    const signature = this.sign(rawSignature);

    const payload = {
      orderId: momoOrderId,
      partnerCode,
      accessKey,
      redirectUrl,
      ipnUrl,
      requestId,
      amount,
      orderInfo,
      signature,
      lang: 'vi',
      requestType,
      extraData,
    };

    const { data } = await firstValueFrom(
      this.httpService.post(endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }),
    );

    order.momoOrderId = momoOrderId;
  }
}
