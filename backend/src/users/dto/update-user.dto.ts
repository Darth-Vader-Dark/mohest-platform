import {
  IsEmail,
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateUserDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @Transform(trim)
  @IsString()
  @MaxLength(100)
  firstName: string;

  @Transform(trim)
  @IsString()
  @MaxLength(100)
  lastName: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  roleIds: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
