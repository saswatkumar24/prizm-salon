import { NextResponse } from 'next/server';
import { STAFF_ACCOUNTS } from '@/lib/data';
import { UserProfile } from '@/types';

export async function POST(req: Request) {
  try {
    const { userId, password } = await req.json();

    if (!userId || !password) {
      return NextResponse.json(
        { success: false, error: 'User ID and password are required' },
        { status: 400 }
      );
    }

    const cleanId = userId.trim().toLowerCase();
    const account = STAFF_ACCOUNTS.find(
      (acc) => acc.userId.toLowerCase() === cleanId && acc.password === password
    );

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid User ID or Password. Please check your credentials.',
        },
        { status: 401 }
      );
    }

    const user: UserProfile = {
      id: `usr_staff_${account.userId}`,
      userId: account.userId,
      firstName: account.name.split(' ')[0],
      lastName: account.name.split(' ').slice(1).join(' ') || (account.role === 'manager' ? 'Desk' : 'Stylist'),
      phone: `+91 ${account.phone.slice(-10)}`,
      role: account.role,
      stylistId: account.stylistId,
      loginMethod: 'staff_password',
    };

    return NextResponse.json({
      success: true,
      user,
      message: `Welcome back, ${account.name}! Access granted to ${account.role === 'manager' ? 'Studio Management' : 'Stylist Portal'}.`,
    });
  } catch (error) {
    console.error('Staff login error', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
