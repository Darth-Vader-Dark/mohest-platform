import {
  IsString,
  IsUUID,
  IsOptional,
  IsEmail,
  IsDateString,
  IsIn,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateEmployeeDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9\-_/]+$/, {
    message: 'Employee number may only contain letters, numbers, hyphens, underscores, and slashes.',
  })
  employeeNumber: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @IsUUID()
  departmentId: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  position: string;

  @Transform(trim)
  @IsString()
  @IsIn(['Permanent', 'Contract', 'Temporary', 'Probation'])
  employmentType: string;

  @IsDateString()
  hireDate: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(20)
  gender?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(50)
  nationalId?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  personalEmail?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsIn(['Active', 'Inactive', 'OnLeave', 'Terminated'])
  status?: string;
}

export class UpdateEmployeeDto extends CreateEmployeeDto {}
