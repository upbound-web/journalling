"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { redirect } from "next/navigation";

export default function LoginPage() {
  const { user, isLoading: loading } = db.useAuth();

  useEffect(() => {
    if (!loading && user) {
      window.location.href = "/";
    }
  }, [user, loading]);

  const [email, setEmail] = useState("");
  const [magicCode, setMagicCode] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");

  const handleSendMagicCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.auth.sendMagicCode({ email });
      setMessage("Magic code sent! Check your email.");
      setStep("code");
    } catch (error) {
      setMessage("Error sending magic code. Please try again.");
      console.error("Send magic code error:", error);
    }
  };

  const handleVerifyMagicCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.auth.signInWithMagicCode({ email, code: magicCode });
      setMessage("Login successful!");
      window.location.href = "/"; // Use window.location for a full page reload
    } catch (error) {
      setMessage("Error verifying magic code. Please try again.");
      console.error("Verify magic code error:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            {step === "email"
              ? "Enter your email to receive a magic code"
              : "Enter the magic code sent to your email"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={handleSendMagicCode} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full">
                Send Magic Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyMagicCode} className="space-y-4">
              <Input
                type="text"
                placeholder="Enter magic code"
                value={magicCode}
                onChange={(e) => setMagicCode(e.target.value)}
                required
              />
              <Button type="submit" className="w-full">
                Verify Magic Code
              </Button>
            </form>
          )}
          {message && <p className="mt-4 text-sm text-center">{message}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
