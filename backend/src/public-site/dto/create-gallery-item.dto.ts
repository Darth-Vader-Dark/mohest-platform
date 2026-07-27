import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateGalleryItemDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  imageUrl: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateGalleryItemDto extends CreateGalleryItemDto {}
