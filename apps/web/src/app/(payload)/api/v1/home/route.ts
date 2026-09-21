import { getHome } from '@/lib/cms';
import { route, originFor } from '@/lib/http';
export const dynamic = 'force-dynamic';
export const GET = (request: Request) => route(() => getHome(originFor(request)));
