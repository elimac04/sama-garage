import { IsString, IsEnum, IsNumber, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentMethod {
  CASH = 'cash',
  WAVE = 'wave',
  ORANGE_MONEY = 'orange_money',
}

export class CreateInvoiceDto {
  @ApiProperty({ description: 'ID de l\'intervention' })
  @IsUUID()
  intervention_id: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  total_amount: number;

  @ApiProperty({ example: 'Changement de batterie et vidange', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreatePaymentDto {
  @ApiProperty({ description: 'ID de la facture' })
  @IsUUID()
  invoice_id: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  amount_paid: number;
}
