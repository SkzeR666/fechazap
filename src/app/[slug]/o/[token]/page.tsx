"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LegacyPublicQuoteRedirect() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  useEffect(() => {
    if (token) router.replace(`/f/${token}`);
  }, [router, token]);

  return null;
}
