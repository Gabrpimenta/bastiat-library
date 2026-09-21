import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { cms } from './cms';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const originFor = (_request: Request) =>
  process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000';

export async function requireUser(request: Request) {
  const payload = await cms();
  const { user } = await payload.auth({ headers: request.headers });
  if (!user) throw new HttpError(401, 'Please sign in to sync your library.');
  return user;
}

export function checkMutationOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const configured = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000';
  if (origin && origin !== configured && origin !== new URL(request.url).origin)
    throw new HttpError(403, 'This request origin is not allowed.');
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new HttpError(415, 'JSON content is required.');
}

export async function readJSON(request: Request): Promise<unknown> {
  const text = await request.text();
  if (text.length > 16384) throw new HttpError(413, 'The request is too large.');
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'The request is not valid JSON.');
  }
}

export async function route(
  work: () => Promise<unknown>,
  privateData = false,
): Promise<NextResponse> {
  try {
    const data = await work();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': privateData ? 'private, no-store' : 'no-cache',
        'X-API-Version': '1',
      },
    });
  } catch (error) {
    if (error instanceof HttpError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status, headers: { 'Cache-Control': 'no-store' } },
      );
    if (error instanceof ZodError)
      return NextResponse.json({ error: 'The request contains invalid fields.' }, { status: 400 });
    console.error(
      JSON.stringify({
        event: 'api.failure',
        name: error instanceof Error ? error.name : 'UnknownError',
      }),
    );
    return NextResponse.json(
      { error: 'The service is temporarily unavailable. Please try again.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
