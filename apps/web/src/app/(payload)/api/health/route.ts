import { NextResponse } from 'next/server';
import { cms } from '@/lib/cms';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const payload = await cms();
    await payload.count({ collection: 'courses', overrideAccess: false });
    return NextResponse.json({ status: 'ok', version: '0.1.0' });
  } catch {
    return NextResponse.json({ status: 'unavailable' }, { status: 503 });
  }
}
