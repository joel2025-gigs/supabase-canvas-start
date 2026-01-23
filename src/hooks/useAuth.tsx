import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { AppRole, Profile, UserRole } from "@/lib/types";

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    roles: [],
    loading: true,
    isAuthenticated: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session?.user,
        }));

        // Defer data fetching to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setState(prev => ({
            ...prev,
            profile: null,
            roles: [],
            loading: false,
          }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session?.user,
      }));

      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile and roles in parallel
      const [profileResult, rolesResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("*, branch:branches(*)")
          .eq("id", userId)
          .single(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId),
      ]);

      const profile = profileResult.data as Profile | null;
      const roles = (rolesResult.data || []).map((r: UserRole) => r.role as AppRole);

      setState(prev => ({
        ...prev,
        profile,
        roles,
        loading: false,
      }));
    } catch (error) {
      console.error("Error fetching user data:", error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      return { error };
    }
    toast.success("Signed in successfully");
    return { error: null };
  };

  const signUp = async (email: string, password: string, metadata?: { full_name?: string; phone?: string }) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata,
      },
    });
    if (error) {
      toast.error(error.message);
      return { error };
    }
    toast.success("Account created! Please check your email to confirm.");
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth/login");
  };

  const hasRole = (role: AppRole): boolean => {
    return state.roles.includes(role);
  };

  const hasAnyRole = (roles: AppRole[]): boolean => {
    return roles.some(role => state.roles.includes(role));
  };

  const isStaff = (): boolean => {
    return hasAnyRole(['super_admin', 'admin', 'operations_admin', 'accountant', 'sales_admin', 'sales_officer', 'credit_admin', 'credit_officer', 'recovery_admin', 'recovery_officer', 'operations_officer', 'staff']);
  };

  const isAdmin = (): boolean => {
    return hasAnyRole(['super_admin', 'admin']);
  };

  const isSuperAdmin = (): boolean => {
    return hasRole('super_admin');
  };

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    hasRole,
    hasAnyRole,
    isStaff,
    isAdmin,
    isSuperAdmin,
    refetch: () => state.user && fetchUserData(state.user.id),
  };
};

export type UseAuthReturn = ReturnType<typeof useAuth>;
