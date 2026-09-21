'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Headphones,
  LockKeyhole,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Search,
  SlidersHorizontal,
  Volume2,
} from 'lucide-react';
import { contentLabel, durationLabel, timeLabel, type Lesson } from '@bastiat/contracts';
import { api, useApp, useLibrary } from './providers';
import {
  ContentCard,
  EmptyState,
  ErrorState,
  Loading,
  SaveButton,
  SectionHeading,
  contentHref,
} from './content';

export function HomeView() {
  const { data, error, refetch } = useQuery({ queryKey: ['home'], queryFn: () => api.home() });
  const lib = useLibrary();
  const progress = lib
    .entries()
    .filter((item) => !item.value.completed && item.value.positionSeconds > 0)
    .sort((a, b) => b.value.updatedAt.localeCompare(a.value.updatedAt))[0]?.value;
  const resume = data?.featuredCourse?.lessons.find((item) => item.slug === progress?.lessonSlug);
  if (error)
    return (
      <ErrorState
        message={error.message}
        retry={() => {
          void refetch();
        }}
      />
    );
  if (!data)
    return (
      <div className="page-container">
        <div className="hero-skeleton" />
        <Loading />
      </div>
    );
  const course = data.featuredCourse;
  return (
    <div className="page-container home-page">
      <div className="welcome-line">
        <span className="eyebrow">A LITTLE CURIOSITY. A WIDER WORLD.</span>
        <span className="edition">THE FRÉDÉRIC BASTIAT COLLECTION</span>
      </div>
      {resume && progress && (
        <Link href={`/lesson/${resume.slug}`} className="continue-strip">
          <span className="play-circle small">
            <Play size={18} />
          </span>
          <div>
            <span className="eyebrow">CONTINUE LEARNING</span>
            <strong>{resume.title}</strong>
          </div>
          <span>
            {durationLabel(Math.max(0, resume.durationSeconds - progress.positionSeconds))} left
          </span>
          <ArrowRight size={20} />
        </Link>
      )}
      {course && (
        <section className="hero">
          <div className="hero-copy">
            <div className="hero-kicker">
              <span className="tiny-line" /> THE ESSENTIALS COLLECTION
            </div>
            <h1>
              Look beyond
              <br />
              the <em>obvious.</em>
            </h1>
            <p>{course.description}</p>
            <div className="hero-meta">
              <span>
                <BookOpen size={16} />
                {course.lessonCount} lessons
              </span>
              <span>
                <Clock3 size={16} />
                {durationLabel(course.durationSeconds)}
              </span>
              <span>Beginner friendly</span>
            </div>
            <Link href={`/course/${course.slug}`} className="button">
              Explore the course <ArrowRight size={18} />
            </Link>
            <span className="hero-footnote">
              A fresh perspective starts with one good question.
            </span>
          </div>
          <Link href={`/course/${course.slug}`} className="hero-art" aria-label={course.title}>
            <img
              src={course.coverUrl}
              alt="An illuminated arched window, with a fine crack through the glass"
            />
            <div className="art-caption">
              <span>01 / ECONOMICS OF EVERYDAY LIFE</span>
              <strong>
                The Seen
                <br />
                and the Unseen
              </strong>
              <span className="art-arrow">
                <ArrowUpRight size={28} />
              </span>
            </div>
          </Link>
        </section>
      )}
      <div className="topic-strip">
        <span>FOLLOW YOUR CURIOSITY</span>
        {['All ideas', 'Economics', 'Liberty', 'Cooperation'].map((topic, index) => (
          <Link
            key={topic}
            href={`/explore${index ? `?q=${encodeURIComponent(topic === 'Economics' ? 'cost' : topic === 'Liberty' ? 'law' : 'trade')}` : ''}`}
            className={index === 0 ? 'topic active' : 'topic'}
          >
            {topic}
          </Link>
        ))}
      </div>
      {data.sections.map((section) => (
        <section className="editorial-section" key={section.title}>
          <SectionHeading title={section.title} subtitle={section.description} href="/explore" />
          <div className={`cards-grid ${section.items.length === 2 ? 'two' : ''}`}>
            {section.items.map((item) => (
              <ContentCard key={`${item.kind}:${item.slug}`} item={item} />
            ))}
          </div>
        </section>
      ))}
      <section className="quote-panel">
        <span className="quote-mark">“</span>
        <div>
          <p>What does the first glance leave out?</p>
          <span>AN INVITATION TO THINK A LITTLE FURTHER</span>
        </div>
        <Link href="/about" className="text-link">
          Meet the library <ArrowUpRight size={17} />
        </Link>
      </section>
    </div>
  );
}

