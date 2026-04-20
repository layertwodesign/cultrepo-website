"use client";

import { createContext, useContext, useState, useCallback } from "react";

const NavVisibilityContext = createContext<{
  hidden: boolean;
  setHidden: (v: boolean) => void;
}>({
  hidden: false,
  setHidden: () => {},
});

export function useNavVisibility() {
  return useContext(NavVisibilityContext);
}

export function NavVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHiddenState] = useState(false);
  const setHidden = useCallback((v: boolean) => setHiddenState(v), []);

  return (
    <NavVisibilityContext.Provider value={{ hidden, setHidden }}>
      {children}
    </NavVisibilityContext.Provider>
  );
}
