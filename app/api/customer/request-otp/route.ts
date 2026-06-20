import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import CustomerOtp from '@/lib/models/CustomerOtp';
import Customer from '@/lib/models/Customer';
import { sendWhatsAppMessage, formatSomaliaWhatsAppPhone } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { phone } = await request.json();
  if (!phone) return NextResponse.json({ error: 'Phone number required' }, { status: 400 });

  const fmt = formatSomaliaWhatsAppPhone(phone);
  if (!fmt.ok) return NextResponse.json({ error: fmt.error }, { status: 400 });

  await connectDB();

  // Check customer exists — flexible match: strip non-digits and compare last 9 digits
  const last9 = fmt.phone.slice(-9);
  const allCustomers = await Customer.find({}).lean();
  const customer = allCustomers.find(
    (c: { phone?: string }) => (c.phone || '').replace(/\D/g, '').endsWith(last9)
  );
  if (!customer) {
    return NextResponse.json({ error: 'No account found for this number. Contact our office.' }, { status: 404 });
  }

  // Generate 6-digit OTP
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Upsert OTP (replace any existing)
  await CustomerOtp.findOneAndUpdate(
    { phone: fmt.phone },
    { code, expiresAt },
    { upsert: true }
  );

  // Send via WhatsApp
  const msg = `Your Q Cargo verification code is: *${code}*\n\nValid for 10 minutes. Do not share this code.`;
  const sent = await sendWhatsAppMessage(fmt.phone, msg);

  if (!sent.success) {
    return NextResponse.json({ error: 'Failed to send OTP. Try again or contact office.' }, { status: 502 });
  }

  return NextResponse.json({ success: true, hint: `Code sent to WhatsApp ending in ${fmt.phone.slice(-4)}` });
}
