import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { supabase } from "./supabase";

const SessionContext = createContext({});

export const SessionProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const inactivityTimer = useRef(null);
  const INACTIVITY_LIMIT = 120000; //

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const resetInactivityTimer = () => {
    if (!session) return;
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);

    inactivityTimer.current = setTimeout(() => {
      console.log("Sessão expirada por inatividade.");
      handleLogout();
    }, INACTIVITY_LIMIT);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        if (session) {
          handleLogout();
        }
      }
    });

    return () => subscription.remove();
  }, [session]);

  const fetchProfile = async (userId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Erro ao buscar perfil:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileName = async (newName) => {
    if (!session?.user) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ name: newName, updated_at: new Date() })
        .eq("id", session.user.id);

      if (error) throw error;
      setProfile((prev) => ({ ...prev, name: newName }));
    } catch (error) {
      console.error("Erro ao atualizar nome:", error.message);
      throw error;
    }
  };

  return (
    <SessionContext.Provider
      value={{
        session,
        profile,
        loading,
        signOut: handleLogout,
        updateProfileName,
        resetInactivityTimer,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
