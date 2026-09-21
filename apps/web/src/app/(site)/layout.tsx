import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { Header, Footer, BottomNav, MiniPlayer } from '@/components/chrome';
import './styles.css';

export const metadata: Metadata = {
  title: {
    default: 'Bastiat Library — Ideas worth thinking through',
    template: '%s · Bastiat Library',
  },
  description:
    'A thoughtful introduction to Frédéric Bastiat. Listen, read, and explore one idea at a time.',
  icons: { icon: '/icon.png' },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <MiniPlayer />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
