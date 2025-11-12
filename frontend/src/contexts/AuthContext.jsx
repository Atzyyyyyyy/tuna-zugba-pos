import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("tuna_token"));

  // Listen for login/logout events across tabs/components
  useEffect(() => {
    const syncLoginState = () => setIsLoggedIn(!!localStorage.getItem("tuna_token"));
    window.addEventListener("storage", syncLoginState);
    return () => window.removeEventListener("storage", syncLoginState);
  }, []);

  const login = (token) => {
    localStorage.setItem("tuna_token", token);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem("tuna_token");
    localStorage.removeItem("tuna_user");
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
