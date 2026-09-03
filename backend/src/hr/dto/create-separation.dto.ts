import { IsString, IsUUID, IsOptional, IsDateString, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

export class CreateSeparationDto {
  @IsUUID()
  employeeId: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  separationType: string;

  @IsDateString()
  lastWorkingDay: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsBoolean()
  benefitsCleared?: boolean;
}
