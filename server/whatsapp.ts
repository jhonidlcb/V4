
import twilio from 'twilio';
import { db } from './db';
import { twilioConfig, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

let twilioClient: any = null;
let currentConfig: any = null;

// Función para cargar configuración de Twilio desde la base de datos
export async function loadTwilioConfig() {
  try {
    const configs = await db.select().from(twilioConfig).limit(1);
    
    if (configs.length > 0) {
      currentConfig = configs[0];
      
      if (currentConfig.accountSid && currentConfig.authToken) {
        twilioClient = twilio(currentConfig.accountSid, currentConfig.authToken);
        console.log('✅ Twilio configurado correctamente desde BD');
        return currentConfig;
      }
    }
    
    console.log('⚠️ Twilio no configurado en la base de datos');
    return null;
  } catch (error) {
    console.error('❌ Error cargando configuración de Twilio:', error);
    return null;
  }
}

// Función para obtener configuración actual
export async function getTwilioConfig() {
  const configs = await db.select().from(twilioConfig).limit(1);
  return configs.length > 0 ? configs[0] : null;
}

// Función para actualizar configuración
export async function updateTwilioConfig(config: {
  accountSid?: string;
  authToken?: string;
  whatsappNumber?: string;
  isProduction?: boolean;
}) {
  try {
    const configs = await db.select().from(twilioConfig).limit(1);
    
    if (configs.length > 0) {
      // Actualizar configuración existente
      await db.update(twilioConfig)
        .set({
          ...config,
          updatedAt: new Date(),
        })
        .where(eq(twilioConfig.id, configs[0].id));
    } else {
      // Crear nueva configuración
      await db.insert(twilioConfig).values({
        accountSid: config.accountSid || '',
        authToken: config.authToken || '',
        whatsappNumber: config.whatsappNumber || '',
        isProduction: config.isProduction || false,
      });
    }

    // Recargar cliente de Twilio
    await loadTwilioConfig();
    
    return true;
  } catch (error) {
    console.error('❌ Error actualizando configuración de Twilio:', error);
    throw error;
  }
}

export interface WhatsAppMessage {
  to: string; // Número de teléfono con código de país (+595...)
  message: string;
  mediaUrl?: string; // Para imágenes o documentos
}

export async function sendWhatsAppMessage({ to, message, mediaUrl }: WhatsAppMessage) {
  // Asegurar que tenemos la configuración más reciente
  if (!twilioClient || !currentConfig) {
    await loadTwilioConfig();
  }

  if (!twilioClient || !currentConfig?.whatsappNumber) {
    console.error('❌ Twilio no configurado. Verifica la configuración en el dashboard de admin.');
    throw new Error('WhatsApp no configurado');
  }

  try {
    console.log(`📱 Enviando WhatsApp a ${to}:`, message);

    const messageData: any = {
      from: `whatsapp:${currentConfig.whatsappNumber}`,
      to: `whatsapp:${to}`,
      body: message,
    };

    if (mediaUrl) {
      messageData.mediaUrl = [mediaUrl];
    }

    const result = await twilioClient.messages.create(messageData);
    
    console.log(`✅ WhatsApp enviado exitosamente:`, result.sid);
    return result;
  } catch (error) {
    console.error(`❌ Error enviando WhatsApp a ${to}:`, error);
    throw error;
  }
}

// Templates específicos para diferentes tipos de notificaciones
export const whatsappTemplates = {
  newTicketResponse: (userName: string, ticketNumber: string, link: string) => 
    `🎫 Hola ${userName}!

Tienes una nueva respuesta en tu ticket #${ticketNumber.toString().padStart(3, '0')}.

👆 Revisa tu panel aquí: ${link}

Equipo de Soporte - SoftwarePar`,

  projectUpdate: (userName: string, projectName: string, link: string) => 
    `📋 ¡Hola ${userName}!

El administrador envió un mensaje importante sobre tu proyecto:
"${projectName}"

📱 Revisa tu panel para ver los detalles: ${link}

Equipo SoftwarePar`,

  paymentReminder: (userName: string, stageName: string, amount: string, link: string) => 
    `💰 ¡Hola ${userName}!

📌 RECORDATORIO DE PAGO
${stageName} está lista para procesar.

💵 Monto: $${amount}
🔗 Continuar pago: ${link}

¡Tu proyecto avanza con cada etapa completada!

Equipo SoftwarePar`,

  projectCreated: (userName: string, projectName: string, link: string) => 
    `🚀 ¡Felicitaciones ${userName}!

Tu proyecto "${projectName}" fue creado exitosamente y está siendo revisado por nuestro equipo.

📊 Seguimiento en tiempo real: ${link}

¡Gracias por confiar en SoftwarePar!`,

  newMessage: (userName: string, senderName: string, projectName: string, link: string) => 
    `💬 ¡Hola ${userName}!

${senderName} te envió un mensaje en tu proyecto:
"${projectName}"

💡 Responde rápidamente para mantener el progreso: ${link}

Equipo SoftwarePar`,

  budgetNegotiation: (userName: string, projectName: string, amount: string, isCounter: boolean, link: string) => 
    `💵 ¡Hola ${userName}!

${isCounter ? '🔄 Contraoferta recibida' : '💰 Nueva propuesta de presupuesto'}

📋 Proyecto: "${projectName}"
💰 Precio: $${amount}

👆 Revisar y responder: ${link}

Equipo SoftwarePar`,

  ticketCreated: (userName: string, ticketTitle: string, link: string) => 
    `🎫 ¡Hola ${userName}!

Tu ticket de soporte fue creado exitosamente:
"${ticketTitle}"

⏱️ Nuestro equipo responderá en las próximas 24 horas.

📱 Seguimiento: ${link}

Equipo de Soporte - SoftwarePar`,

  paymentSuccess: (userName: string, projectName: string, amount: string, link: string) => 
    `✅ ¡Pago confirmado ${userName}!

💰 $${amount} recibido para "${projectName}"

🚀 Tu proyecto continúa avanzando.

📊 Ver progreso: ${link}

¡Gracias por tu confianza!

Equipo SoftwarePar`,
};

// Función para obtener número de WhatsApp del usuario
export async function getUserWhatsAppNumber(userId: number): Promise<string | null> {
  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return user.length > 0 ? user[0].whatsappNumber : null;
  } catch (error) {
    console.error('Error getting user WhatsApp number:', error);
    return null;
  }
}

