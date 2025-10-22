import React, { createContext, useContext, useState, ReactNode } from "react";

type AuthContextType = {
  pendingEmail: string | null;
  setPendingEmail: (email: string | null) => void;
  clearPending: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [pendingEmail, setPendingEmailState] = useState<string | null>(null);

  const setPendingEmail = (email: string | null) => {
    setPendingEmailState(email);
  };

  const clearPending = () => setPendingEmailState(null);

  return (
    <AuthContext.Provider value={{ pendingEmail, setPendingEmail, clearPending }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
};
