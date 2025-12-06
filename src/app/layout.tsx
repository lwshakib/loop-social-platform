import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { shadcn } from "@clerk/themes";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Loop",
  description:
    "Loop is a social media platform for sharing your thoughts and ideas with the world.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <ClerkProvider appearance={shadcn}>
      <html lang="en">
        <body className={`antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
