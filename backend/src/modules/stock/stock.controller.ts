import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StockService } from './stock.service';
import { CreateStockItemDto, UpdateStockItemDto } from './dto/stock.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('stock')
@Controller('stock')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post()
  @ApiOperation({ summary: 'Ajouter un article au stock' })
  create(@Body() createStockItemDto: CreateStockItemDto, @TenantId() tenantId: string) {
    return this.stockService.create(createStockItemDto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les articles en stock' })
  findAll(@TenantId() tenantId: string) {
    return this.stockService.findAll(tenantId);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Alertes de stock faible' })
  getLowStockAlerts(@TenantId() tenantId: string) {
    return this.stockService.getLowStockAlerts(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un article' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.stockService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un article' })
  update(
    @Param('id') id: string,
    @Body() updateStockItemDto: UpdateStockItemDto,
    @TenantId() tenantId: string,
  ) {
    return this.stockService.update(id, updateStockItemDto, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un article' })
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.stockService.remove(id, tenantId);
  }
}
