import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStockItemDto {
  @ApiProperty({ example: 'Batterie 12V' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'BAT-001', required: false })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ example: 'Batteries', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 25000 })
  @IsNumber()
  unit_price: number;

  @ApiProperty({ example: 5, description: 'Seuil d\'alerte pour stock faible' })
  @IsNumber()
  alert_threshold: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  photos?: string[];

  @ApiProperty({ required: false, description: 'Base64 encoded audio description' })
  @IsOptional()
  @IsString()
  audio?: string;
}

export class UpdateStockItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  unit_price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  alert_threshold?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  photos?: string[];

  @ApiProperty({ required: false, description: 'Base64 encoded audio description' })
  @IsOptional()
  @IsString()
  audio?: string;
}
