import { KokoroTTS } from 'kokoro-js';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';

const editorial = JSON.parse(await readFile('content/editorial.json', 'utf8'));
await mkdir('content/media', { recursive: true });
await mkdir('.local/tts', { recursive: true });
const ffmpeg = process.env.FFMPEG_PATH ?? 'ffmpeg';
const ffprobe = process.env.FFPROBE_PATH ?? 'ffprobe';
const exists = async (file) => {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
};
const duration = (file) =>
  Number(
    execFileSync(
      ffprobe,
      ['-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', file],
      { encoding: 'utf8' },
    ).trim(),
  );
let tts;
const manifest = [];
for (const lesson of editorial.lessons) {
  const wavFile = `.local/tts/${lesson.slug}.wav`;
  if (!(await exists(wavFile))) {
    tts ??= await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
      dtype: 'q8',
      device: 'cpu',
      cache_dir: '.local/tts/model',
    });
    const parts = [];
    for (let i = 0; i < lesson.paragraphs.length; i++) {
      const file = path.resolve(`.local/tts/${lesson.slug}-${i}.wav`);
      if (!(await exists(file))) {
        const audio = await tts.generate(lesson.paragraphs[i], { voice: 'af_heart', speed: 0.96 });
        await audio.save(file);
      }
      parts.push(`file '${file}'`);
      console.log(`${lesson.slug}: paragraph ${i + 1}/${lesson.paragraphs.length}`);
    }
    const listFile = `.local/tts/${lesson.slug}.txt`;
    await writeFile(listFile, parts.join('\n'));
    execFileSync(ffmpeg, [
      '-loglevel',
      'error',
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listFile,
      '-c',
      'copy',
      wavFile,
    ]);
  }
  const extension = lesson.format === 'video' ? 'mp4' : 'mp3';
  const file = `content/media/${lesson.slug}.${extension}`;
  if (!(await exists(file))) {
    if (lesson.format === 'audio')
      execFileSync(ffmpeg, [
        '-loglevel',
        'error',
        '-y',
        '-i',
        wavFile,
        '-codec:a',
        'libmp3lame',
        '-b:a',
        '96k',
        file,
      ]);
    else {
      const slides = lesson.paragraphs.map(
        (_, i) =>
          `file '${path.resolve(`apps/web/public/artwork/${['window', 'choice', 'trade', 'law'][i % 4]}.png`)}'\nduration ${duration(`.local/tts/${lesson.slug}-${i}.wav`)}`,
      );
      slides.push(`file '${path.resolve('apps/web/public/artwork/choice.png')}'`);
      const slidesFile = `.local/tts/${lesson.slug}-slides.txt`;
      await writeFile(slidesFile, slides.join('\n'));
      execFileSync(ffmpeg, [
        '-loglevel',
        'error',
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        slidesFile,
        '-i',
        wavFile,
        '-vf',
        'scale=1280:880,format=yuv420p',
        '-r',
        '12',
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-crf',
        '28',
        '-c:a',
        'aac',
        '-b:a',
        '96k',
        '-shortest',
        '-movflags',
        '+faststart',
        file,
      ]);
    }
  }
  const bytes = await readFile(file);
  manifest.push({
    slug: lesson.slug,
    filename: path.basename(file),
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    durationSeconds: duration(file),
    version: '1',
    mimeType: lesson.format === 'video' ? 'video/mp4' : 'audio/mpeg',
  });
  console.log(`Ready: ${file}`);
}
await writeFile('content/media/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log('Media manifest written with measured durations and SHA-256 checksums.');
