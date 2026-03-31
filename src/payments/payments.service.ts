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
    const amount = this.convertedToVND(order.total);
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
    try {
      order.momoOrderId = momoOrderId;
      order.momoRequestId = requestId;
      order.paymentMethod = 'momo';
      order.paymentStatus = 'PENDING';
      await order.save();

      return data;
    } catch (error) {
      const momoError = error?.response?.data;
      if (momoError) {
        throw new BadRequestException({
          message: momoError.message,
          resultCode: momoError.resultCode,
        });
      }
    }
  }

  verifyMomoCallbackSignature(body: any): boolean {
    const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY');
    if (!accessKey) {
      return false;
    }
    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${body.amount}` +
      `&extraData=${body.extraData || ''}` +
      `&message=${body.message}` +
      `&orderId=${body.orderId}` +
      `&orderInfo=${body.orderInfo}` +
      `&orderType=${body.orderType}` +
      `&partnerCode=${body.partnerCode}` +
      `&payType=${body.payType}` +
      `&requestId=${body.requestId}` +
      `&responseTime=${body.responseTime}` +
      `&resultCode=${body.resultCode}` +
      `&transId=${body.transId}`;

    const expectedSignature = this.sign(rawSignature);
    return expectedSignature === body.signature;
  }

  async handleMomoIpn(body: any) {
    const isValidSignature = this.verifyMomoCallbackSignature(body);
    if (!isValidSignature) {
      return { resultCode: 13, message: 'Merchant authentication failed.' };
    }

    const order = await this.orderModel.findOne({
      momoOrderId: body.orderId,
      momoRequestId: body.requestId,
    });

    if (!order) {
      return {
        resultCode: 42,
        message: 'Invalid orderId or orderId is not found.',
      };
    }

    const expectedAmount = this.convertedToVND(order.total)
    if (Number(expectedAmount) !== Number(body.amount)) {
      console.log("Amount mismatch");
      return { resultCode: 1, message: 'Amount mismatch' };
    }

    if (Number(body.resultCode) === 0) {
      order.paymentStatus = 'PAID';
      order.momoTransId = body.transId;
      await order.save();
      return { resultCode: 0, message: 'Successful.' };
    }
    order.paymentStatus = 'FAILED';
    await order.save();
    return { resultCode: 0, message: 'Received.' };
  }

  convertedToVND(orderTotal: number): number {
    const rate = Number(process.env.MOMO_CONVERT_RATE);
    const amount = Math.round(Number(orderTotal) * rate);
    return amount;
  }
}
