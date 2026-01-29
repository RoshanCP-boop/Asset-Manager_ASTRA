"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function JoinPage() {
  const params = useParams();
  const code = params.code as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to backend join endpoint which will handle OAuth
    if (code) {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      window.location.href = `${backendUrl}/auth/join/${code}`;
    }
  }, [code]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border border-slate-200/50 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16">
            <img 
              src="/logo.png" 
              alt="ASTRA Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gradient">
            Joining Organization
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Redirecting to sign in...
          </p>
        </CardHeader>
        <CardContent className="pt-4 pb-8">
          <div className="flex justify-center">
            <div className="loading-spinner w-8 h-8"></div>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
