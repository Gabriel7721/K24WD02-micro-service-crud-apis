import {
  IsMongoId,
  IsNumber,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateMenuDto {
  @IsString()
  @Length(2, 50)
  readonly name: string;

  @IsNumber()
  @Min(0)
  @Max(100, { message: 'Please input less than $100' })
  readonly price: number;

  @IsMongoId()
  readonly category: string;
}
