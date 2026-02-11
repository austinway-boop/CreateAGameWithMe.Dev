import { NextResponse } from 'next/server';

const LOUDLY_API_KEY = process.env.LOUDLY_API_KEY;

export async function GET() {
  if (!LOUDLY_API_KEY) {
    return NextResponse.json({ error: 'LOUDLY_API_KEY not configured' }, { status: 500 });
  }

  try {
    const res = await fetch('https://soundtracks.loudly.com/api/ai/genres', {
      headers: {
        'API-KEY': LOUDLY_API_KEY,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch genres' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Genres API error:', error);
    return NextResponse.json({ error: 'Failed to fetch genres' }, { status: 500 });
  }
}
