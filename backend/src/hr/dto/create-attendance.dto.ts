import { IsString, IsUUID, IsOptional, IsDateString, IsNumber, Min, Max, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

export class CreateAttendanceDto {
  @IsUUID()
  employeeId: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  checkIn?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  checkOut?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(24)
  hours?: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(20)
  status?: string;
}
