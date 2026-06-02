import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { connectDB } from '@/lib/mongoose';
import CustomerOtp from '@/lib/models/CustomerOtp';
import Customer from '@/lib/models/Customer';
import { formatSomaliaWhatsAppPhone } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { phone, code } = await request.json();
  if (!phone || !code) return NextResponse.json({ error: 'Phone and code required' }, { status: 400 });

  const fmt = formatSomaliaWhatsAppPhone(phone);
  if (!fmt.ok) return NextResponse.json({ error: fmt.error }, { status: 400 });

  await connectDB();

  const otp = await CustomerOtp.findOne({ phone: fmt.phone });
  if (!otp) return NextResponse.json({ error: 'No OTP found — request a new one' }, { status: 400 });
  if (otp.code !== String(code).trim()) return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
  if (otp.expiresAt < new Date()) return NextResponse.json({ error: 'Code expired — request a new one' }, { status: 400 });

  // Delete used OTP
  await CustomerOtp.deleteOne({ _id: otp._id });

  // Find customer
  const customer = await Customer.findOne({ phone: { $regex: fmt.phone.slice(-9) } });
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  // Sign JWT
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me');
  const token = await new SignJWT({ sub: String(customer._id), phone: fmt.phone, name: customer.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);

  return NextResponse.json({ token, name: customer.name });
}
