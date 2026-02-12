import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor(private configService: ConfigService) {
    this.fromEmail = this.configService.get('SMTP_FROM') || this.configService.get('SMTP_USER') || 'noreply@samagarage.sn';
    this.frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';

    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get('SMTP_PORT') || '587'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });

    // Vérifier la connexion SMTP au démarrage
    this.transporter.verify().then(() => {
      this.logger.log('✅ Connexion SMTP établie avec succès');
    }).catch((err) => {
      this.logger.warn(`⚠️ SMTP non configuré ou inaccessible: ${err.message}. Les emails seront loggés en console.`);
    });
  }

  private async sendMail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"SAMA GARAGE" <${this.fromEmail}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`📧 Email envoyé à ${to}: ${subject}`);
      return true;
    } catch (error) {
      this.logger.warn(`⚠️ Échec envoi email à ${to}: ${error.message}`);
      this.logger.log(`📋 Contenu de l'email (fallback console):`);
      this.logger.log(`   Destinataire: ${to}`);
      this.logger.log(`   Sujet: ${subject}`);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, userName: string) {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">SAMA GARAGE</h1>
          <p style="color: #dbeafe; margin: 5px 0 0;">Gestion de Garage Automobile</p>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #1e293b; margin-top: 0;">Réinitialisation de mot de passe</h2>
          <p style="color: #475569;">Bonjour <strong>${userName}</strong>,</p>
          <p style="color: #475569;">Vous avez demandé la réinitialisation de votre mot de passe.</p>
          <p style="color: #475569;">Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">Ce lien expirera dans <strong>1 heure</strong>.</p>
          <p style="color: #94a3b8; font-size: 14px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            SAMA GARAGE — Cet email a été envoyé automatiquement.
          </p>
        </div>
      </div>
    `;

    const sent = await this.sendMail(email, 'Réinitialisation de votre mot de passe — SAMA GARAGE', html);

    // Toujours logger le lien en console pour le debug
    console.log(`🔗 Lien de réinitialisation pour ${email}: ${resetUrl}`);

    return { success: true, sent };
  }

  async sendWelcomeEmail(email: string, userName: string, role: string, password: string) {
    const roleLabel = role === 'mechanic' ? 'Mécanicien' : role === 'cashier' ? 'Caissier' : role;
    const loginUrl = `${this.frontendUrl}/login`;

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">SAMA GARAGE</h1>
          <p style="color: #dbeafe; margin: 5px 0 0;">Gestion de Garage Automobile</p>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #1e293b; margin-top: 0;">Bienvenue dans l'équipe !</h2>
          <p style="color: #475569;">Bonjour <strong>${userName}</strong>,</p>
          <p style="color: #475569;">Un compte <strong>${roleLabel}</strong> a été créé pour vous sur la plateforme SAMA GARAGE.</p>
          
          <div style="background: #f1f5f9; border-radius: 10px; padding: 20px; margin: 25px 0; border-left: 4px solid #2563eb;">
            <h3 style="color: #1e293b; margin-top: 0; font-size: 16px;">Vos identifiants de connexion</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 120px;">Email :</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600; font-size: 14px;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Mot de passe :</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600; font-size: 14px; font-family: monospace; background: #e2e8f0; padding-left: 8px; border-radius: 4px;">${password}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Rôle :</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600; font-size: 14px;">${roleLabel}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
              Se connecter
            </a>
          </div>

          <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              ⚠️ <strong>Important :</strong> Nous vous recommandons de changer votre mot de passe après votre première connexion.
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            SAMA GARAGE — Cet email a été envoyé automatiquement.
          </p>
        </div>
      </div>
    `;

    const sent = await this.sendMail(email, 'Bienvenue sur SAMA GARAGE — Vos identifiants de connexion', html);

    // Toujours logger les identifiants en console pour le debug
    console.log(`👤 Identifiants agent ${userName}: ${email} / ${password}`);

    return { success: true, sent };
  }
}
