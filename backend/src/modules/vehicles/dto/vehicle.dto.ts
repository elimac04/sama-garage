import { IsString, IsOptional, IsUUID, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({ example: 'DK-1234-AB' })
  @IsString()
  registration_number: string;

  @ApiProperty({ example: 'Toyota' })
  @IsString()
  brand: string;

  @ApiProperty({ example: 'Corolla' })
  @IsString()
  model: string;

  @ApiProperty({ example: '2018', required: false })
  @IsOptional()
  @IsString()
  year?: string;

  @ApiProperty({ example: 'VIN123456789', required: false })
  @IsOptional()
  @IsString()
  vin?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  // Propriétaire - soit owner_id existant, soit créer via owner_name + owner_phone
  @ApiProperty({ description: 'ID du propriétaire existant', required: false })
  @IsOptional()
  @IsUUID()
  owner_id?: string;

  @ApiProperty({ example: 'Amadou Ba', required: false })
  @IsOptional()
  @IsString()
  owner_name?: string;

  @ApiProperty({ example: '+221 77 123 45 67', required: false })
  @IsOptional()
  @IsString()
  owner_phone?: string;

  // Photos en base64
  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  photos?: string[];

  // Audio en base64
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  audio_url?: string;

  // Type d'intervention
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  intervention_type?: string;

  // Description du problème
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateVehicleDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  registration_number?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  year?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  owner_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  owner_phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  photos?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  audio_url?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  intervention_type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
