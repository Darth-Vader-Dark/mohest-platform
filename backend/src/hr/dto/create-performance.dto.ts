import { IsString, IsUUID, IsOptional, IsNumber, Min, Max, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

export class CreatePerformanceDto {
  @IsUUID()
  employeeId: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  reviewPeriod: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  score: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  reviewer?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  comments?: string;
}
