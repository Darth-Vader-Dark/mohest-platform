import { IsString, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class ResetPasswordDto {
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  temporaryPassword: string;
}
