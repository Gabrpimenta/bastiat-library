import { bookmarkMutationSchema } from '@bastiat/contracts';
import { getContent } from '@/lib/cms';
import {
  route,
  requireUser,
  originFor,
  checkMutationOrigin,
  readJSON,
  HttpError,
} from '@/lib/http';
import { updateBookmark } from '@/lib/study-store';
export const POST = (request: Request) =>
  route(async () => {
    checkMutationOrigin(request);
    const user = await requireUser(request);
    const input = bookmarkMutationSchema.parse(await readJSON(request));
    if (!(await getContent(input.targetKind, input.targetSlug, originFor(request))))
      throw new HttpError(404, 'This content is not available.');
    return updateBookmark(user.id, input);
  }, true);
