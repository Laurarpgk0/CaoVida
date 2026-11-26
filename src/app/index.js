import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { AcessibilidadeProvider } from "../a11y/Acessibilidade";
import VLibrasWeb from "../a11y/VLibrasWeb";
import Chat from "../Chat";
import { API_URL } from "../config";
import { registerForPushNotificationsAsync } from "../notifications";
import CadastroScreen from "../screens/CadastroScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import { SessionProvider, useSession } from "../SessionProvider";
import { supabase } from "../supabase";

function WelcomeScreen({ onNavigateToLogin }) {
  return (
    <SafeAreaView style={styles.welcomeContainer}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🐾</Text>
        <Text style={styles.mainTitle}>CãoVida</Text>
        <Text style={styles.subtitle}>
          O aplicativo para cuidar dos seus pets. Faça login ou crie o seu
          cadastro para começar.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onNavigateToLogin}
        >
          <Text style={styles.primaryButtonText}>Acessar Sistema</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function MainGate() {
  const { session, profile, loading, resetInactivityTimer, enableNative } =
    useSession();

  const [currentView, setCurrentView] = useState("welcome");
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [feedback, setFeedback] = useState("");

  const [adminResumo, setAdminResumo] = useState(null);
  const [adminConsultas, setAdminConsultas] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);

  const testarAcessoAdmin = async () => {
    if (adminLoading) return;

    try {
      setAdminLoading(true);

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession) {
        throw new Error("Não existe uma sessão autenticada.");
      }

      const adminUrl = API_URL.replace(/\/api\/consultas\/?$/, "");

      const headers = {
        Authorization: `Bearer ${currentSession.access_token}`,
      };

      const [resumoResponse, consultasResponse] = await Promise.all([
        fetch(`${adminUrl}/api/admin/resumo`, { headers }),
        fetch(`${adminUrl}/api/admin/consultas`, { headers }),
      ]);

      const resumoTexto = await resumoResponse.text();
      const consultasTexto = await consultasResponse.text();

      let resumoData;
      let consultasData;

      try {
        resumoData = JSON.parse(resumoTexto);
        consultasData = JSON.parse(consultasTexto);
      } catch {
        throw new Error("O servidor retornou uma resposta inválida.");
      }

      if (!resumoResponse.ok) {
        throw new Error(
          resumoData.error || `Erro no resumo: ${resumoResponse.status}`,
        );
      }

      if (!consultasResponse.ok) {
        throw new Error(
          consultasData.error ||
            `Erro nas consultas: ${consultasResponse.status}`,
        );
      }

      if (!Array.isArray(consultasData)) {
        throw new Error("A lista de consultas retornada é inválida.");
      }

      setAdminResumo(resumoData);
      setAdminConsultas(consultasData);

      Alert.alert(
        "Painel administrativo atualizado",
        `Total de consultas: ${resumoData.totalConsultas}\nConsultas aplicadas: ${resumoData.totalAplicadas}\nConsultas encontradas: ${consultasData.length}`,
      );
    } catch (error) {
      console.error("ERRO PAINEL ADMIN:", error);
      Alert.alert("Acesso administrativo", error.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const [nativeEnabled, setNativeEnabled] = useState(false);
  const [nativeSettingLoading, setNativeSettingLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadNativeSetting = async () => {
      if (!session?.user?.id) {
        setNativeEnabled(false);
        return;
      }

      try {
        const value = await AsyncStorage.getItem("native:" + session.user.id);

        if (active) {
          setNativeEnabled(value === "true");
        }
      } catch (error) {
        if (active) {
          setFeedback(
            "Não foi possível carregar a configuração de desbloqueio.",
          );
        }
      }
    };

    loadNativeSetting();

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const handleNativeToggle = async (value) => {
    if (nativeSettingLoading) return;

    try {
      setNativeSettingLoading(true);

      await enableNative(value);
      setNativeEnabled(value);

      Alert.alert(
        "Desbloqueio atualizado",
        value
          ? "Biometria ou senha do celular ativada."
          : "Desbloqueio do aparelho desativado.",
      );
    } catch (error) {
      Alert.alert(
        "Não foi possível alterar",
        error?.message || "Ocorreu um erro ao alterar a configuração.",
      );
    } finally {
      setNativeSettingLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      registerForPushNotificationsAsync();

      async function loadRooms() {
        const { data, error } = await supabase.from("rooms").select("*");

        if (error) {
          setFeedback(error.message);
        } else {
          setRooms(data);
        }
      }

      loadRooms();
    } else {
      setRooms([]);
      setRoomId(null);
      setFeedback("");
      setAdminResumo(null);
      setAdminConsultas([]);
    }
  }, [session]);

  const handlePlaySound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/evento.wav"),
      );

      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          await sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log("Erro ao reproduzir o som:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3182ce" />
        <Text style={styles.loadingText}>A carregar CãoVida...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <TouchableWithoutFeedback onPress={resetInactivityTimer}>
        <View style={{ flex: 1 }} onTouchStart={resetInactivityTimer}>
          <StatusBar style="dark" />

          {currentView === "welcome" && (
            <WelcomeScreen onNavigateToLogin={() => setCurrentView("login")} />
          )}

          {currentView === "login" && (
            <LoginScreen
              onBack={() => setCurrentView("welcome")}
              onNavigateToRegister={() => setCurrentView("register")}
            />
          )}

          {currentView === "register" && (
            <RegisterScreen onBackToLogin={() => setCurrentView("login")} />
          )}

          <VLibrasWeb />
        </View>
      </TouchableWithoutFeedback>
    );
  }

  if (roomId) {
    return (
      <View
        style={{ flex: 1, padding: 20, paddingTop: 48 }}
        onTouchStart={resetInactivityTimer}
      >
        <Button title="Voltar ao menu" onPress={() => setRoomId(null)} />

        <Chat roomId={roomId} onSent={handlePlaySound} />

        <VLibrasWeb />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        gap: 14,
        paddingTop: 48,
      }}
      onTouchStart={resetInactivityTimer}
    >
      <StatusBar style="dark" />

      <CadastroScreen />

      {profile?.role === "administrador" && (
        <View style={styles.adminContainer}>
          <Text style={styles.adminTitle}>Painel administrativo</Text>

          <Button
            title={
              adminLoading ? "Carregando..." : "Atualizar painel administrativo"
            }
            onPress={testarAcessoAdmin}
            color="#3182ce"
            disabled={adminLoading}
          />

          {adminLoading && (
            <ActivityIndicator
              size="large"
              color="#3182ce"
              style={{ marginTop: 12 }}
            />
          )}

          {adminResumo && (
            <View style={styles.adminSummary}>
              <Text style={styles.adminSummaryTitle}>Resumo geral</Text>

              <Text style={styles.adminText}>
                Total de consultas: {adminResumo.totalConsultas}
              </Text>

              <Text style={styles.adminText}>
                Consultas aplicadas: {adminResumo.totalAplicadas}
              </Text>

              <Text style={styles.adminText}>Perfil: {adminResumo.perfil}</Text>
            </View>
          )}

          {adminResumo && (
            <View>
              <Text style={styles.adminListTitle}>
                Consultas de todos os alunos
              </Text>

              {adminConsultas.length === 0 ? (
                <Text style={styles.adminText}>
                  Nenhuma consulta cadastrada.
                </Text>
              ) : (
                adminConsultas.map((item) => (
                  <View key={item._id} style={styles.consultaCard}>
                    <Text style={styles.petTitle}>{item.petNome}</Text>

                    <Text style={styles.adminText}>Raça: {item.raca}</Text>

                    <Text style={styles.adminText}>
                      Consulta/vacina: {item.tipoConsulta}
                    </Text>

                    <Text style={styles.adminText}>
                      Data: {item.dataDaVacina}
                    </Text>

                    <View style={styles.cardDivider} />

                    <Text style={styles.responsavelTitle}>
                      Aluno responsável
                    </Text>

                    <Text style={styles.adminText}>
                      Nome: {item.responsavel?.name || "Não disponível"}
                    </Text>

                    <Text style={styles.adminText}>
                      E-mail: {item.responsavel?.email || "Não disponível"}
                    </Text>

                    <Text style={styles.adminText}>
                      ID do responsável: {item.userId}
                    </Text>

                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: item.applied ? "#276749" : "#b7791f",
                        },
                      ]}
                    >
                      {item.applied ? "Consulta aplicada" : "Pendente"}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      )}

      <View style={styles.nativeSettings}>
        <View style={styles.nativeSettingsText}>
          <Text style={styles.nativeTitle}>Desbloqueio do aparelho</Text>

          <Text style={styles.nativeDescription}>
            Biometria ou PIN, senha e padrão do celular
          </Text>
        </View>

        <Switch
          value={nativeEnabled}
          onValueChange={handleNativeToggle}
          disabled={nativeSettingLoading}
          trackColor={{
            false: "#a0aec0",
            true: "#3182ce",
          }}
        />
      </View>

      {feedback ? <Text style={{ color: "red" }}>{feedback}</Text> : null}

      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          marginTop: 10,
        }}
      />

      {rooms.map((room) => (
        <Button
          key={room.id}
          title={`Abrir ${room.name}`}
          onPress={() => setRoomId(room.id)}
          color="#3182ce"
        />
      ))}

      <View style={styles.soundButtonContainer}>
        <Button
          title="TOCAR SOM DE EVENTO 🐾"
          onPress={handlePlaySound}
          color="#718096"
        />
      </View>

      <VLibrasWeb />
    </ScrollView>
  );
}

