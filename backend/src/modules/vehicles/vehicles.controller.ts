import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('vehicles')
@Controller('vehicles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @ApiOperation({ summary: 'Enregistrer un nouveau véhicule' })
  create(@Body() createVehicleDto: CreateVehicleDto, @TenantId() tenantId: string) {
    return this.vehiclesService.create(createVehicleDto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les véhicules' })
  findAll(@TenantId() tenantId: string) {
    return this.vehiclesService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un véhicule avec son historique' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.vehiclesService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un véhicule' })
  update(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @TenantId() tenantId: string,
  ) {
    return this.vehiclesService.update(id, updateVehicleDto, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un véhicule' })
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.vehiclesService.remove(id, tenantId);
  }
}
