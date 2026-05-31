export function normalizePhone(rawPhone: string): string {
  // 1. Remove all non-digit characters
  let phone = rawPhone.trim().replace(/\D/g, '');

  // 2. Normalize based on common Somali formats
  if (phone.startsWith('0')) {
    phone = '252' + phone.substring(1);
  } else if (phone.length === 7) {
    // Standard Telesom 7-digit number, e.g., 7231015 -> 252637231015
    phone = '25263' + phone;
  } else if (phone.length === 9 && (phone.startsWith('63') || phone.startsWith('65') || phone.startsWith('7')) || phone.startsWith('9')) {
    // 9-digit number without country code, e.g., 637231015 -> 252637231015
    phone = '252' + phone;
  }

  // 3. Ensure it has the country code prefix if it starts with 6 or 7
  if (phone.startsWith('63') || phone.startsWith('65') || phone.startsWith('7')) {
    phone = '252' + phone;
  }

  return phone;
}

export async function sendWhatsAppMessage(to: string, message: string) {
  const instanceId = process.env.WAWP_INSTANCE_ID;
  const accessToken = process.env.WAWP_ACCESS_TOKEN;

  if (!instanceId || !accessToken) {
    console.error('WAWP credentials missing in environment');
    return { success: false, error: 'WAWP credentials missing in environment' };
  }

  const cleanPhone = normalizePhone(to);
  const chatId = `${cleanPhone}@c.us`;

  console.log(`Sending WhatsApp message to ${chatId} via WAWP instance ${instanceId}`);

  try {
    const response = await fetch('https://api.wawp.net/v2/send/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instance_id: instanceId,
        access_token: accessToken,
        chatId: chatId,
        message: message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('WAWP API Error response:', data);
      return { 
        success: false, 
        error: data.message || data.error || 'Failed to send message via WAWP API' 
      };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Failed to communicate with WAWP API:', error);
    return { success: false, error: error.message || 'Network error' };
  }
}