export default function App() {
  return (
    <AcessibilidadeProvider>
      <SessionProvider>
        <MainGate />
      </SessionProvider>
    </AcessibilidadeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#4a5568",
    fontSize: 16,
    fontWeight: "500",
  },
  welcomeContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    maxWidth: 400,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: "#3182ce",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  nativeSettings: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#edf2f7",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nativeSettingsText: {
    flex: 1,
    paddingRight: 12,
  },
  nativeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
  },
  nativeDescription: {
    fontSize: 13,
    color: "#4a5568",
    marginTop: 4,
  },
  soundButtonContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  adminContainer: {
    marginTop: 16,
    gap: 12,
  },
  adminTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2d3748",
  },
  adminSummary: {
    backgroundColor: "#ebf8ff",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  adminSummaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2b6cb0",
  },
  adminText: {
    fontSize: 14,
    color: "#2d3748",
    marginTop: 4,
  },
  adminListTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#2d3748",
    marginTop: 12,
    marginBottom: 8,
  },
  consultaCard: {
    backgroundColor: "#f7fafc",
    borderWidth: 1,
    borderColor: "#cbd5e0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  petTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2b6cb0",
    marginBottom: 6,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#cbd5e0",
    marginVertical: 12,
  },
  responsavelTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2d3748",
  },
  statusText: {
    fontWeight: "bold",
    marginTop: 12,
  },
});
