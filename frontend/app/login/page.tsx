"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function LoginContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for error in URL params
    const errorParam = searchParams.get("error");
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        auth_failed: "Authentication failed. Please try again.",
        no_user_info: "Could not get user info from Google.",
        no_email: "No email provided by Google.",
        account_disabled: "Your account has been disabled.",
      };
      setError(errorMessages[errorParam] || "An error occurred. Please try again.");
    }
  }, [searchParams]);

  function handleGoogleLogin() {
    setLoading(true);
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${API_URL}/auth/google`;
  }

  return (
    <div className="min-h-screen flex items-start justify-center pt-[12vh] sm:pt-[15vh] p-6 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Morphing gradient blobs */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/30 to-cyan-500/20 blur-3xl animate-morph animate-drift" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-500/30 to-purple-500/20 blur-3xl animate-morph delay-500" style={{ animationDirection: 'reverse' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/15 to-blue-500/15 blur-3xl animate-pulse-soft delay-300" />
        <div className="absolute top-10 left-1/4 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-pink-500/10 blur-3xl animate-morph delay-700" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-gradient-to-tl from-teal-500/15 to-emerald-500/10 blur-3xl animate-drift delay-300" style={{ animationDirection: 'reverse' }} />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        
        {/* Twinkling stars */}
        <div className="absolute top-[8%] left-[12%] w-1 h-1 bg-white/50 rounded-full animate-twinkle" />
        <div className="absolute top-[15%] right-[18%] w-1 h-1 bg-white/40 rounded-full animate-twinkle delay-300" />
        <div className="absolute top-[22%] left-[30%] w-1 h-1 bg-white/50 rounded-full animate-twinkle delay-700" />
        <div className="absolute top-[10%] right-[35%] w-1 h-1 bg-white/40 rounded-full animate-twinkle delay-500" />
        
        {/* Floating orbs */}
        <div className="absolute top-[40%] left-[6%] w-2 h-2 bg-blue-400/30 rounded-full animate-drift blur-[1px]" />
        <div className="absolute top-[35%] right-[8%] w-2.5 h-2.5 bg-indigo-400/25 rounded-full animate-drift delay-500 blur-[1px]" />
        <div className="absolute top-[55%] left-[12%] w-2 h-2 bg-cyan-400/30 rounded-full animate-float delay-300" />
        <div className="absolute top-[50%] right-[15%] w-2 h-2 bg-purple-400/25 rounded-full animate-float delay-700" />
        
        {/* Bottom particles */}
        <div className="absolute bottom-[25%] left-[18%] w-1.5 h-1.5 bg-blue-400/35 rounded-full animate-float delay-150" />
        <div className="absolute bottom-[20%] right-[12%] w-2 h-2 bg-teal-400/30 rounded-full animate-drift delay-500" />
        <div className="absolute bottom-[30%] left-[8%] w-1.5 h-1.5 bg-indigo-400/30 rounded-full animate-float delay-700" />
        
        {/* Bottom twinkling stars */}
        <div className="absolute bottom-[15%] left-[25%] w-1 h-1 bg-white/45 rounded-full animate-twinkle delay-200" />
        <div className="absolute bottom-[12%] right-[22%] w-1 h-1 bg-white/50 rounded-full animate-twinkle delay-600" />
        <div className="absolute bottom-[22%] right-[40%] w-1 h-1 bg-white/40 rounded-full animate-twinkle delay-400" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-scale-in">
        {/* Welcome text above card */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome</h1>
          <p className="text-blue-200/80">Your company&apos;s asset management portal</p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
          {/* Subtle gradient border effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/20 via-transparent to-indigo-500/20 pointer-events-none" />
          
          <CardHeader className="text-center pb-2 relative">
            {/* Logo */}
            <div className="mx-auto mb-2 w-20 h-20">
              <img 
                src="/logo.png" 
                alt="ASTRA Logo" 
                className="w-full h-full object-contain"
                style={{ imageRendering: 'auto' }}
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gradient">
              ASTRA
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Asset Tracking, Simplified.
            </p>
          </CardHeader>
          <CardContent className="pt-4 pb-8">
            <div className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-in fade-in duration-200">
                  <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                </div>
              )}
              
              <Button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm font-medium active-scale flex items-center justify-center gap-3"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-gray-500" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Redirecting...
                  </span>
                ) : (
                  <>
                    {/* Google Logo */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-gray-400">
                Secure authentication powered by Google
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white mb-4" />
        <p className="text-white/80 text-lg">Loading...</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
