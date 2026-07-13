import {
  IsString,
  IsOptional,
  IsInt,
  IsIn,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateScholarshipDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  description?: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  fields: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  level?: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  country: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsIn(['Open', 'Opens quarterly', 'Annual cycle', 'Closed', 'Upcoming'])
  status?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsIn(['link', 'pdf', 'none'])
  applicationMode?: string;

  @ValidateIf((o) => o.applicationMode === 'link')
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return undefined;
    return typeof value === 'string' ? value.trim() : value;
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  link?: string;

  @ValidateIf((o) => o.applicationMode === 'pdf')
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  pdfUrl?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  sortOrder?: number;
}

export class UpdateScholarshipDto extends CreateScholarshipDto {}
