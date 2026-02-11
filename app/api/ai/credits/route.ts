import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserCredits } from '@/lib/credits';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const credits = await getUserCredits(session.user.id);
    return NextResponse.json(credits);
  } catch (error) {
    console.error('Credits API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
