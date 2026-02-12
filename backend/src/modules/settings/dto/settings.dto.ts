import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiProperty({ example: 'SAMA GARAGE', required: false })
  @IsOptional()
  @IsString()
  garage_name?: string;

  @ApiProperty({ example: 'Dakar, Sénégal', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: '+221 77 123 45 67', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'contact@samagarage.sn', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'https://samagarage.sn', required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logo_url?: string;
}
