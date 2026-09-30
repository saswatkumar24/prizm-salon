import { NextResponse } from 'next/server';
import { otpsStore, usersStore } from '@/lib/store';
import { UserProfile } from '@/types';

export async function POST(req: Request) {
  try {
    const { phone, otp, firstName, lastName } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ success: false, error: 'Phone and OTP are required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const record = otpsStore.get(cleanPhone);

    // Accept real generated OTP, universal test OTP '123456', or staff PINs '7894'/'7981'
    const isStaffPin = (cleanPhone.endsWith('7894376562') && otp === '7894') ||
                       (cleanPhone.endsWith('7981262237') && otp === '7981');

    const isValid = isStaffPin || (record && record.code === otp && Date.now() <= record.expiresAt) || otp === '123456';

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid or expired OTP code' }, { status: 401 });
    }

    // Role-based determination
    const isManager = cleanPhone.endsWith('7894376562');
    const isStylist = cleanPhone.endsWith('7981262237');
    const role: 'manager' | 'stylist' | 'customer' = isManager ? 'manager' : isStylist ? 'stylist' : 'customer';

    // Check if user already exists
    let user = usersStore.get(cleanPhone);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = {
        id: 'usr_' + cleanPhone.slice(-6),
        firstName: firstName || (isManager ? 'Studio' : isStylist ? 'Swagat' : ''),
        lastName: lastName || (isManager ? 'Manager' : isStylist ? 'Master Stylist' : ''),
        phone: '+91 ' + cleanPhone.slice(-10),
        role,
        loginMethod: isStaffPin ? 'staff_pin' : 'phone_otp',
      };
      usersStore.set(cleanPhone, user);
    } else {
      user.role = role;
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      usersStore.set(cleanPhone, user);
    }

    // Clear used OTP
    otpsStore.delete(cleanPhone);

    return NextResponse.json({
      success: true,
      user,
      isNewUser: isNewUser && (!user.firstName || !user.lastName),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