export function ExploreView({ initialQuery = '' }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const [kind, setKind] = useState('all');
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebounced(query);
      setPage(1);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);
  const { data, error, isFetching, refetch } = useQuery({
    queryKey: ['catalog', debounced, kind, page],
    queryFn: () => api.catalog(debounced, kind, page),
  });
  return (
    <div className="page-container">
      <div className="page-intro">
        <p className="eyebrow">THE COLLECTION</p>
        <h1>Follow a question.</h1>
        <p>Courses, short lessons, and readings for a curious mind.</p>
      </div>
      <div className="search-field">
        <Search size={21} />
        <input
          type="search"
          aria-label="Search the library"
          placeholder="Search ideas, lessons, and readings…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="filters" aria-label="Content format">
        {[
          ['all', 'All content'],
          ['course', 'Courses'],
          ['audio', 'Audio'],
          ['video', 'Video'],
          ['article', 'Readings'],
        ].map(([value, label]) => (
          <button
            key={value}
            className={kind === value ? 'chip active' : 'chip'}
            onClick={() => {
              setKind(value!);
              setPage(1);
            }}
            aria-pressed={kind === value}
          >
            {label}
          </button>
        ))}
        <span className="result-count">
          <SlidersHorizontal size={15} />
          {data?.totalItems ?? '…'} items
        </span>
      </div>
      {error ? (
        <ErrorState
          message={error.message}
          retry={() => {
            void refetch();
          }}
        />
      ) : !data || isFetching ? (
        <Loading />
      ) : data.items.length ? (
        <>
          <div className="cards-grid">
            {data.items.map((item) => (
              <ContentCard item={item} key={`${item.kind}:${item.slug}`} />
            ))}
          </div>
          {data.totalPages > 1 && (
            <div className="pagination">
              <button
                className="button secondary"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span>
                {page} / {data.totalPages}
              </span>
              <button
                className="button secondary"
                disabled={page === data.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title="A different question, perhaps?"
          body="We couldn’t find a match. Try another word or a different format."
        />
      )}
    </div>
  );
}

export function CourseView({ slug }: { slug: string }) {
  const { data, error, refetch } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => api.content('course', slug),
  });
  const lib = useLibrary();
  if (error)
    return (
      <ErrorState
        message={error.message}
        retry={() => {
          void refetch();
        }}
      />
    );
  if (!data)
    return (
      <div className="page-container">
        <Loading cards={1} />
      </div>
    );
  if (data.kind !== 'course') return null;
  const completed = data.lessons.filter(
    (lesson) => lib.progress(lesson.slug)?.value.completed,
  ).length;
  const next =
    data.lessons.find((lesson) => !lib.progress(lesson.slug)?.value.completed) ?? data.lessons[0];
  const hasProgress = data.lessons.some(
    (lesson) => (lib.progress(lesson.slug)?.value.positionSeconds ?? 0) > 0,
  );
  return (
    <div className="page-container">
      <Link href="/explore" className="back-link">
        <ArrowLeft size={17} />
        The collection
      </Link>
      <section className="course-header">
        <div>
          <p className="eyebrow">A GUIDED INTRODUCTION TO FRÉDÉRIC BASTIAT</p>
          <h1>{data.title}</h1>
          <p className="lead">{data.description}</p>
          <div className="hero-meta">
            <span>
              <Headphones size={17} />
              {data.lessonCount} lessons
            </span>
            <span>
              <Clock3 size={17} />
              {durationLabel(data.durationSeconds)}
            </span>
            <span>{data.level}</span>
          </div>
          <div className="action-row">
            {next ? (
              <Link href={`/lesson/${next.slug}`} className="button">
                <Play size={17} />
                {hasProgress ? 'Continue learning' : 'Start learning'}
              </Link>
            ) : (
              <span className="muted">Lessons will appear here when published.</span>
            )}
            <SaveButton item={data} />
          </div>
        </div>
        <img src={data.coverUrl} alt="An illuminated window with a crack in the glass" />
      </section>
      <div className="course-body">
        <section>
          <SectionHeading title="A different way of looking" />
          <div className="prose">
            {data.introduction.split('\n\n').map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="editorial-note">
            <BookOpen size={22} />
            <div>
              <strong>Listen, read, or take your time.</strong>
              <p>
                Every lesson includes a transcript and further reading. Download lessons in the
                mobile app to keep learning offline.
              </p>
            </div>
          </div>
        </section>
        <section className="lesson-panel">
          <div className="section-heading">
            <h2>Your learning path</h2>
            <span>
              {completed}/{data.lessonCount} complete
            </span>
          </div>
          <div className="progress-track">
            <div
              style={{ width: `${data.lessonCount ? (completed / data.lessonCount) * 100 : 0}%` }}
            />
          </div>
          {data.lessons.map((lesson, index) => (
            <Link href={`/lesson/${lesson.slug}`} className="lesson-row" key={lesson.slug}>
              <span className="lesson-number">
                {lib.progress(lesson.slug)?.value.completed ? (
                  <Check size={18} />
                ) : (
                  String(index + 1).padStart(2, '0')
                )}
              </span>
              <div>
                <h3>{lesson.title}</h3>
                <span>{contentLabel(lesson)}</span>
              </div>
              {lesson.format === 'audio' ? <Headphones size={20} /> : <Play size={20} />}
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}

export function LessonView({ slug }: { slug: string }) {
  const { data, error, refetch } = useQuery({
    queryKey: ['lesson', slug],
    queryFn: () => api.content('lesson', slug),
  });
  const app = useApp();
  const lib = useLibrary();
  const [tab, setTab] = useState('transcript');
  const lesson = data?.kind === 'lesson' ? data : null;
  const current = app.player.lesson?.slug === slug;
  const progress = lib.progress(slug);
  const conflict = progress?.conflict;
  if (error)
    return (
      <ErrorState
        message={error.message}
        retry={() => {
          void refetch();
        }}
      />
    );
  if (!lesson)
    return (
      <div className="page-container">
        <Loading cards={1} />
      </div>
    );
  const position = current ? app.player.position : (progress?.value.positionSeconds ?? 0);
  const start = () => {
    void app.play(lesson).catch(() => {});
  };
  return (
    <div className="page-container lesson-page">
      <Link href={`/course/${lesson.courseSlug}`} className="back-link">
        <ArrowLeft size={17} />
        The Seen and the Unseen
      </Link>
      <div className="lesson-layout">
        <section className="player-panel">
          {lesson.format === 'video' && current ? (
            <video
              ref={app.attachVideo}
              playsInline
              controls={false}
              className="video-player"
              aria-label={lesson.title}
            />
          ) : (
            <div className="player-art">
              <img src={lesson.coverUrl} alt="" />
              {lesson.format === 'audio' && (
                <span className="audio-badge">
                  <Headphones size={17} /> AUDIO LESSON
                </span>
              )}
            </div>
          )}
          <div className="player-copy">
            <p className="eyebrow">
              LESSON {String(lesson.order).padStart(2, '0')} · BASTIAT LIBRARY
            </p>
            <h1>{lesson.title}</h1>
            <p>{lesson.description}</p>
            <label className="sr-only" htmlFor="seek">
              Playback position
            </label>
            <input
              id="seek"
              className="seek-slider"
              type="range"
              min="0"
              max={lesson.durationSeconds}
              step="1"
              value={position}
              disabled={!current}
              onChange={(event) => app.seek(Number(event.target.value))}
            />
            <div className="player-times">
              <span>{timeLabel(position)}</span>
              <span>{timeLabel(lesson.durationSeconds)}</span>
            </div>
            <div className="player-controls">
              <button
                className="speed-button"
                disabled={!current}
                onClick={() => app.speed(app.player.speed >= 2 ? 1 : app.player.speed + 0.25)}
                aria-label="Change playback speed"
              >
                {current ? app.player.speed : 1}×
              </button>
              <button
                className="icon-button"
                disabled={!current}
                onClick={() => app.seek(position - 15)}
                aria-label="Back 15 seconds"
              >
                <RotateCcw size={24} />
                <small>15</small>
              </button>
              <button
                className="play-circle"
                onClick={current ? app.toggle : start}
                aria-label={current && app.player.playing ? 'Pause lesson' : 'Play lesson'}
              >
                {current && app.player.playing ? (
                  <Pause size={28} fill="currentColor" />
                ) : (
                  <Play size={28} fill="currentColor" />
                )}
              </button>
              <button
                className="icon-button"
                disabled={!current}
                onClick={() => app.seek(position + 15)}
                aria-label="Forward 15 seconds"
              >
                <RotateCw size={24} />
                <small>15</small>
              </button>
              <SaveButton item={lesson} />
            </div>
            {current && app.player.error && (
              <p role="alert" className="error-text">
                {app.player.error}
              </p>
            )}
            {current && app.player.loading && (
              <p role="status" className="muted">
                Loading your lesson…
              </p>
            )}
            <div className="player-bottom">
              <span>
                <Volume2 size={14} />
                Synthetic narration · Full transcript below
              </span>
              <button
                className="text-link"
                onClick={() => {
                  lib.saveProgress(lesson, position, !progress?.value.completed);
                  void lib.sync();
                }}
              >
                {progress?.value.completed ? <CheckCircle2 size={17} /> : <Check size={17} />}
                {progress?.value.completed ? 'Completed' : 'Mark complete'}
              </button>
            </div>
          </div>
        </section>
        <aside className="lesson-aside">
          <p className="eyebrow">YOUR STUDY SPACE</p>
          <h2>
            A little room
            <br />
            to think.
          </h2>
          <p>
            Follow along, pause on an idea, or return to a passage. Your place is saved as you
            listen.
          </p>
          {!app.user && (
            <Link href="/profile" className="text-link">
              Sign in to sync across devices <ArrowRight size={16} />
            </Link>
          )}
          {conflict && (
            <div className="conflict-panel" role="status">
              <h3>Choose where to continue</h3>
              <p>
                This device: {timeLabel(progress.value.positionSeconds)}. Other session:{' '}
                {timeLabel(conflict.positionSeconds)}.
              </p>
              <button
                className="button secondary"
                onClick={() => lib.resolveConflict(slug, 'local')}
              >
                Use this position
              </button>
              <button
                className="text-link"
                onClick={() => {
                  lib.resolveConflict(slug, 'remote');
                  if (current) app.seek(conflict.positionSeconds);
                }}
              >
                Use other position
              </button>
            </div>
          )}
          <div className="aside-note">
            <ArrowDown size={22} />
            <strong>Going somewhere?</strong>
            <p>The mobile app can keep this lesson ready for offline listening.</p>
          </div>
        </aside>
      </div>
      <section className="transcript-section">
        <div className="filters">
          <button
            className={tab === 'transcript' ? 'chip active' : 'chip'}
            onClick={() => setTab('transcript')}
          >
            Transcript
          </button>
          <button
            className={tab === 'sources' ? 'chip active' : 'chip'}
            onClick={() => setTab('sources')}
          >
            Further reading
          </button>
        </div>
        {tab === 'transcript' ? (
          <div className="prose">
            {lesson.transcript.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <Sources lesson={lesson} />
        )}
      </section>
    </div>
  );
}

function Sources({ lesson }: { lesson: Pick<Lesson, 'sources'> }) {
  return (
    <div className="sources">
      <p>Explore the original arguments and their context.</p>
      {lesson.sources.map((source) => (
        <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
          {source.title}
          <ArrowUpRight size={18} />
        </a>
      ))}
    </div>
  );
}

export function ReadingView({ slug }: { slug: string }) {
  const { data, error, refetch } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => api.content('article', slug),
  });
  if (error)
    return (
      <ErrorState
        message={error.message}
        retry={() => {
          void refetch();
        }}
      />
    );
  if (!data)
    return (
      <div className="page-container">
        <Loading cards={1} />
      </div>
    );
  if (data.kind !== 'article') return null;
  return (
    <article className="page-container reading-page">
      <Link href="/explore" className="back-link">
        <ArrowLeft size={17} />
        The collection
      </Link>
      <header className="reading-header">
        <p className="eyebrow">{data.topic}</p>
        <h1>{data.title}</h1>
        <p className="lead">{data.description}</p>
        <div className="reading-meta">
          <span>
            {data.author} · {data.readingMinutes} min read
          </span>
          <SaveButton item={data} />
        </div>
        <img src={data.coverUrl} alt="" />
      </header>
      <div className="prose">
        {data.body
          .split('\n\n')
          .map((paragraph, index) =>
            paragraph.length < 70 && index !== data.body.split('\n\n').length - 1 ? (
              <h2 key={index}>{paragraph}</h2>
            ) : (
              <p key={index}>{paragraph}</p>
            ),
          )}
      </div>
      <Sources lesson={data} />
    </article>
  );
}

export function LibraryView() {
  const lib = useLibrary();
  const { user } = useApp();
  const [tab, setTab] = useState('progress');
  const targets =
    tab === 'saved'
      ? lib.bookmarks().map((item) => ({ kind: item.targetKind, slug: item.targetSlug }))
      : lib.entries().map((item) => ({ kind: 'lesson', slug: item.value.lessonSlug }));
  const queries = useQueries({
    queries: targets.map(({ kind, slug }) => ({
      queryKey: [kind, slug],
      queryFn: () => api.content(kind, slug),
    })),
  });
  const items = queries.flatMap((query) => (query.data ? [query.data] : []));
  return (
    <div className="page-container">
      <div className="page-intro">
        <p className="eyebrow">YOUR SPACE TO RETURN TO</p>
        <h1>My Library</h1>
        <p>Good ideas deserve a second visit.</p>
      </div>
      {!user && (
        <div className="info-banner">
          <LockKeyhole size={18} />
          <span>Your library is saved in this browser. Sign in to take it to another device.</span>
          <Link href="/profile">
            Sign in <ArrowRight size={15} />
          </Link>
        </div>
      )}
      {lib.syncError && (
        <p className="error-text" role="status">
          {lib.syncError}
        </p>
      )}
      <div className="filters">
        <button
          className={tab === 'progress' ? 'chip active' : 'chip'}
          onClick={() => setTab('progress')}
        >
          In progress
        </button>
        <button
          className={tab === 'saved' ? 'chip active' : 'chip'}
          onClick={() => setTab('saved')}
        >
          Saved for later
        </button>
        <span className="result-count">
          {lib.syncing ? 'Syncing…' : user ? 'Account library' : 'Saved on this device'}
        </span>
      </div>
      {items.length ? (
        <div className="cards-grid">
          {items.map((item) => (
            <div key={`${item.kind}:${item.slug}`}>
              <ContentCard item={item} />
              {item.kind === 'lesson' && tab === 'progress' && (
                <div className="library-progress">
                  <div className="progress-track">
                    <div
                      style={{
                        width: `${Math.min(100, ((lib.progress(item.slug)?.value.positionSeconds ?? 0) / item.durationSeconds) * 100)}%`,
                      }}
                    />
                  </div>
                  <Link href={contentHref(item)}>
                    {lib.progress(item.slug)?.value.completed
                      ? 'Completed · Listen again'
                      : 'Continue learning'}{' '}
                    <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={tab === 'saved' ? 'Keep a good idea close.' : 'Your next idea is waiting.'}
          body={
            tab === 'saved'
              ? 'Save a course, lesson, or reading. You’ll find it right here.'
              : 'Start a lesson and come back here whenever you’re ready to continue.'
          }
        />
      )}
    </div>
  );
}

export function ProfileView() {
  const app = useApp();
  const lib = useLibrary();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await app.login(email, password);
      setPassword('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Sign-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="page-container profile-page">
      <div className="profile-editorial">
        <p className="eyebrow">PICK UP WHERE YOU LEFT OFF</p>
        <h1>
          A library that
          <br />
          moves with you.
        </h1>
        <p>
          Keep your saved readings and your place in every lesson together, across mobile and web.
        </p>
        <img src="/artwork/choice.webp" alt="Two paths branching toward different possibilities" />
      </div>
      <section className="account-panel">
        {app.user && !lib.requiresAuthentication ? (
          <>
            <span className="avatar">
              {app.user.name
                .split(' ')
                .map((part) => part[0])
                .join('')}
            </span>
            <h2>Welcome, {app.user.name.split(' ')[0]}.</h2>
            <p>{app.user.email}</p>
            <div className="account-links">
              <Link href="/library">
                My Library <ArrowRight size={17} />
              </Link>
              <button
                disabled={lib.syncing}
                onClick={() => {
                  void lib.sync();
                }}
              >
                Sync library <span>{lib.syncing ? 'Syncing…' : 'Now'}</span>
              </button>
              <Link href="/privacy">
                Privacy & your data <ArrowUpRight size={17} />
              </Link>
              <Link href="/about">
                About Bastiat Library <ArrowUpRight size={17} />
              </Link>
              {app.user.role === 'editor' && (
                <a href="/admin">
                  Open editorial studio <ArrowUpRight size={17} />
                </a>
              )}
            </div>
            <button
              className="button secondary full"
              onClick={() => {
                setError('');
                void app.logout().catch((error: Error) => setError(error.message));
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <BookOpen className="copper" size={32} strokeWidth={1.3} />
            <h2>Welcome back.</h2>
            <p>
              {lib.requiresAuthentication
                ? 'Your session expired. Sign in again to sync. Your progress is still saved on this device.'
                : 'Sign in to your learning account.'}
            </p>
            <form
              onSubmit={(event) => {
                void submit(event);
              }}
            >
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
              />
              <button className="button full" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'}
                <ArrowRight size={17} />
              </button>
            </form>
            <p className="account-footnote">
              This preview uses accounts provided by the library administrator. You can explore all
              content without signing in.
            </p>
            <Link href="/explore" className="text-link">
              Continue exploring <ArrowRight size={16} />
            </Link>
          </>
        )}
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}

export function InformationView({ privacy = false }: { privacy?: boolean }) {
  return (
    <div className="page-container information-page">
      <Link href="/" className="back-link">
        <ArrowLeft size={17} />
        Back to the library
      </Link>
      <p className="eyebrow">{privacy ? 'YOUR DATA' : 'ABOUT THE PROJECT'}</p>
      <h1>{privacy ? 'A thoughtful approach to privacy.' : 'Ideas worth thinking through.'}</h1>
      <div className="prose">
        {privacy ? (
          <>
            <h2>What we save</h2>
            <p>
              Your account contains your name, email, saved items, and lesson progress. Guest
              progress stays on the device where you create it. Signing in starts a separate
              library; guest history is not silently merged.
            </p>
            <h2>Media and downloads</h2>
            <p>
              Lesson media is public. The mobile app stores requested downloads locally. Personal
              progress is kept separately from these public files.
            </p>
            <h2>Sessions and control</h2>
            <p>
              Signing out revokes the current server session and clears the local account’s learning
              records. Other signed-in devices keep their own sessions. An internet connection is
              needed to confirm sign-out. Ask the library administrator to delete an account and its
              server records.
            </p>
            <h2>No advertising profiles</h2>
            <p>
              This preview has no advertising trackers or third-party analytics. Operational logs
              record technical failures and performance events without lesson transcripts,
              passwords, or tokens.
            </p>
          </>
        ) : (
          <>
            <p>
              Bastiat Library is an independent learning project exploring selected ideas of
              Frédéric Bastiat through short lessons and readings.
            </p>
            <h2>Read with curiosity.</h2>
            <p>
              The material is an original editorial introduction. It offers arguments to examine,
              not a test of agreement. Frédéric Bastiat’s economic and political thought is distinct
              from Ayn Rand’s Objectivism; this project is not affiliated with the Ayn Rand
              Institute.
            </p>
            <h2>Clear about its sources.</h2>
            <p>
              Lessons include complete transcripts and further reading. Narration is synthetic and
              identified as such. The illustrations are original. No historical recording or
              author’s voice is being simulated.
            </p>
            <h2>Made for a little time well spent.</h2>
            <p>
              Listen to one idea, read a passage again, and return when you have a new question. The
              mobile app adds background audio and offline downloads to the shared learning
              experience.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
