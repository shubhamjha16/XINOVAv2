import type {Metadata} from 'next';
import { Inter } from 'next/font/google'; // Changed font
import './globals.css';
import { Toaster } from "@/components/ui/toaster" // Added Toaster

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' }); // Use Inter font

export const metadata: Metadata = {
  title: 'Xinova', // Updated title
  description: 'Generate quizzes on any topic!', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}> {/* Apply Inter font */}
        {children}
        <Toaster /> {/* Add Toaster for feedback */}
      </body>
    </html>
  );
}
