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

export class CreateLeaderDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  directorate?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  bio?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  photoUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  sortOrder?: number;
}

export class UpdateLeaderDto extends CreateLeaderDto {}
