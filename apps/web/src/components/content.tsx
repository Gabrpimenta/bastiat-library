'use client';
import Link from 'next/link';
import { ArrowRight, Bookmark, Check, Headphones, Play, RefreshCw } from 'lucide-react';
import { contentLabel, type Content } from '@bastiat/contracts';
import { useLibrary } from './providers';

export const contentHref = (item: Content) =>
  `/${item.kind === 'article' ? 'reading' : item.kind}/${item.slug}`;
export function SaveButton({ item }: { item: Content }) {
  const lib = useLibrary();
  const saved = lib.isSaved(item);
  return (
    <button
      className={`save-button ${saved ? 'saved' : ''}`}
      onClick={() => lib.toggleBookmark(item)}
      aria-label={`${saved ? 'Unsave' : 'Save'} ${item.title}`}
      aria-pressed={saved}
    >
      {saved ? <Check size={19} /> : <Bookmark size={19} />}
    </button>
  );
}
export function ContentCard({ item, compact = false }: { item: Content; compact?: boolean }) {
  return (
    <article className={`content-card ${compact ? 'compact' : ''}`}>
      <Link href={contentHref(item)} className="card-art">
        <img src={item.coverUrl} alt="" />
        <span className="art-badge">
          {item.kind === 'lesson' ? (
            item.format === 'audio' ? (
              <Headphones size={13} />
            ) : (
              <Play size={13} />
            )
          ) : null}
          {item.kind === 'article'
            ? 'READING'
            : item.kind === 'course'
              ? 'COURSE'
              : item.format.toUpperCase()}
        </span>
      </Link>
      <div className="card-copy">
        <p className="eyebrow">{item.topic}</p>
        <Link href={contentHref(item)}>
          <h3>{item.title}</h3>
        </Link>
        <p className="card-description">{item.description}</p>
        <div className="card-meta">
          <span>{contentLabel(item)}</span>
          <SaveButton item={item} />
        </div>
      </div>
    </article>
  );
}
export function SectionHeading({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle?: string;
  href?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="text-link">
          Explore all <ArrowRight size={17} />
        </Link>
      )}
    </div>
  );
}
export function Loading({ cards = 3 }: { cards?: number }) {
  return (
    <div className="cards-grid" role="status" aria-label="Loading content">
      {Array.from({ length: cards }, (_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton-art" />
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
      ))}
    </div>
  );
}
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="empty-state" role="alert">
      <RefreshCw size={32} />
      <h2>Let’s try that again</h2>
      <p>{message}</p>
      {retry && (
        <button className="button" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <Bookmark size={34} strokeWidth={1.3} />
      <h2>{title}</h2>
      <p>{body}</p>
      <Link href="/explore" className="button">
        Explore the library <ArrowRight size={17} />
      </Link>
    </div>
  );
}