// Función para validar número de WhatsApp
export function validateWhatsAppNumber(phoneNumber: string): boolean {
  // Validar formato: debe empezar con + y tener entre 8 y 15 dígitos
  const whatsappRegex = /^\+[1-9]\d{1,14}$/;
  return whatsappRegex.test(phoneNumber);
}

// Función para formatear número de WhatsApp
export function formatWhatsAppNumber(phoneNumber: string): string {
  // Remover espacios y caracteres especiales, excepto +
  let formatted = phoneNumber.replace(/[^\d+]/g, '');
  
  // Agregar + al inicio si no lo tiene
  if (!formatted.startsWith('+')) {
    formatted = '+' + formatted;
  }
  
  return formatted;
}

// Función para enviar múltiples mensajes de WhatsApp (batch)
export async function sendBatchWhatsAppMessages(messages: WhatsAppMessage[]): Promise<any[]> {
  const results = [];
  
  for (const message of messages) {
    try {
      const result = await sendWhatsAppMessage(message);
      results.push({ success: true, result, message: message.to });
    } catch (error) {
      console.error(`Error enviando WhatsApp a ${message.to}:`, error);
      results.push({ success: false, error, message: message.to });
    }
    
    // Pequeña pausa entre mensajes para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// Inicializar configuración al importar (non-blocking)
loadTwilioConfig()
  .then(() => console.log('✅ Twilio configurado correctamente desde BD'))
  .catch(() => console.log('⚠️ Twilio no configurado en la base de datos'));
