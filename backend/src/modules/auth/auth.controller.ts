import { 
  Controller, 
  Post, 
  Patch,
  Delete,
  Body, 
  Param,
  Request, 
  UseGuards, 
  Get, 
  BadRequestException,
  InternalServerErrorException 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/decorators/roles.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentatives par minute
  @ApiOperation({ summary: 'Se connecter' })
  @ApiResponse({ status: 200, description: 'Connexion réussie - retourne access_token + refresh_token' })
  @ApiResponse({ status: 401, description: 'Email ou mot de passe incorrect' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Renouveler l\'access token avec un refresh token' })
  @ApiResponse({ status: 200, description: 'Nouveau access_token généré' })
  @ApiResponse({ status: 401, description: 'Refresh token invalide ou expiré' })
  async refresh(@Body() body: { refresh_token: string }) {
    return this.authService.refreshAccessToken(body.refresh_token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Se déconnecter (invalide les refresh tokens)' })
  @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
  async logout(@Request() req) {
    return this.authService.logout(req.user.id);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_GARAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un nouvel utilisateur (Admin uniquement)' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  @ApiResponse({ status: 400, description: 'Rôle non autorisé' })
  async register(@Body() registerDto: RegisterDto, @Request() req) {
    // Vérifier que l'utilisateur qui crée le compte est bien un admin
    const currentUser = req.user;
    if (!currentUser || currentUser.role !== UserRole.ADMIN_GARAGE) {
      throw new BadRequestException('Seul un administrateur peut créer des comptes utilisateurs');
    }

    // L'admin ne peut créer que des mécaniciens ou des caissiers
    if (registerDto.role !== UserRole.MECHANIC && registerDto.role !== UserRole.CASHIER) {
      throw new BadRequestException('L\'admin ne peut créer que des comptes mécanicien ou caissier');
    }

    return this.authService.register(registerDto, currentUser.tenant_id);
  }

  @Post('create-agent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_GARAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un compte agent (Mécanicien ou Caissier)' })
  @ApiResponse({ status: 201, description: 'Agent créé avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async createAgent(@Body() createAgentDto: CreateAgentDto, @Request() req) {
    const currentUser = req.user;
    return this.authService.createAgent(createAgentDto, currentUser.tenant_id);
  }

  @Get('agents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_GARAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister tous les agents (Admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Liste des agents' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  async getAgents(@Request() req) {
    const currentUser = req.user;
    return this.authService.getAgents(currentUser.tenant_id);
  }

  @Patch('agents/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_GARAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour un agent' })
  @ApiResponse({ status: 200, description: 'Agent mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Agent non trouvé' })
  async updateAgent(
    @Param('id') id: string,
    @Body() updateAgentDto: UpdateAgentDto,
    @Request() req,
  ) {
    const currentUser = req.user;
    return this.authService.updateAgent(id, updateAgentDto, currentUser.tenant_id);
  }

  @Delete('agents/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_GARAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un agent' })
  @ApiResponse({ status: 200, description: 'Agent supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Agent non trouvé' })
  async deleteAgent(@Param('id') id: string, @Request() req) {
    const currentUser = req.user;
    return this.authService.deleteAgent(id, currentUser.tenant_id);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 tentatives par minute
  @ApiOperation({ summary: 'Demander la réinitialisation du mot de passe' })
  @ApiResponse({ status: 200, description: 'Email de réinitialisation envoyé' })
  @ApiResponse({ status: 404, description: 'Email non trouvé' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 tentatives par minute
  @ApiOperation({ summary: 'Réinitialiser le mot de passe' })
  @ApiResponse({ status: 200, description: 'Mot de passe réinitialisé avec succès' })
  @ApiResponse({ status: 400, description: 'Token invalide ou expiré' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
  }

  @Post('verify-reset-token')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentatives par minute
  @ApiOperation({ summary: 'Vérifier la validité du token de réinitialisation' })
  @ApiResponse({ status: 200, description: 'Token valide' })
  @ApiResponse({ status: 400, description: 'Token invalide ou expiré' })
  async verifyResetToken(@Body() body: { token: string }) {
    return this.authService.verifyResetToken(body.token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtenir les informations de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Informations utilisateur' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getProfile(@Request() req) {
    return this.authService.validateUser(req.user.id);
  }
}
