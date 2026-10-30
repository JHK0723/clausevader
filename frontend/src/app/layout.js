import "./globals.css";
import NavBar from "@/components/ui/navbar"; 
import { getCurrentSession } from "@/lib/server/session";
import { ThemeProvider } from "@/components/ui/theme-provider";

export const metadata = {
  title: "ClauseVader",
  description: "AI-Powered Contract Analysis & Legal Reasoning Platform",
};

export default async function RootLayout({ children }) {
  const { user } = await getCurrentSession();
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NavBar user={user} /> {}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
