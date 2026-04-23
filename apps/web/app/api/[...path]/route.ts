import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  return handleRequest(request, params.path);
}

export async function POST(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  return handleRequest(request, params.path);
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  return handleRequest(request, params.path);
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  return handleRequest(request, params.path);
}

async function handleRequest(request: NextRequest, pathParts: string[]) {
  const path = pathParts.join('/');
  const internalUrl = process.env.INTERNAL_API_URL || 'http://api:4000';
  const targetUrl = `${internalUrl}/${path}${request.nextUrl.search}`;

  console.log(`[Proxy] ${request.method} ${request.nextUrl.pathname} -> ${targetUrl}`);

  try {
    const body = ['POST', 'PATCH', 'PUT'].includes(request.method) 
      ? await request.arrayBuffer() 
      : undefined;

    const headers = new Headers(request.headers);
    headers.delete('host'); // Let fetch set the correct host header for the internal network
    headers.set('Connection', 'keep-alive');

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: body,
      cache: 'no-store',
    });

    const data = await response.arrayBuffer();
    
    console.log(`[Proxy] Response from ${targetUrl}: ${response.status}`);

    const responseHeaders = new Headers(response.headers);
    // Remove headers that might cause issues when forwarded
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('transfer-encoding');

    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`[Proxy] Error fetching from ${targetUrl}:`, error);
    return NextResponse.json(
      { message: 'Internal API Gateway Error', error: error.message },
      { status: 502 }
    );
  }
}
