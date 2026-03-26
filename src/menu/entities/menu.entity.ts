import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Category } from 'src/category/entities/category.entity';

@Schema({ timestamps: true, collection: 'menus' })
export class Menu extends Document {
  @Prop({ required: true, unique: true })
  name: string;
  @Prop()
  price: number;
  @Prop({ type: Types.ObjectId, ref: Category.name })
  category: Types.ObjectId;
}

export const MenuSchema = SchemaFactory.createForClass(Menu);
