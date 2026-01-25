import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { username, onboardingComplete } = await request.json();

    // Validate username if provided
    if (username !== undefined) {
      if (typeof username !== 'string') {
        return NextResponse.json(
          { message: 'Username must be a string' },
          { status: 400 }
        );
      }

      // Username validation rules
      const trimmedUsername = username.trim();
      
      if (trimmedUsername.length < 3) {
        return NextResponse.json(
          { message: 'Username must be at least 3 characters' },
          { status: 400 }
        );
      }

      if (trimmedUsername.length > 20) {
        return NextResponse.json(
          { message: 'Username must be 20 characters or less' },
          { status: 400 }
        );
      }

      // Only allow alphanumeric characters and underscores
      if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
        return NextResponse.json(
          { message: 'Username can only contain letters, numbers, and underscores' },
          { status: 400 }
        );
      }

      // Check if username is already taken (by another user)
      const existingUser = await prisma.user.findUnique({
        where: { username: trimmedUsername },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { message: 'Username is already taken' },
          { status: 409 }
        );
      }
    }

    // Build update data
    const updateData: { username?: string; onboardingComplete?: boolean } = {};
    
    if (username !== undefined) {
      updateData.username = username.trim();
    }
    
    if (onboardingComplete !== undefined) {
      updateData.onboardingComplete = Boolean(onboardingComplete);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({
      id: updatedUser.id,
      username: updatedUser.username,
      onboardingComplete: updatedUser.onboardingComplete,
    });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check username availability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('checkUsername');

    if (!username) {
      return NextResponse.json(
        { message: 'Username parameter required' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { username: username.trim() },
    });

    return NextResponse.json({
      available: !existingUser,
    });
  } catch (error) {
    console.error('Username check error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
