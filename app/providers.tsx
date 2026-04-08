"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { SoundProvider } from "@/sound/SoundProvider";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60_000,
        gcTime: 60 * 60_000,
        retry: 1,
        refetchOnWindowFocus: true,
      },
    },
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <SoundProvider>{children}</SoundProvider>
    </QueryClientProvider>
  );
}
