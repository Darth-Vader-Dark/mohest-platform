import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateNewsArticleDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  excerpt?: string;

  // Full article body — no MaxLength since it stores rich content
  @IsOptional()
  @Transform(trim)
  @IsString()
  body?: string;

  // Stores a base64 data URI — no MaxLength (data URIs are large)
  @IsOptional()
  @Transform(trim)
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @IsOptional()
  @IsBoolean()
  isLead?: boolean;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(50)
  thumbStyle?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return undefined;
    return typeof value === 'string' ? value.trim() : value;
  })
  @IsString()
  @MaxLength(500)
  link?: string;
}

export class UpdateNewsArticleDto extends CreateNewsArticleDto {}
