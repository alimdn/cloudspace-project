import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "كلاود سبيس | مساحات عمل سحابية معزولة",
  description: "منصة سحابية لتأجير مساحات عمل Docker معزولة بالكامل. شغّل أي برنامج مفتوح المصدر بموارد مخصصة.",
  keywords: ["سحابية", "Docker", "مساحة عمل", "VPS", "حاويات", "n8n", "WordPress"],
  authors: [{ name: "CloudSpace" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "كلاود سبيس",
  },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "كلاود سبيس | مساحات عمل سحابية",
    description: "احصل على حاويات Docker معزولة بالكامل مع موارد مخصصة",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className="dark">
      <body
        className={`${cairo.variable} antialiased font-[family-name:var(--font-cairo)] bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
