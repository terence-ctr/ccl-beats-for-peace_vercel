/**
 * Service SMS pour l'envoi de SMS de vérification
 * 
 * Options d'intégration:
 * - Twilio (recommandé pour l'international)
 * - Africa's Talking (recommandé pour l'Afrique)
 * - Orange SMS API (pour RDC/Afrique francophone)
 * - Nexmo/Vonage
 * 
 * Pour l'instant, ce service simule l'envoi et log les messages.
 * Décommentez et configurez le provider de votre choix.
 */

// Configuration SMS (à déplacer vers .env en production)
const SMS_CONFIG = {
  provider: 'simulation', // 'twilio' | 'africas_talking' | 'orange' | 'simulation'
  // Twilio
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromNumber: process.env.TWILIO_FROM_NUMBER || '+1234567890'
  },
  // Africa's Talking
  africasTalking: {
    apiKey: process.env.AT_API_KEY || '',
    username: process.env.AT_USERNAME || 'sandbox',
    shortCode: process.env.AT_SHORTCODE || 'CCL'
  }
};

export interface SmsOptions {
  to: string;
  message: string;
}

// Normaliser le numéro de téléphone (format international)
function normalizePhoneNumber(phone: string): string {
  let normalized = phone.replace(/\s+/g, '').replace(/-/g, '');
  
  // Si le numéro commence par 0, ajouter l'indicatif RDC (+243)
  if (normalized.startsWith('0')) {
    normalized = '+243' + normalized.substring(1);
  }
  
  // Si le numéro ne commence pas par +, ajouter +
  if (!normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }
  
  return normalized;
}

// Envoyer un SMS (simulation pour l'instant)
export async function sendSms(options: SmsOptions): Promise<boolean> {
  const normalizedPhone = normalizePhoneNumber(options.to);
  
  try {
    switch (SMS_CONFIG.provider) {
      case 'twilio':
        return await sendViaTwilio(normalizedPhone, options.message);
      
      case 'africas_talking':
        return await sendViaAfricasTalking(normalizedPhone, options.message);
      
      case 'simulation':
      default:
        return await sendSimulation(normalizedPhone, options.message);
    }
  } catch (error: any) {
    console.error(`❌ Erreur envoi SMS à ${normalizedPhone}:`, error.message);
    return false;
  }
}

// Simulation d'envoi SMS (pour développement)
async function sendSimulation(to: string, message: string): Promise<boolean> {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║     📱 SMS SIMULÉ (Mode Dev)         ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║ À: ${to.padEnd(32)}║`);
  console.log('╠══════════════════════════════════════╣');
  console.log(`║ ${message.substring(0, 36).padEnd(36)} ║`);
  if (message.length > 36) {
    console.log(`║ ${message.substring(36, 72).padEnd(36)} ║`);
  }
  console.log('╠══════════════════════════════════════╣');
  console.log('║ ✅ SMS simulé avec succès            ║');
  console.log('╚══════════════════════════════════════╝\n');
  return true;
}

// Envoi via Twilio (décommenter et configurer si nécessaire)
async function sendViaTwilio(to: string, message: string): Promise<boolean> {
  // const twilio = require('twilio');
  // const client = twilio(SMS_CONFIG.twilio.accountSid, SMS_CONFIG.twilio.authToken);
  // 
  // const result = await client.messages.create({
  //   body: message,
  //   from: SMS_CONFIG.twilio.fromNumber,
  //   to: to
  // });
  // 
  // console.log(`✅ SMS Twilio envoyé: ${result.sid}`);
  // return true;
  
  console.log(`⚠️ Twilio non configuré. Simulation pour ${to}`);
  return sendSimulation(to, message);
}

// Envoi via Africa's Talking (décommenter et configurer si nécessaire)
async function sendViaAfricasTalking(to: string, message: string): Promise<boolean> {
  // const AfricasTalking = require('africastalking');
  // const africastalking = AfricasTalking({
  //   apiKey: SMS_CONFIG.africasTalking.apiKey,
  //   username: SMS_CONFIG.africasTalking.username
  // });
  // 
  // const sms = africastalking.SMS;
  // const result = await sms.send({
  //   to: [to],
  //   message: message,
  //   from: SMS_CONFIG.africasTalking.shortCode
  // });
  // 
  // console.log(`✅ SMS Africa's Talking envoyé:`, result);
  // return true;
  
  console.log(`⚠️ Africa's Talking non configuré. Simulation pour ${to}`);
  return sendSimulation(to, message);
}

// SMS de vérification
export async function sendVerificationSms(phone: string, code: string): Promise<boolean> {
  const message = `CCL Beats for Peace: Votre code de vérification est ${code}. Valable 10 minutes.`;
  return sendSms({ to: phone, message });
}

// SMS de confirmation de candidature
export async function sendCandidatureConfirmationSms(phone: string, nomArtiste: string): Promise<boolean> {
  const message = `Félicitations ${nomArtiste}! Votre candidature CCL Beats for Peace a été soumise. Nous vous contacterons bientôt.`;
  return sendSms({ to: phone, message });
}

// SMS de changement de rôle
export async function sendRoleChangeSms(phone: string, roleName: string): Promise<boolean> {
  const message = `CCL Beats for Peace: Votre rôle a été mis à jour vers "${roleName}". Connectez-vous pour accéder à vos nouvelles fonctionnalités.`;
  return sendSms({ to: phone, message });
}

export default {
  sendSms,
  sendVerificationSms,
  sendCandidatureConfirmationSms,
  sendRoleChangeSms
};
