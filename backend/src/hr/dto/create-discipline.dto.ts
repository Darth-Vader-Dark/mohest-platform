import { IsString, IsUUID, IsOptional, IsDateString, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

export class CreateDisciplineDto {
  @IsUUID()
  employeeId: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  actionType: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(20)
  severity?: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  incident: string;

  @IsDateString()
  date: string;
}
