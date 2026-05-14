import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'

export const metadata = { title: 'Cricket Arena — Operator Dashboard', description: 'Operator portal for Cricket Arena booking management' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* No-flash script — runs before first paint to apply saved theme */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var t = localStorage.getItem('ca-op-theme');
              var d = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (t === 'dark' || (!t && d)) document.documentElement.classList.add('dark');
            } catch(e){}
          })();
        `}} />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white antialiased transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
