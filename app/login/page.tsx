"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/data/supabase/client";
import { useDataContext } from "@/lib/data/context";
import { toast } from "sonner";
import { Dumbbell } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { mode, user } = useDataContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sending, setSending] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  useEffect(() => {
    if (mode === "demo" || user) router.replace("/today");
  }, [mode, user, router]);

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Supabase isn&apos;t configured in this deployment. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable sign-in.
          </CardContent>
        </Card>
      </div>
    );
  }

  async function sendMagicLink() {
    if (!email.trim()) {
      toast.error("Enter your email first");
      return;
    }
    setSending(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setMagicLinkSent(true);
      toast.success("Magic link sent — check your email");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send magic link");
    } finally {
      setSending(false);
    }
  }

  async function signInWithPassword() {
    if (!email.trim() || !password) {
      toast.error("Enter your email and password");
      return;
    }
    setSending(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Signed in");
      router.replace("/today");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSending(false);
    }
  }

  async function signUpWithPassword() {
    if (!email.trim() || !password) {
      toast.error("Enter your email and password");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSending(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      if (data.session) {
        toast.success("Account created");
        router.replace("/today");
      } else {
        toast.success("Account created — check your email to confirm, then sign in.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-sm w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Dumbbell className="size-5" /> Nithish Fit
          </CardTitle>
          <p className="text-sm text-muted-foreground">Sign in to sync your data across devices.</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="magic-link">
            <TabsList className="w-full">
              <TabsTrigger value="magic-link" className="flex-1">
                Magic link
              </TabsTrigger>
              <TabsTrigger value="password" className="flex-1">
                Password
              </TabsTrigger>
            </TabsList>

            <TabsContent value="magic-link" className="space-y-3 pt-3">
              {magicLinkSent ? (
                <p className="text-sm text-center py-4">
                  Check <strong>{email}</strong> for a sign-in link. Open it on this device to finish signing in.
                </p>
              ) : (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="login-email-magic">Email</Label>
                    <Input id="login-email-magic" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" placeholder="you@example.com" />
                  </div>
                  <Button className="w-full h-11" disabled={sending} onClick={sendMagicLink}>
                    Send magic link
                  </Button>
                </>
              )}
            </TabsContent>

            <TabsContent value="password" className="space-y-3 pt-3">
              <div className="space-y-1">
                <Label htmlFor="login-email-pw">Email</Label>
                <Input id="login-email-pw" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" placeholder="you@example.com" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="login-password">Password</Label>
                <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 h-11" disabled={sending} onClick={signInWithPassword}>
                  Sign in
                </Button>
                <Button className="flex-1 h-11" variant="outline" disabled={sending} onClick={signUpWithPassword}>
                  Create account
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
