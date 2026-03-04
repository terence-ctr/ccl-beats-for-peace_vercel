import nodemailer from 'nodemailer';

// Configuration SMTP - CORRIGÉ: lopango.org au lieu de mail.mail.lopango.org
const transporter = nodemailer.createTransport({
  host: 'lopango.org',
  port: 465,
  secure: true,
  auth: {
    user: 'noreply@lopango.org',
    pass: 'Q,dQX~w*ZklU=UE@'
  }
});

// Vérifier la connexion SMTP au démarrage
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Erreur connexion SMTP:', error.message);
  } else {
    console.log('✅ Serveur SMTP connecté et prêt');
  }
});

// Test direct du service email
export async function testEmailService(): Promise<boolean> {
  try {
    console.log('🧪 Test direct du service email...');
    
    const testResult = await transporter.sendMail({
      from: '"CCL Beats for Peace" <noreply@lopango.org>',
      to: 'noreply@lopango.org', // Utiliser une adresse email valide du domaine
      subject: 'Test Email Service - CCL Beats',
      html: '<h1>Test</h1><p>Ceci est un test du service email CCL Beats for Peace.</p>',
      text: 'Ceci est un test du service email CCL Beats for Peace.'
    });
    
    console.log('✅ Test email réussi:', testResult.messageId);
    return true;
  } catch (error: any) {
    console.error('❌ Erreur test email:', error.message);
    return false;
  }
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Envoyer un email
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const mailOptions = {
      from: '"CCL Beats for Peace" <noreply@lopango.org>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '')
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé à ${options.to}: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Erreur envoi email à ${options.to}:`, error.message);
    return false;
  }
}

// Email de vérification
export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #8B5CF6; margin: 0; }
        .code { background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 10px; letter-spacing: 8px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎵 CCL Beats for Peace</h1>
        </div>
        <p>Bonjour,</p>
        <p>Voici votre code de vérification pour confirmer votre adresse email :</p>
        <div class="code">${code}</div>
        <p>Ce code est valable pendant <strong>10 minutes</strong>.</p>
        <p>Si vous n'avez pas demandé ce code, ignorez cet email.</p>
        <div class="footer">
          <p>© 2026 CCL Beats for Peace - Congo Challenge League</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '🔐 Code de vérification - CCL Beats for Peace',
    html
  });
}

// Email de confirmation de rôle
export async function sendRoleConfirmationEmail(email: string, roleName: string, username: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #8B5CF6; margin: 0; }
        .role { background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; font-size: 24px; font-weight: bold; text-align: center; padding: 15px; border-radius: 10px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎵 CCL Beats for Peace</h1>
        </div>
        <p>Bonjour <strong>${username}</strong>,</p>
        <p>Votre rôle sur la plateforme CCL Beats for Peace a été mis à jour :</p>
        <div class="role">✨ ${roleName}</div>
        <p>Vous pouvez maintenant accéder aux fonctionnalités correspondantes à votre nouveau rôle.</p>
        <p>Connectez-vous sur <a href="https://ccl.lopango.org">ccl.lopango.org</a> pour commencer.</p>
        <div class="footer">
          <p>© 2026 CCL Beats for Peace - Congo Challenge League</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `🎉 Nouveau rôle attribué: ${roleName} - CCL Beats for Peace`,
    html
  });
}

// Email de confirmation de candidature
export async function sendCandidatureConfirmationEmail(email: string, nomArtiste: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #8B5CF6; margin: 0; }
        .success { background: #10B981; color: white; font-size: 20px; font-weight: bold; text-align: center; padding: 15px; border-radius: 10px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎵 CCL Beats for Peace</h1>
        </div>
        <p>Bonjour <strong>${nomArtiste}</strong>,</p>
        <div class="success">✅ Candidature soumise avec succès !</div>
        <p>Votre candidature a bien été reçue et est en cours d'examen par notre équipe.</p>
        <p>Vous recevrez une notification dès que votre candidature sera validée.</p>
        <p><strong>Prochaines étapes :</strong></p>
        <ul>
          <li>Vérification de votre profil par notre équipe</li>
          <li>Validation de votre candidature</li>
          <li>Accès à la compétition</li>
        </ul>
        <div class="footer">
          <p>© 2026 CCL Beats for Peace - Congo Challenge League</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '✅ Candidature reçue - CCL Beats for Peace',
    html
  });
}

export default {
  sendEmail,
  sendVerificationEmail,
  sendRoleConfirmationEmail,
  sendCandidatureConfirmationEmail
};
