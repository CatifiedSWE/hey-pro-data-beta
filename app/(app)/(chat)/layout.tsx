import type { Metadata } from "next";
import "./style.css";
import Header from "@/components/header";

export const metadata: Metadata = {
    title: "Chat - HeyProData",
    description: "Connect and chat with your network",
};

export default function ChatLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <Header />
            <div className="mt-20">
                {children}
            </div>
        </>
    );
}
