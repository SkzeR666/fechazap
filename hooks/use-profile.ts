"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";

export function useProfile() {
  const { token, ready } = useAccessToken();
  return useQuery({
    queryKey: ["profile", token],
    queryFn: () => api.provider.profile(token!),
    enabled: ready && Boolean(token),
  });
}
