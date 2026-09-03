import { IsString, IsUUID, IsOptional, IsDateString, IsInt, Min, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

export class CreateLeaveDto {
  @IsUUID()
  employeeId: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  leaveType: string;

  @IsDateString()
  fromDate: string;

  @IsDateString()
  toDate: string;

  @IsInt()
  @Min(1)
  days: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class UpdateLeaveStatusDto {
  @Transform(trim)
  @IsString()
  status: string; // Approved, Rejected
}
