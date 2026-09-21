import { progressMutationSchema } from '@bastiat/contracts';
import { getContent } from '@/lib/cms';
import {
  route,
  requireUser,
  originFor,
  checkMutationOrigin,
  readJSON,
  HttpError,
} from '@/lib/http';
import { updateProgress } from '@/lib/study-store';
export const POST = (request: Request) =>
  route(async () => {
    checkMutationOrigin(request);
    const user = await requireUser(request);
    const input = progressMutationSchema.parse(await readJSON(request));
    const lesson = await getContent('lesson', input.lessonSlug, originFor(request));
    if (!lesson || lesson.kind !== 'lesson')
      throw new HttpError(404, 'This lesson is not available.');
    if (lesson.asset.version !== input.assetVersion)
      throw new HttpError(
        409,
        'This lesson has a new edition. Refresh it before syncing progress.',
      );
    return updateProgress(user.id, input, lesson.durationSeconds);
  }, true);
