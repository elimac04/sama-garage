import { IsString, IsNumber, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum CashRegisterStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum CashPaymentMethod {
  CASH = 'cash',
  WAVE = 'wave',
  ORANGE_MONEY = 'orange_money',
}

export class OpenCashRegisterDto {
  @ApiProperty({ example: 50000, description: 'Montant d\'ouverture de caisse' })
  @IsNumber()
  opening_amount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CloseCashRegisterDto {
  @ApiProperty({ example: 150000, description: 'Montant de fermeture de caisse' })
  @IsNumber()
  closing_amount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateCashTransactionDto {
  @ApiProperty({ description: 'ID de la caisse' })
  @IsUUID()
  cash_register_id: string;

  @ApiProperty({ enum: TransactionType, example: TransactionType.INCOME })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ example: 'Paiement intervention' })
  @IsString()
  category: string;

  @ApiProperty({ example: 25000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: CashPaymentMethod, example: CashPaymentMethod.CASH })
  @IsEnum(CashPaymentMethod)
  payment_method: CashPaymentMethod;

  @ApiProperty({ required: false, description: 'ID de référence (facture, etc.)' })
  @IsOptional()
  @IsUUID()
  reference_id?: string;

  @ApiProperty({ required: false, description: 'Type de référence (invoice, etc.)' })
  @IsOptional()
  @IsString()
  reference_type?: string;
}

export class UpdateCashTransactionDto {
  @ApiProperty({ required: false, enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, enum: CashPaymentMethod })
  @IsOptional()
  @IsEnum(CashPaymentMethod)
  payment_method?: CashPaymentMethod;
}
