import { IsString, IsUUID, IsOptional, IsInt, Min, IsDateString, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

export class CreateTrainingDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  type: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(50)
  duration?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxEnroll?: number;
}

export class EnrollTrainingDto {
  @IsUUID()
  employeeId: string;

  @IsUUID()
  programId: string;
}
