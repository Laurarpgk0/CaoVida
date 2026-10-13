import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { AcessibilidadeProvider } from "../a11y/Acessibilidade";
import VLibrasWeb from "../a11y/VLibrasWeb";
import CadastroScreen from "../screens/CadastroScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import { SessionProvider, useSession } from "../SessionProvider";

// Tela inicial / Landing Page de boas-vindas
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

// Gate Principal que envolve a navegação privada e protege os componentes
function MainGate() {
  const { session, loading, resetInactivityTimer } = useSession();
  const [currentView, setCurrentView] = useState("welcome"); // 'welcome' | 'login' | 'register'

  // Mostra indicador enquanto valida o estado inicial da sessão
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3182ce" />
        <Text style={styles.loadingText}>A carregar CãoVida...</Text>
      </View>
    );
  }

  // SE O USUÁRIO FOR NULO: Desmonta os componentes privados e exibe o fluxo público (Login/Welcome)
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

  // SE O USUÁRIO ESTIVER AUTENTICADO: Renderiza estritamente as telas privadas protegidas pelo SessionProvider
  return (
    <View style={{ flex: 1 }} onTouchStart={resetInactivityTimer}>
      <StatusBar style="dark" />
      <CadastroScreen />
      <VLibrasWeb />
    </View>
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
});
