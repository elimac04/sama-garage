import { IsEmail, IsString, IsIn, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/decorators/roles.decorator';

export class CreateAgentDto {
  @ApiProperty({ 
    example: 'mechanic@samagarage.sn',
    description: 'Email professionnel de l\'agent'
  })
  @IsEmail({}, { message: 'Veuillez fournir un email valide' })
  @IsNotEmpty({ message: 'L\'email est obligatoire' })
  email: string;

  @ApiProperty({ 
    example: 'Cheikh Mbodj',
    description: 'Nom complet de l\'agent'
  })
  @IsString({ message: 'Le nom complet doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom complet est obligatoire' })
  full_name: string;

  @ApiProperty({ 
    example: '+221 77 123 45 67',
    description: 'Numéro de téléphone de l\'agent',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ 
    enum: ['mechanic', 'cashier'],
    example: 'mechanic',
    description: 'Rôle de l\'agent (uniquement mechanic ou cashier)'
  })
  @IsIn(['mechanic', 'cashier'], { 
    message: 'Le rôle doit être soit mechanic soit cashier' 
  })
  @IsNotEmpty({ message: 'Le rôle est obligatoire' })
  role: 'mechanic' | 'cashier';
}
