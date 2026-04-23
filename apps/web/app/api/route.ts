import { NextResponse } from 'next/server';

export async function GET() {
  const internalUrl = process.env.INTERNAL_API_URL || 'http://api:4000';
  
  try {
    const res = await fetch(internalUrl);
    const text = await res.text();
    return NextResponse.json({ 
      status: 'API Bridge Healthy', 
      backendResponse: text,
      backendStatus: res.status 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'API Bridge Error', 
      error: error.message,
      target: internalUrl
    }, { status: 502 });
  }
}
