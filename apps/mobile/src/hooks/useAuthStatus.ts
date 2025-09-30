import { useAuth } from "./useAuth";

export const useAuthStatus = () => {
  const { user, loading, session, signOut } = useAuth();
  return {
    isAuthenticated: !!user,
    user,
    session,
    loading,
    signOut,
  };
};
