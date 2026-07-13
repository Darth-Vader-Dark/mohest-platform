import { IsEmail, IsString, MinLength, IsOptional, IsUUID, IsArray, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  firstName: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  lastName: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  roleIds: string[];

  // Temporary password set by the ICT administrator creating the account.
  // mustResetPassword is forced true so the employee sets their own on
  // first login.
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  temporaryPassword: string;
}
