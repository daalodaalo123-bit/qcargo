import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '../../../../lib/whatsapp';

export async function GET() {
  try {
    const testNumber = '252634845067'; // User's phone number
    const testMessage = 'Asc, tani waa tijaabo ka socota Q Cargo. Nidaamkaaga WhatsApp-ka ee WAWP wuxuu u shaqaynayaa si fiican! 🚀 Orange-themed dashboard has been successfully integrated!';

    const result = await sendWhatsAppMessage(testNumber, testMessage);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        message: 'Could not send test WhatsApp message. Please check WAWP status and credentials.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Test WhatsApp message sent successfully to +252634845067!'
    });
  } catch (error: any) {
    console.error('Error inside /api/whatsapp/test:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}
