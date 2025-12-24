"use client";

import { createContext, useContext } from "react";

interface User {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  profilePictureUrl?: string | null;
}

const UserContext = createContext<User | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
