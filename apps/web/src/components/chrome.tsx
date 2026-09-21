'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUpRight,
  BookOpen,
  Compass,
  Home,
  Library,
  Pause,
  Play,
  Search,
  User,
  X,
} from 'lucide-react';
import { timeLabel } from '@bastiat/contracts';
import { useApp, useLibrary } from './providers';

export function Header() {
  const pathname = usePathname();
  const { user } = useApp();
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Bastiat Library home">
        <BookOpen size={30} strokeWidth={1.3} />
        <span>
          Bastiat<span className="brand-sub">LIBRARY</span>
        </span>
      </Link>
      <nav aria-label="Main navigation">
        {[
          ['/', 'Home'],
          ['/explore', 'Explore'],
          ['/library', 'My Library'],
        ].map(([href, label]) => (
          <Link key={href} href={href!} className={pathname === href ? 'active' : ''}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        <Link href="/explore" className="icon-button" aria-label="Search the library">
          <Search size={21} />
        </Link>
        <Link
          href="/profile"
          className="account-button"
          aria-label={user ? 'Open profile' : 'Sign in'}
        >
          <User size={18} />
          <span>{user ? user.name.split(' ')[0] : 'Sign in'}</span>
        </Link>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <span>Ideas worth thinking through.</span>
      <div>
        <Link href="/about">
          About this library <ArrowUpRight size={13} />
        </Link>
        <Link href="/privacy">Privacy</Link>
        <span>Independent learning project</span>
      </div>
    </footer>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {[
        { href: '/', label: 'Home', Icon: Home },
        { href: '/explore', label: 'Explore', Icon: Compass },
        { href: '/library', label: 'My Library', Icon: Library },
        { href: '/profile', label: 'Profile', Icon: User },
      ].map(({ href, label, Icon }) => (
        <Link href={href} key={href} className={pathname === href ? 'active' : ''}>
          <Icon size={21} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function MiniPlayer() {
  const { player, toggle, stop } = useApp();
  const pathname = usePathname();
  const lib = useLibrary();
  if (!player.lesson || pathname === `/lesson/${player.lesson.slug}`) return null;
  return (
    <aside className="mini-player" aria-label="Now playing">
      <img src={player.lesson.coverUrl} alt="" />
      <Link href={`/lesson/${player.lesson.slug}`} className="mini-title">
        <small>NOW {player.playing ? 'PLAYING' : 'PAUSED'}</small>
        <strong>{player.lesson.title}</strong>
        <span>
          {timeLabel(player.position)} / {timeLabel(player.duration)}
          {lib.syncing ? ' · Syncing' : ''}
        </span>
      </Link>
      <button
        className="play-circle small"
        onClick={toggle}
        aria-label={player.playing ? 'Pause' : 'Play'}
      >
        {player.playing ? <Pause size={20} /> : <Play size={20} />}
      </button>
      <button className="icon-button" onClick={stop} aria-label="Close player">
        <X size={19} />
      </button>
      <div
        className="mini-progress"
        style={{ width: `${Math.min(100, (player.position / player.duration) * 100)}%` }}
      />
    </aside>
  );
}
