import { IsMongoId, IsNumber, IsString, Max, Min, min } from 'class-validator';

export class CreateReviewDto {
  @IsMongoId()
  user: string;
  @IsMongoId()
  item: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  comment: string;
}
