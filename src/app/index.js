import { Audio } from "expo-av";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { AcessibilidadeProvider } from "../a11y/Acessibilidade";
import VLibrasWeb from "../a11y/VLibrasWeb";
import Chat from "../Chat";
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
        <Text style={styles.emoji}>🐶</Text>
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
  const { session, loading, resetInactivityTimer } = useSession();
  const [currentView, setCurrentView] = useState("welcome");

  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (session) {
      registerForPushNotificationsAsync();

      // Busca as salas do Supabase assim que o usuário estiver logado
      async function loadRooms() {
        const { data, error } = await supabase.from("rooms").select("*");
        if (error) {
          setFeedback(error.message);
        } else {
          setRooms(data);
        }
      }
      loadRooms();
    }
  }, [session]);

  // Função robusta usando expo-av compatível com Web e Mobile
  const handlePlaySound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/evento.wav"),
      );
      await sound.playAsync();

      // Limpa a memória após o som terminar de tocar
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          await sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log("Erro ao reproduzir o som:", error);
    }
  };

  // Mostra indicador enquanto valida o estado inicial da sessão
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
      contentContainerStyle={{ padding: 24, gap: 14, paddingTop: 48 }}
      onTouchStart={resetInactivityTimer}
    >
      <StatusBar style="dark" />
      <CadastroScreen />

      {feedback ? <Text style={{ color: "red" }}>{feedback}</Text> : null}

      <Text style={{ fontSize: 18, fontWeight: "bold", marginTop: 10 }}>
        {/* Salas de Atendimento (Aula 5) */}
      </Text>

      {/* Lista as salas vindas do banco para o usuário abrir o chat */}
      {rooms.map((room) => (
        <Button
          key={room.id}
          title={`Abrir ${room.name}`}
          onPress={() => setRoomId(room.id)}
          color="#3182ce"
        />
      ))}

      {/* Botão de exemplo flutuante ou integrado para testar o som do evento */}
      <View style={styles.soundButtonContainer}>
        <Button
          title="TOCAR SOM DE EVENTO🐶"
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
  soundButtonContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
});
