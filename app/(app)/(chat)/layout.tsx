import type { Metadata } from "next";
import "./style.css";

export const metadata: Metadata = {
    title: "Chat - HeyProData",
    description: "Connect and chat with your network",
};

export default function ChatLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
