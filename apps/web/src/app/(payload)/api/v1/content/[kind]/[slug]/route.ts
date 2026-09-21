import { slugSchema } from '@bastiat/contracts';
import { getContent } from '@/lib/cms';
import { route, originFor, HttpError } from '@/lib/http';
export const dynamic = 'force-dynamic';
export const GET = (
  request: Request,
  context: { params: Promise<{ kind: string; slug: string }> },
) =>
  route(async () => {
    const { kind, slug } = await context.params;
    const content = await getContent(kind, slugSchema.parse(slug), originFor(request));
    if (!content) throw new HttpError(404, 'This content is not available.');
    return content;
  });
