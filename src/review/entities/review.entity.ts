import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Menu } from 'src/menu/entities/menu.entity';

@Schema({ timestamps: true, collection: 'reviews' })
export class Review extends Document {
  @Prop({ required: true })
  userId: string;
  @Prop({ type: Types.ObjectId, ref: Menu.name })
  item: Types.ObjectId;
  @Prop()
  rating: number;
  @Prop()
  comment: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
