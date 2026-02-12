import { IsString, IsEnum, IsOptional, IsUUID, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum InterventionType {
  DIAGNOSTIC = 'diagnostic',
  REPAIR = 'repair',
  MAINTENANCE = 'maintenance',
  OTHER = 'other',
}

export enum InterventionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export class StockItemDto {
  @ApiProperty({ description: 'ID de l\'article du stock' })
  @IsUUID()
  stock_item_id: string;

  @ApiProperty({ description: 'Quantité utilisée' })
  @IsNumber()
  quantity_used: number;

  @ApiProperty({ description: 'Prix unitaire au moment de l\'utilisation' })
  @IsNumber()
  unit_price_at_time: number;
}

export class CreateInterventionDto {
  @ApiProperty({ enum: InterventionType })
  @IsEnum(InterventionType)
  type: InterventionType;

  @ApiProperty({ description: 'ID du véhicule' })
  @IsUUID()
  vehicle_id: string;

  @ApiProperty({ description: 'ID du mécanicien', required: false })
  @IsOptional()
  @IsUUID()
  mechanic_id?: string;

  @ApiProperty({ example: 'Problème de démarrage' })
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  diagnostic_notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  estimated_cost?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  advance_payment?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  remaining_amount?: number;

  @ApiProperty({ required: false, type: [StockItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockItemDto)
  stock_items?: StockItemDto[];
}

export class UpdateInterventionDto {
  @ApiProperty({ enum: InterventionStatus, required: false })
  @IsOptional()
  @IsEnum(InterventionStatus)
  status?: InterventionStatus;

  @ApiProperty({ enum: InterventionType, required: false })
  @IsOptional()
  @IsEnum(InterventionType)
  type?: InterventionType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  vehicle_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  mechanic_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  diagnostic_notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  work_done?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  estimated_cost?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  final_cost?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  advance_payment?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  remaining_amount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  diagnostic_result?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  diagnostic_result_name?: string;

  @ApiProperty({ required: false, type: [StockItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockItemDto)
  stock_items?: StockItemDto[];
}
