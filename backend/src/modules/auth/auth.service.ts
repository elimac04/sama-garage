import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { EmailService } from '../../common/email/email.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AuthService {
  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 7;

  constructor(
    private supabaseService: SupabaseService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto, tenantId?: string) {
    const { email, password, full_name, role } = registerDto;

    // Vérifier si l'email existe déjà
    const { data: existingUser } = await this.supabaseService
      .getAdminClient()
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new BadRequestException('Cet email est déjà utilisé');
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'entrée dans la table users
    const { data: user, error: dbError } = await this.supabaseService.insert(
      'users',
      {
        email,
        password_hash: hashedPassword,
        full_name,
        role,
        is_active: true,
        tenant_id: tenantId || 'default',
      },
      tenantId || 'default',
    );

    if (dbError) {
      throw new BadRequestException('Erreur lors de la création de l\'utilisateur');
    }

    return {
      message: 'Utilisateur créé avec succès',
      user: user[0],
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Récupérer l'utilisateur depuis notre table users
    const { data: userData, error } = await this.supabaseService
      .getAdminClient()
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !userData) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!userData.is_active) {
      throw new UnauthorizedException('Votre compte a été désactivé. Veuillez contacter votre administrateur.');
    }

    // Vérifier le mot de passe avec bcrypt
    const isPasswordValid = await bcrypt.compare(password, userData.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Générer l'access token (courte durée)
    const payload = {
      sub: userData.id,
      email: userData.email,
      role: userData.role,
      tenant_id: userData.tenant_id,
    };

    const accessToken = this.jwtService.sign(payload);

    // Générer le refresh token (longue durée, stocké en base)
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);

    // Supprimer les anciens refresh tokens de cet utilisateur
    await this.supabaseService
      .getAdminClient()
      .from('refresh_tokens')
      .delete()
      .eq('user_id', userData.id);

    // Stocker le nouveau refresh token
    await this.supabaseService
      .getAdminClient()
      .from('refresh_tokens')
      .insert({
        user_id: userData.id,
        token_hash: refreshTokenHash,
        expires_at: expiresAt.toISOString(),
        tenant_id: userData.tenant_id,
      });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: this.getAccessTokenExpirySeconds(),
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        tenant_id: userData.tenant_id,
      },
    };
  }

  async refreshAccessToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token manquant');
    }

    // Récupérer tous les refresh tokens non expirés
    const { data: tokens, error } = await this.supabaseService
      .getAdminClient()
      .from('refresh_tokens')
      .select('*, user:users(*)')
      .gt('expires_at', new Date().toISOString());

    if (error || !tokens || tokens.length === 0) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    // Vérifier le hash du refresh token
    let matchedToken: any = null;
    for (const t of tokens) {
      const isMatch = await bcrypt.compare(refreshToken, t.token_hash);
      if (isMatch) {
        matchedToken = t;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    const userData = matchedToken.user;
    if (!userData || !userData.is_active) {
      throw new UnauthorizedException('Utilisateur inactif');
    }

    // Générer un nouvel access token
    const payload = {
      sub: userData.id,
      email: userData.email,
      role: userData.role,
      tenant_id: userData.tenant_id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      expires_in: this.getAccessTokenExpirySeconds(),
    };
  }

  async logout(userId: string) {
    // Supprimer tous les refresh tokens de l'utilisateur
    await this.supabaseService
      .getAdminClient()
      .from('refresh_tokens')
      .delete()
      .eq('user_id', userId);

    return { message: 'Déconnexion réussie' };
  }

  private getAccessTokenExpirySeconds(): number {
    const expiry = this.configService.get('JWT_EXPIRATION') || '15m';
    if (expiry.endsWith('m')) return parseInt(expiry) * 60;
    if (expiry.endsWith('h')) return parseInt(expiry) * 3600;
    if (expiry.endsWith('d')) return parseInt(expiry) * 86400;
    return 900; // 15 min par défaut
  }

  async forgotPassword(email: string) {
    // Vérifier si l'utilisateur existe
    const { data: user, error } = await this.supabaseService
      .getAdminClient()
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new NotFoundException('Email non trouvé');
    }

    // Générer un token de réinitialisation
    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email, type: 'password_reset' },
      { expiresIn: '1h' }
    );

    // Stocker le token dans la table password_resets
    const { error: resetError } = await this.supabaseService.insert(
      'password_resets',
      {
        user_id: user.id,
        token: resetToken,
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 heure
        is_used: false,
      },
      user.tenant_id,
    );

    if (resetError) {
      throw new BadRequestException('Erreur lors de la génération du token de réinitialisation');
    }

    // Envoyer l'email de réinitialisation
    await this.emailService.sendPasswordResetEmail(email, resetToken, user.full_name);

    return {
      message: 'Email de réinitialisation envoyé avec succès',
      // Ne pas retourner le token en production
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    };
  }

  async resetPassword(token: string, newPassword: string) {
    // Vérifier le token
    const tokenData = await this.verifyResetToken(token);
    
    if (!tokenData.valid) {
      throw new BadRequestException('Token invalide ou expiré');
    }

    // Hash du nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe dans notre table users
    const { error: updateError } = await this.supabaseService
      .getAdminClient()
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('id', tokenData.user_id);

    if (updateError) {
      throw new BadRequestException('Erreur lors de la mise à jour du mot de passe');
    }

    // Marquer le token comme utilisé
    await this.supabaseService.update(
      'password_resets',
      tokenData.reset_id,
      { is_used: true },
      tokenData.tenant_id,
    );

    return {
      message: 'Mot de passe réinitialisé avec succès',
    };
  }

  async verifyResetToken(token: string) {
    try {
      // Décoder le token JWT
      const decoded = this.jwtService.verify(token);
      
      if (decoded.type !== 'password_reset') {
        return { valid: false, message: 'Token invalide' };
      }

      // Vérifier si le token existe dans la base et n'est pas utilisé
      const { data: resetData, error } = await this.supabaseService
        .getAdminClient()
        .from('password_resets')
        .select('*')
        .eq('token', token)
        .eq('is_used', false)
        .single();

      if (error || !resetData) {
        return { valid: false, message: 'Token non trouvé ou déjà utilisé' };
      }

      // Vérifier si le token n'est pas expiré
      const now = new Date();
      const expiresAt = new Date(resetData.expires_at);
      
      if (now > expiresAt) {
        return { valid: false, message: 'Token expiré' };
      }

      return {
        valid: true,
        user_id: decoded.sub,
        email: decoded.email,
        reset_id: resetData.id,
        tenant_id: resetData.tenant_id,
      };
    } catch (error) {
      return { valid: false, message: 'Token invalide' };
    }
  }

  async createAgent(createAgentDto: CreateAgentDto, tenantId: string) {
    const { email, full_name, phone, role } = createAgentDto;

    // Vérifier si l'email existe déjà
    const { data: existingUser } = await this.supabaseService
      .getAdminClient()
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new BadRequestException('Cet email est déjà utilisé');
    }

    // Générer un mot de passe unique aléatoire (12 caractères)
    const generatedPassword = this.generateSecurePassword();

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Créer l'utilisateur en base
    const { data: user, error: dbError } = await this.supabaseService.insert(
      'users',
      {
        email,
        password_hash: hashedPassword,
        full_name,
        phone: phone || null,
        role,
        is_active: true,
        tenant_id: tenantId,
      },
      tenantId,
    );

    if (dbError) {
      console.error('❌ Supabase insert error:', JSON.stringify(dbError));
      throw new BadRequestException(`Erreur lors de la création de l'agent: ${dbError.message}`);
    }

    // Envoyer les identifiants par email à l'agent
    await this.emailService.sendWelcomeEmail(
      email,
      full_name,
      role,
      generatedPassword,
    );

    return {
      message: 'Agent créé avec succès. Les identifiants ont été envoyés par email.',
      user: user[0],
    };
  }

  private generateSecurePassword(): string {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const special = '@#$!&';
    const all = uppercase + lowercase + digits + special;

    // Garantir au moins 1 de chaque type
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += digits[Math.floor(Math.random() * digits.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Compléter à 12 caractères
    for (let i = password.length; i < 12; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }

    // Mélanger les caractères
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  async getAgents(tenantId: string) {
    // Récupérer uniquement les mécaniciens et caissiers
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('users')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('role', ['mechanic', 'cashier'])
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException('Erreur lors de la récupération des agents');
    }

    return {
      message: 'Agents récupérés avec succès',
      agents: data || [],
      total: data?.length || 0,
    };
  }

  async updateAgent(agentId: string, updateDto: UpdateAgentDto, tenantId: string) {
    // Vérifier que l'agent existe et appartient au tenant
    const { data: agent, error: findError } = await this.supabaseService
      .getAdminClient()
      .from('users')
      .select('*')
      .eq('id', agentId)
      .eq('tenant_id', tenantId)
      .in('role', ['mechanic', 'cashier'])
      .single();

    if (findError || !agent) {
      throw new NotFoundException('Agent non trouvé');
    }

    // Si l'email change, vérifier qu'il n'est pas déjà pris
    if (updateDto.email && updateDto.email !== agent.email) {
      const { data: existing } = await this.supabaseService
        .getAdminClient()
        .from('users')
        .select('id')
        .eq('email', updateDto.email)
        .neq('id', agentId)
        .single();

      if (existing) {
        throw new BadRequestException('Cet email est déjà utilisé par un autre utilisateur');
      }
    }

    // Construire l'objet de mise à jour
    const updateData: any = { updated_at: new Date().toISOString() };
    if (updateDto.full_name !== undefined) updateData.full_name = updateDto.full_name;
    if (updateDto.email !== undefined) updateData.email = updateDto.email;
    if (updateDto.phone !== undefined) updateData.phone = updateDto.phone;
    if (updateDto.role !== undefined) updateData.role = updateDto.role;
    if (updateDto.is_active !== undefined) updateData.is_active = updateDto.is_active;

    const { data: updated, error: updateError } = await this.supabaseService
      .getAdminClient()
      .from('users')
      .update(updateData)
      .eq('id', agentId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Supabase update error:', JSON.stringify(updateError));
      throw new BadRequestException(`Erreur lors de la mise à jour: ${updateError.message}`);
    }

    return {
      message: 'Agent mis à jour avec succès',
      user: updated,
    };
  }

  async deleteAgent(agentId: string, tenantId: string) {
    // Vérifier que l'agent existe et appartient au tenant
    const { data: agent, error: findError } = await this.supabaseService
      .getAdminClient()
      .from('users')
      .select('id, role')
      .eq('id', agentId)
      .eq('tenant_id', tenantId)
      .in('role', ['mechanic', 'cashier'])
      .single();

    if (findError || !agent) {
      throw new NotFoundException('Agent non trouvé');
    }

    // Supprimer l'agent de la base
    const { error: deleteError } = await this.supabaseService
      .getAdminClient()
      .from('users')
      .delete()
      .eq('id', agentId)
      .eq('tenant_id', tenantId);

    if (deleteError) {
      console.error('❌ Supabase delete error:', JSON.stringify(deleteError));
      throw new BadRequestException(`Erreur lors de la suppression: ${deleteError.message}`);
    }

    return { message: 'Agent supprimé avec succès' };
  }

  async validateUser(userId: string) {
    const { data: user } = await this.supabaseService
      .getAdminClient()
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user || !user.is_active) {
      return null;
    }

    return user;
  }
}
