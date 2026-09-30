import { NextResponse } from 'next/server';
import { otpsStore } from '@/lib/store';

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone || phone.trim().length < 8) {
      return NextResponse.json({ success: false, message: 'Valid mobile number is required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');

    // Generate 6-digit OTP
    // For test convenience, we generate a memorable 6 digit number
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpsStore.set(cleanPhone, {
      code: otp,
      expiresAt,
    });

    console.log(`[AUTH] Generated OTP for ${cleanPhone}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: `Verification code sent to +91 ${cleanPhone.slice(-10)}`,
      testOtp: otp, // Returned for instant testing without paying for SMS carrier
      phone: cleanPhone
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to generate OTP' }, { status: 500 });
  }
}
