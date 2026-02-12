import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CreateInvoiceDto, CreatePaymentDto } from './dto/finance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('finance')
@Controller('finance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('invoices')
  @ApiOperation({ summary: 'Créer une facture' })
  createInvoice(@Body() createInvoiceDto: CreateInvoiceDto, @TenantId() tenantId: string) {
    return this.financeService.createInvoice(createInvoiceDto, tenantId);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Lister les factures' })
  getInvoices(@TenantId() tenantId: string) {
    return this.financeService.getInvoices(tenantId);
  }

  @Post('payments')
  @ApiOperation({ summary: 'Enregistrer un paiement' })
  recordPayment(@Body() createPaymentDto: CreatePaymentDto, @TenantId() tenantId: string) {
    return this.financeService.recordPayment(createPaymentDto, tenantId);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Obtenir les rapports financiers' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getReports(
    @TenantId() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.getReports(tenantId, startDate, endDate);
  }
}
