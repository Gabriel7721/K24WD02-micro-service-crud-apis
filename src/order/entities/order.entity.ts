import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Menu } from 'src/menu/entities/menu.entity';
import { User } from 'src/users/entities/user.entity';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
@Schema({ timestamps: true, collection: 'orders' })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name })
  user: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: Menu.name })
  item: Types.ObjectId;
  @Prop()
  total: number;

  @Prop({ default: 'cash' })
  paymentMethod: 'cash' | 'momo';
  @Prop({ default: 'PENDING' })
  paymentStatus: PaymentStatus;
  @Prop()
  momoOrderId?: string;
  @Prop()
  momoRequestId?: string;
  @Prop()
  momoTransId?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
