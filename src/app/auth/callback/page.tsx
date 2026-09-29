"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const next = searchParams.get("next") || "/chatbot";

    if (token) {
      try {
        localStorage.setItem("hukumku_user_token", token);
      } catch {
        // ignore storage failure
      }
    }
    router.replace(next.startsWith("/") ? next : "/chatbot");
  }, [router, searchParams]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        Memproses login...
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-gray-500">
          Memuat...
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}