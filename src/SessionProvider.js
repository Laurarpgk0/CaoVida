
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { supabase } from "./supabase";

const SessionContext = createContext({});

export const SessionProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const inactivityTimer = useRef(null);
  const logoutInProgress = useRef(false);
  const INACTIVITY_LIMIT = 120000;

  const nativePrompt = useRef(false);
  const backgroundDuringPrompt = useRef(false);
  const localLoginInProgress = useRef(false);

  const registerAppSession = async () => {
    const { data, error } = await supabase.rpc("register_app_session");

    if (error) throw error;

    if (data !== true) {
      throw new Error("Não foi possível registrar a sessão do aplicativo.");
    }
  };

  const revokeAppSession = async () => {
    const { data, error } = await supabase.rpc("revoke_app_session");

    if (error) {
      console.error("Erro ao revogar sessão:", error.message);
      throw error;
    }

    if (data !== true) {
      throw new Error("A sessão não foi revogada no servidor.");
    }

    console.log("Sessão revogada com sucesso.");
  };

  const handleLogout = async () => {
    if (logoutInProgress.current) return;

    logoutInProgress.current = true;

    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }

    try {
      if (session) {
        await revokeAppSession();
      }

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error("Erro ao realizar logout:", error.message);
      throw error;
    } finally {
      logoutInProgress.current = false;
    }
  };

  const resetInactivityTimer = () => {
    if (!session || logoutInProgress.current) return;

    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }

    inactivityTimer.current = setTimeout(() => {
      handleLogout().catch((error) => {
        console.error("Erro no logout por inatividade:", error.message);
      });
    }, INACTIVITY_LIMIT);
  };

  const authenticateDevice = async (message) => {
    nativePrompt.current = true;
    backgroundDuringPrompt.current = false;

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: message,
        promptDescription: "Confirme sua identidade para continuar.",
        cancelLabel: "Cancelar",
        disableDeviceFallback: false,
      });

      if (!result.success || backgroundDuringPrompt.current) {
        throw new Error("Autenticação cancelada ou não autorizada.");
      }

      return true;
    } finally {
      nativePrompt.current = false;
    }
  };

  const enableNative = async (enabled) => {
    if (!session?.user) {
      throw new Error("Entre na sua conta antes de ativar o desbloqueio.");
    }

    if (enabled) {
      await authenticateDevice("Ativar desbloqueio do CaoVida");
    }

    await AsyncStorage.setItem("native:" + session.user.id, String(enabled));
  };

  const loginWithBiometrics = async (email, password) => {
    let authenticated = false;

    try {
      setLoading(true);
      localLoginInProgress.current = true;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      authenticated = Boolean(data?.session);

      if (!authenticated || !data?.user) {
        throw new Error("Não foi possível iniciar a sessão.");
      }

      const nativeEnabled = await AsyncStorage.getItem(
        "native:" + data.user.id,
      );

      if (nativeEnabled === "true") {
        await authenticateDevice("Confirmar entrada no CaoVida");
      }

      await registerAppSession();

      setSession(data.session);
      await fetchProfile(data.user.id);
    } catch (error) {
      if (authenticated) {
        await supabase.auth.signOut();
      }

      setSession(null);
      setProfile(null);

      console.error("Erro no login:", error.message);
      throw error;
    } finally {
      localLoginInProgress.current = false;
      setLoading(false);
    }
  };

  const fetchProfile = async (userId) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error("Perfil não encontrado ou sem autorização.");
      }

      setProfile(data);
    } catch (error) {
      console.error("Erro ao buscar perfil:", error.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (!active) return;

        const currentSession = data.session;

        if (currentSession) {
          await registerAppSession();

          if (!active) return;

          setSession(currentSession);
          await fetchProfile(currentSession.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Erro ao recuperar sessão:", error.message);

        if (active) {
          await supabase.auth.signOut();
          setSession(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (localLoginInProgress.current || event === "INITIAL_SESSION") {
        return;
      }

      setSession(currentSession);

      if (!currentSession) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nativePrompt.current) {
        if (nextAppState === "background") {
          backgroundDuringPrompt.current = true;

          handleLogout().catch((error) => {
            console.error("Erro no logout durante biometria:", error.message);
          });
        }

        return;
      }

      if (nextAppState === "background" || nextAppState === "inactive") {
        if (session) {
          handleLogout().catch((error) => {
            console.error("Erro no logout automático:", error.message);
          });
        }
      }
    });

    return () => subscription.remove();
  }, [session]);

  const updateProfileName = async (newName) => {
    if (!session?.user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: newName,
          updated_at: new Date(),
        })
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
        enableNative,
        loginWithBiometrics,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
