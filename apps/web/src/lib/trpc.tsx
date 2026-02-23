"use client";

import type { AppRouter } from "@athme/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import { useState } from "react";
import { createClient } from "./supabase/client";

export const trpc = createTRPCReact<AppRouter>();

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute — avoids refetching on mount in dev
      },
    },
  });
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
          async headers() {
            const supabase = createClient();
            const {
              data: { session },
            } = await supabase.auth.getSession();
            return {
              Authorization: session?.access_token
                ? `Bearer ${session.access_token}`
                : "",
            };
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
