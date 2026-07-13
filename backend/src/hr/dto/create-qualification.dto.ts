import {
  IsString,
  IsOptional,
  IsInt,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateQualificationDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  level: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  fieldOfStudy: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  institution: string;

  @Type(() => Number)
  @IsInt()
  @Min(1950)
  @Max(2100)
  yearAwarded: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  certificateUrl?: string;
}
