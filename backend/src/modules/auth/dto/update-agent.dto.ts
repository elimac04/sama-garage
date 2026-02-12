import { IsEmail, IsString, IsIn, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAgentDto {
  @ApiProperty({ example: 'Cheikh Mbodj', required: false })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiProperty({ example: 'mechanic@samagarage.sn', required: false })
  @IsOptional()
  @IsEmail({}, { message: 'Veuillez fournir un email valide' })
  email?: string;

  @ApiProperty({ example: '+221 77 123 45 67', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: ['mechanic', 'cashier'], required: false })
  @IsOptional()
  @IsIn(['mechanic', 'cashier'], { message: 'Le rôle doit être soit mechanic soit cashier' })
  role?: 'mechanic' | 'cashier';

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
