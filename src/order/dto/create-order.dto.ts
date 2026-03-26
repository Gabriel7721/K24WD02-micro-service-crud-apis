import { IsArray, IsMongoId } from 'class-validator';

export class CreateOrderDto {
  @IsMongoId()
  user: string;

  @IsArray()
  @IsMongoId({ each: true })
  item: string[];
}
