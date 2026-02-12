import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InterventionsService } from './interventions.service';
import { CreateInterventionDto, UpdateInterventionDto } from './dto/intervention.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('interventions')
@Controller('interventions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InterventionsController {
  constructor(private readonly interventionsService: InterventionsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle intervention' })
  create(@Body() createInterventionDto: CreateInterventionDto, @TenantId() tenantId: string) {
    return this.interventionsService.create(createInterventionDto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les interventions' })
  @ApiQuery({ name: 'status', required: false })
  findAll(@TenantId() tenantId: string, @Query('status') status?: string) {
    return this.interventionsService.findAll(tenantId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une intervention' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.interventionsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une intervention' })
  update(
    @Param('id') id: string,
    @Body() updateInterventionDto: UpdateInterventionDto,
    @TenantId() tenantId: string,
  ) {
    return this.interventionsService.update(id, updateInterventionDto, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une intervention' })
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.interventionsService.remove(id, tenantId);
  }
}
