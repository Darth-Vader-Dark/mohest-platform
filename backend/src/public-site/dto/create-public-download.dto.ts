import {
  IsString,
  IsOptional,
  IsInt,
  IsIn,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePublicDownloadDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsIn(['form', 'guideline', 'policy', 'statement', 'other'])
  category?: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  fileUrl: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fileSize?: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(20)
  fileLabel?: string;

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

export class UpdatePublicDownloadDto extends CreatePublicDownloadDto {}
