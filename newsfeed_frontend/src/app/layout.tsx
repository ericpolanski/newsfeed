"use client"; // Add this directive for client component

import { Inter } from "next/font/google";
import "./globals.css";
import { ApolloProvider } from "@apollo/client";
import client from "./lib/apolloClient"; // Import the client
import { AuthProvider } from "./context/AuthContext"; // Import AuthProvider
import { ThemeProvider } from "./context/ThemeContext"; // Import ThemeProvider
import Header from "./components/layout/Header"; // Updated import path for Header

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ApolloProvider client={client}>
          <AuthProvider client={client}>
            <ThemeProvider>
              <div className="min-h-screen">
                <Header />
                <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                  {children}
                </main>
              </div>
            </ThemeProvider>
          </AuthProvider>
        </ApolloProvider>
      </body>
    </html>
  );
}
