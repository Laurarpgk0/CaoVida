import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { supabase } from "./supabase";

const SessionContext = createContext({});

export const SessionProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const inactivityTimer = useRef(null);
  const INACTIVITY_LIMIT = 120000; // 2 minutos

  // Variáveis de controle nativo (para evitar falsos positivos de background/inactive)
  const nativePrompt = useRef(false);
  const backgroundDuringPrompt = useRef(false);

  const handleLogout = async () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
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

  // Função para ativar ou desativar a biometria por conta e aparelho (native:UUID)
  const enableNative = async (enabled) => {
    if (!session?.user) return;
    if (enabled) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        throw new Error("Cadastre biometria nas configurações do aparelho.");
      }

      nativePrompt.current = true;
      backgroundDuringPrompt.current = false;
      let result;
      try {
        result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Ativar entrada nativa",
          cancelLabel: "Cancelar",
        });
      } finally {
        nativePrompt.current = false;
      }

      if (!result.success || backgroundDuringPrompt.current) {
        throw new Error("Ativação cancelada ou interrompida.");
      }
    }
    await AsyncStorage.setItem("native:" + session.user.id, String(enabled));
  };

  // Interceptação de login com suporte opcional à biometria se habilitada
  const loginWithBiometrics = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      if (data?.user) {
        const nativeEnabled = await AsyncStorage.getItem(
          "native:" + data.user.id,
        );
        if (nativeEnabled === "true") {
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();

          if (!hasHardware || !isEnrolled) {
            throw new Error("Recurso nativo indisponível no aparelho.");
          }

          nativePrompt.current = true;
          backgroundDuringPrompt.current = false;
          let result;
          try {
            result = await LocalAuthentication.authenticateAsync({
              promptMessage: "Confirmar entrada",
              cancelLabel: "Cancelar",
            });
          } finally {
            nativePrompt.current = false;
          }

          if (!result.success || backgroundDuringPrompt.current) {
            await handleLogout();
            throw new Error("Entrada nativa não autorizada.");
          }
        }
      }
    } catch (error) {
      console.error("Erro no login:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
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
      if (nativePrompt.current) {
        if (nextAppState === "background") {
          backgroundDuringPrompt.current = true;
          handleLogout();
        }
        return;
      }

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
        enableNative,
        loginWithBiometrics,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
