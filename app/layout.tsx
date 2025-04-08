// app/layout.tsx
import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Christ University VR Experience",
    description: "Virtual Tour of Christ University Central Campus",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            {/* Font will be imported via CSS or next/font */}
        </head>
        <body suppressHydrationWarning>{children}</body>
        </html>
    );
}