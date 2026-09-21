import { route, requireUser } from '@/lib/http';
import { getLibrary } from '@/lib/study-store';
export const dynamic = 'force-dynamic';
export const GET = (request: Request) =>
  route(async () => getLibrary((await requireUser(request)).id), true);
