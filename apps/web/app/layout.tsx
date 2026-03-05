import type { Metadata } from 'next';
import './globals.css';
import { Nav } from './components/Nav';
import { Footer } from './components/Footer';
import { AuthProvider } from './context/AuthContext';

export const metadata: Metadata = {
  title: 'Communauté',
  description: 'Une plateforme communautaire sécurisée — discussions, groupes et connexions authentiques.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
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
        </AuthProvider>
      </body>
    </html>
  );
}
