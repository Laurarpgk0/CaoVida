import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../supabase";

export default function RegisterScreen({ onBackToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Estados para controlar as mensagens no ecrã
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");

  const handleRegister = async () => {
    setMensagemSucesso("");
    setMensagemErro("");

    if (!name || !email || !password) {
      setMensagemErro("Por favor, preencha todos os campos.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (error) {
        // Se o Supabase der erro (ex: e-mail já existe, senha curta), mostra na tela
        setMensagemErro(error.message);
        return;
      }

      // FORÇAR A EXIBIÇÃO DA MENSAGEM DE SUCESSO NA TELA DA VERCEL:
      setMensagemSucesso(
        "Conta criada com sucesso! ✉️ Enviamos um link de confirmação para o seu e-mail (" +
          email +
          "). Verifique a sua caixa de entrada e a pasta de spam.",
      );
    } catch (err) {
      setMensagemErro("Ocorreu um erro inesperado: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formCard}>
          <Text style={styles.title}>Criar Conta 🐾</Text>
          <Text style={styles.subtitle}>
            Preencha para começar a gerenciar seus pets
          </Text>

          {/* CAIXA DE SUCESSO: Aparece logo abaixo do subtítulo quando cadastrado com sucesso */}
          {mensagemSucesso ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{mensagemSucesso}</Text>
              {onBackToLogin && (
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={onBackToLogin}
                >
                  <Text style={styles.linkButtonText}>
                    Ir para o Login agora
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {/* CAIXA DE ERRO: Caso ocorra algum problema */}
          {mensagemErro ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{mensagemErro}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Nome Completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Laura Gomes"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo de 6 caracteres"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Cadastrar</Text>
            )}
          </TouchableOpacity>

          {onBackToLogin && !mensagemSucesso && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onBackToLogin}
            >
              <Text style={styles.secondaryButtonText}>
                Já tem conta? Faça login
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7fafc" },
  scrollContainer: { flexGrow: 1, justifyContent: "center", padding: 20 },
  formCard: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    maxWidth: 450,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2d3748",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#718096",
    textAlign: "center",
    marginBottom: 24,
  },
  successBox: {
    backgroundColor: "#c6f6d5",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#9ae6b4",
  },
  successText: {
    color: "#22543d",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: "#fed7d7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#feb2b2",
  },
  errorText: {
    color: "#742a2a",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  linkButton: {
    marginTop: 12,
    alignItems: "center",
    backgroundColor: "#22543d",
    paddingVertical: 10,
    borderRadius: 6,
  },
  linkButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  label: { fontSize: 14, fontWeight: "600", color: "#4a5568", marginBottom: 6 },
  input: {
    backgroundColor: "#edf2f7",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
    color: "#2d3748",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  primaryButton: {
    backgroundColor: "#3182ce",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  secondaryButton: { marginTop: 16, alignItems: "center" },
  secondaryButtonText: { color: "#3182ce", fontSize: 14, fontWeight: "500" },
});
