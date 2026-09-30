import { NextResponse } from 'next/server';

const GATEWAY_URL = 'http://127.0.0.1:3001';

export async function GET() {
  try {
    const res = await fetch(`${GATEWAY_URL}/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({
        success: false,
        isGatewayRunning: false,
        isConnected: false,
        error: `Gateway returned status ${res.status}`,
      });
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      isGatewayRunning: true,
      isConnected: data.isConnected,
      phone: data.phone,
      qrCode: data.qrCode,
    });
  } catch (error: any) {
    console.error('[/api/whatsapp/gateway error]', error);
    return NextResponse.json({
      success: true,
      isGatewayRunning: false,
      isConnected: false,
      message: error?.message || 'Gateway process is not currently listening on port 3001',
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, phone, message } = body;

    if (action === 'reset') {
      const res = await fetch(`${GATEWAY_URL}/reset`, { method: 'POST' });
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === 'test_send') {
      if (!phone || !message) {
        return NextResponse.json({ success: false, error: 'Phone and message are required' }, { status: 400 });
      }

      const res = await fetch(`${GATEWAY_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message }),
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Gateway communication failed' }, { status: 500 });
  }
}
