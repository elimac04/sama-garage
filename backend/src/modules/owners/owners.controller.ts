import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OwnersService } from './owners.service';
import { CreateOwnerDto, UpdateOwnerDto } from './dto/owner.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('owners')
@Controller('owners')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un propriétaire' })
  create(@Body() createOwnerDto: CreateOwnerDto, @TenantId() tenantId: string) {
    return this.ownersService.create(createOwnerDto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les propriétaires' })
  findAll(@TenantId() tenantId: string) {
    return this.ownersService.findAll(tenantId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Rechercher un propriétaire' })
  @ApiQuery({ name: 'q', required: true })
  search(@Query('q') query: string, @TenantId() tenantId: string) {
    return this.ownersService.search(query, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un propriétaire avec ses véhicules' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.ownersService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un propriétaire' })
  update(
    @Param('id') id: string,
    @Body() updateOwnerDto: UpdateOwnerDto,
    @TenantId() tenantId: string,
  ) {
    return this.ownersService.update(id, updateOwnerDto, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un propriétaire' })
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.ownersService.remove(id, tenantId);
  }
}
