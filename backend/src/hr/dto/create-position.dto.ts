import { IsString, IsOptional, IsInt, Min, IsUUID, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

export class CreatePositionDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsUUID()
  departmentId: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  grade: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sanctionedCount?: number;
}
