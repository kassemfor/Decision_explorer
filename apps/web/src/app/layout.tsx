import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Decision Explorer — Causal Mapping",
    description: "Build and analyze causal/cognitive maps for strategy, policy, and complex problem-structuring.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
