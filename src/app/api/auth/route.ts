import { NextRequest, NextResponse } from 'next/server';
import { DEMO_USERS } from '@/lib/auth-constants';

export async function GET() {
  const safeProfiles = DEMO_USERS.map(({ id, name, email, role, department, hospital, badge }) => ({
    id,
    name,
    email,
    role,
    department,
    hospital,
    badge,
  }));

  return NextResponse.json({
    status: 'ok',
    system: 'ThyroidScreen AI Auth Service',
    demoProfiles: safeProfiles,
  });
}

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const email = typeof body.email === 'string' ? body.email : '';
    const name = typeof body.name === 'string' ? body.name : '';
    const role = typeof body.role === 'string' ? body.role : '';
    const hospital = typeof body.hospital === 'string' ? body.hospital : '';

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check demo users
    const matchedDemo = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (matchedDemo) {
      return NextResponse.json({
        success: true,
        user: matchedDemo,
        token: `jwt_${Date.now()}_${matchedDemo.id}`,
      });
    }

    // Generic clinician profile
    const newUser = {
      id: `usr_${Date.now().toString(36)}`,
      name: name || email.split('@')[0],
      email: email.trim().toLowerCase(),
      role: role || 'Clinical Endocrinologist',
      department: hospital ? `${hospital} Department` : 'Endocrine & Metabolic Unit',
      hospital: hospital || 'Metropolitan Health Center',
      licenseNumber: `MD-${Math.floor(10000 + Math.random() * 90000)}`,
      lastLoginAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      user: newUser,
      token: `jwt_${Date.now()}_${newUser.id}`,
    });
  } catch (error) {
    console.error('Auth API Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
