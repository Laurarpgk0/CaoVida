import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function App() {
  const [petNome, setPetNome] = useState("");
  const [dataDaVacina, setDataDaVacina] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);

  const [vaccines, setVaccines] = useState([
    { id: 1, name: "Vacina Antirrábica", applied: false },
    { id: 2, name: "Consulta Anual", applied: false },
    { id: 3, name: "Vacina V8", applied: false },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const markApplied = (id: number) => {
    setVaccines(
      vaccines.map((v) => (v.id === id ? { ...v, applied: true } : v)),
    );
  };

  const handleRegister = () => {
    if (petNome && dataDaVacina) {
      setMessage(`✅ Cadastro realizado para ${petNome} em ${dataDaVacina}!`);
    } else {
      setMessage("⚠️ Por favor, preencha todos os campos.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00b894" />
        <Text style={styles.loadingText}>Carregando CaoVida</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🐾 CaoVida</Text>
      <Text style={styles.subtitle}>Controle de vacinas e consultas</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome do Pet"
        placeholderTextColor="#666d70"
        value={petNome}
        onChangeText={setPetNome}
      />
      <TextInput
        style={styles.input}
        placeholder="Data da consulta (dd/mm/aaaa)"
        placeholderTextColor="#666d70"
        value={dataDaVacina}
        onChangeText={setDataDaVacina}
      />
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Cadastrar Consulta</Text>
      </TouchableOpacity>
      {message !== "" && <Text style={styles.message}>{message}</Text>}

      {vaccines.map((v) => (
        <View key={v.id} style={[styles.item, v.applied && styles.itemApplied]}>
          <Text style={styles.text}>
            {v.name} {v.applied ? "✅🐶" : ""}
          </Text>
          {!v.applied && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => markApplied(v.id)}
            >
              <Text style={styles.buttonText}>Marcar como aplicada</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1e272e",
  },
  loadingText: { marginTop: 10, fontSize: 18, color: "#d2dae2" },
  container: { flex: 1, padding: 20, backgroundColor: "#f0f9f4" },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 15,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#2d3436",
    textAlign: "center",
    marginBottom: 20,
  },

  item: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: "#dfe6e9",
    borderRadius: 8,
  },
  text: { fontSize: 16, color: "#2d3436", marginBottom: 10 },
  button: { backgroundColor: "#00b894", padding: 10, borderRadius: 5 },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#04c1f5",
  },
  input: {
    borderWidth: 1,
    borderColor: "#b2bec3",
    padding: 10,
    marginBottom: 15,
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    color: "#2d3436",
    textAlign: "center",
  },
  itemApplied: { backgroundColor: "#b9f6ca" },
});
