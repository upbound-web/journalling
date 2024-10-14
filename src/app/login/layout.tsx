import type { Metadata } from "next";
import AppHeader from "@/components/AppHeader";

export const metadata: Metadata = {
  title: "Login - Journal App",
  description: "Login to your Journal App account",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="container mx-auto mt-8">{children}</main>
    </>
  );
}
