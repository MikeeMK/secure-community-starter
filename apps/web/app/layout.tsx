import type { Metadata } from 'next';
import { Alex_Brush } from 'next/font/google';
import './globals.css';
import { Nav } from './components/Nav';
import { Footer } from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import { FeedbackWidget } from './components/FeedbackWidget';
import { ChatWidget } from './components/ChatWidget';

const alexBrush = Alex_Brush({ subsets: ['latin'], weight: ['400'], variable: '--font-logo' });

export const metadata: Metadata = {
  title: 'Velentra | Connectez vos envies !',
  description: 'Une communauté intime pour discuter, explorer et faire des rencontres en toute sécurité.',
  icons: {
    icon: { url: '/favicon.png', sizes: '64x64', type: 'image/png' },
    shortcut: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={alexBrush.variable}>
      <head>
        {/* Prevent flash of wrong theme — runs before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <div className="layout-shell">
            <Nav />
            <main className="page-content">{children}</main>
            <Footer />
          </div>
          <FeedbackWidget />
          <ChatWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
