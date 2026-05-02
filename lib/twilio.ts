import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Format phone number for Somalia (+252) and others
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const withoutLeadingZero = cleaned.startsWith('0') ? cleaned.substring(1) : cleaned;
  
  if (cleaned.startsWith('252')) return `+${cleaned}`;
  
  // Somalia common prefixes
  if (/^(63|61|90|71|77|88|92|93|94|95|96|97|98|99)/.test(withoutLeadingZero)) {
    return `+252${withoutLeadingZero}`;
  }
  
  return `+${cleaned}`;
};

export const sendWhatsApp = async (to: string, message: string) => {
  if (!client || !whatsappFrom) {
    console.error('Twilio not configured');
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    const formattedTo = `whatsapp:${formatPhoneNumber(to)}`;
    const response = await client.messages.create({
      body: message,
      from: whatsappFrom,
      to: formattedTo,
    });
    return { success: true, sid: response.sid };
  } catch (error: any) {
    console.error('WhatsApp Error:', error.message);
    return { success: false, error: error.message };
  }
};

export const replacePlaceholders = (template: string, data: any) => {
  let msg = template;
  Object.keys(data).forEach(key => {
    msg = msg.replace(new RegExp(`{${key}}`, 'g'), data[key] || '');
  });
  return msg;
};
