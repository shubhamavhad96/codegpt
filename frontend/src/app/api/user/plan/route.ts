import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    console.log("API /api/user/plan called");
    const { userId } = getAuth(req);
    if (!userId) {
      console.log("No userId found");
      return NextResponse.json({ isPro: false }, { status: 401 });
    }

    const response = await fetch('http://localhost:4000/api/user/plan', {
      headers: {
        'Authorization': `Bearer ${await getAuth(req).getToken()}`
      }
    });

    if (!response.ok) {
      console.log("Backend returned error", response.status);
      throw new Error('Failed to fetch user plan');
    }

    const data = await response.json();
    return NextResponse.json({ plan: data.plan, isPro: data.isPro, userId: data.userId });
  } catch (error) {
    console.error('User plan error:', error);
    return NextResponse.json({ isPro: false }, { status: 500 });
  }
} 