import {
  IsString,
  IsOptional,
  IsInt,
  IsIn,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateInstitutionDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @Transform(trim)
  @IsString()
  @MaxLength(200)
  location: string;

  @Transform(trim)
  @IsString()
  @MaxLength(100)
  state: string;

  @Transform(trim)
  @IsString()
  @IsIn([
    'university',
    'institute',
    'community_college',
    'University',
    'Technical',
    'Technical / Vocational',
    'College',
  ])
  category: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  type?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1800)
  @Max(2100)
  established?: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsIn(['Accredited', 'Under review', 'Provisional'])
  status?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return undefined;
    return typeof value === 'string' ? value.trim() : value;
  })
  @IsString()
  @MaxLength(500)
  website?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  sortOrder?: number;
}

export class UpdateInstitutionDto extends CreateInstitutionDto {}
