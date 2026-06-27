import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import cloudinary from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder:         'qcargo/staff',
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  });

  return NextResponse.json({ url: result.secure_url });
}
