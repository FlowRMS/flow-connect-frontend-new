"use client";

import { useEffect } from "react";
import LogRocket from "logrocket";

interface LogRocketProviderProps {
  children: React.ReactNode;
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
}

const LOGROCKET_APP_ID = process.env.NEXT_PUBLIC_LOGROCKET_APP_ID;

export function LogRocketProvider({ children, user }: LogRocketProviderProps) {
  useEffect(() => {
    // Initialize LogRocket only in production and in the browser
    if (typeof window !== "undefined" && process.env.NODE_ENV === "production" && LOGROCKET_APP_ID) {
      LogRocket.init(LOGROCKET_APP_ID, {
        release: process.env.NEXT_PUBLIC_APP_VERSION,
        console: {
          isEnabled: true,
        },
        network: {
          requestSanitizer: (request) => {
            // Sanitize sensitive headers
            if (request.headers) {
              if (request.headers["Authorization"]) {
                request.headers["Authorization"] = "[REDACTED]";
              }
              if (request.headers["authorization"]) {
                request.headers["authorization"] = "[REDACTED]";
              }
            }
            return request;
          },
        },
      });
    }
  }, []);

  useEffect(() => {
    // Identify user when they are logged in
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "production" &&
      user?.id
    ) {
      const userName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

      LogRocket.identify(user.id, {
        name: userName || "Unknown User",
        ...(user.email && { email: user.email }),
      });
    }
  }, [user]);

  return <>{children}</>;
}
