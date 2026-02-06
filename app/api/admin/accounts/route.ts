import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      _count: {
        select: {
          projects: true,
          validationRuns: true,
        },
      },
    },
  });

  return NextResponse.json(users);
}
