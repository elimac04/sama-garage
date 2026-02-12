import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CashService } from './cash.service';
import {
  OpenCashRegisterDto,
  CloseCashRegisterDto,
  CreateCashTransactionDto,
  UpdateCashTransactionDto,
} from './dto/cash.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('cash')
@Controller('cash')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CashController {
  constructor(private readonly cashService: CashService) {}

  // ==================== CASH REGISTERS ====================

  @Post('registers/open')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN_GARAGE, UserRole.CASHIER)
  @ApiOperation({ summary: 'Ouvrir une caisse' })
  openRegister(
    @Body() dto: OpenCashRegisterDto,
    @Request() req,
    @TenantId() tenantId: string,
  ) {
    return this.cashService.openRegister(dto, req.user.id, tenantId);
  }

  @Post('registers/:id/close')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN_GARAGE, UserRole.CASHIER)
  @ApiOperation({ summary: 'Fermer une caisse' })
  closeRegister(
    @Param('id') id: string,
    @Body() dto: CloseCashRegisterDto,
    @Request() req,
    @TenantId() tenantId: string,
  ) {
    return this.cashService.closeRegister(id, dto, req.user.id, tenantId);
  }

  @Get('registers/current')
  @ApiOperation({ summary: 'Obtenir la caisse ouverte actuelle' })
  getCurrentRegister(@TenantId() tenantId: string) {
    return this.cashService.getCurrentRegister(tenantId);
  }

  @Get('registers')
  @ApiOperation({ summary: 'Lister toutes les caisses' })
  findAllRegisters(@TenantId() tenantId: string) {
    return this.cashService.findAllRegisters(tenantId);
  }

  @Get('registers/:id')
  @ApiOperation({ summary: 'Récupérer une caisse avec son solde' })
  getRegisterBalance(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.cashService.getRegisterBalance(id, tenantId);
  }

  // ==================== CASH TRANSACTIONS ====================

  @Post('transactions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN_GARAGE, UserRole.CASHIER)
  @ApiOperation({ summary: 'Ajouter une transaction' })
  createTransaction(
    @Body() dto: CreateCashTransactionDto,
    @Request() req,
    @TenantId() tenantId: string,
  ) {
    return this.cashService.createTransaction(dto, req.user.id, tenantId);
  }

  @Get('transactions/register/:registerId')
  @ApiOperation({ summary: 'Lister les transactions d\'une caisse' })
  findTransactionsByRegister(
    @Param('registerId') registerId: string,
    @TenantId() tenantId: string,
  ) {
    return this.cashService.findTransactionsByRegister(registerId, tenantId);
  }

  @Patch('transactions/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN_GARAGE, UserRole.CASHIER)
  @ApiOperation({ summary: 'Modifier une transaction' })
  updateTransaction(
    @Param('id') id: string,
    @Body() dto: UpdateCashTransactionDto,
    @TenantId() tenantId: string,
  ) {
    return this.cashService.updateTransaction(id, dto, tenantId);
  }

  @Delete('transactions/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN_GARAGE)
  @ApiOperation({ summary: 'Supprimer une transaction (Admin uniquement)' })
  deleteTransaction(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.cashService.deleteTransaction(id, tenantId);
  }
}
