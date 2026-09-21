import { z } from 'zod';
import { getCatalog } from '@/lib/cms';
import { route, originFor } from '@/lib/http';
export const dynamic = 'force-dynamic';
export const GET = (request: Request) =>
  route(async () => {
    const params = new URL(request.url).searchParams;
    const input = z
      .object({
        q: z.string().max(100),
        kind: z.enum(['all', 'course', 'article', 'audio', 'video']),
        page: z.coerce.number().int().min(1).max(1000),
      })
      .parse({
        q: params.get('q') ?? '',
        kind: params.get('kind') ?? 'all',
        page: params.get('page') ?? 1,
      });
    return getCatalog(originFor(request), input.q, input.kind, input.page);
  });
