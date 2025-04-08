import { ReactNode } from "react";

export const metadata = {
    title: "Christ University VR Experience",
    description: "Virtual Tour of Christ University Central Campus",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
        <head><link href="https://fonts.googleapis.com/css2?family=League+Spartan:wght@400;500;600;700&display=swap" rel="stylesheet" /><link rel="stylesheet" href="/styles/global.css" /></head>
        <body>{children}</body>
        </html>
    );
}