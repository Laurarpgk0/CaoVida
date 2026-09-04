import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import ItemLista from "../components/ItemLista";

export default function CadastroScreen() {
  const [petNome, setPetNome] = useState("");
  const [tipoConsulta, setTipoConsulta] = useState("");
  const [dataDaVacina, setDataDaVacina] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [vaccines, setVaccines] = useState([
    { id: 1, name: "Vacina Antirrábica", applied: false },
    {
      id: 2,
      name: "Consulta com Doutor Pulga",
      applied: false,
    },
    { id: 3, name: "Consulta Anual", applied: false },
    { id: 4, name: "Vacina V8", applied: false },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);

    return () => clearTimeout(timer);
  }, []);

  const markApplied = (id) => {
    setVaccines((prev) => {
      const item = prev.find((v) => v.id === id);

      if (!item) return prev;

      const updatedItem = {
        ...item,
        applied: true,
      };

      return [updatedItem, ...prev.filter((v) => v.id !== id)];
    });
  };

  const removeItem = (id) => {
    setVaccines((prev) => prev.filter((v) => v.id !== id));
  };

  const handleRegister = () => {
    if (petNome && tipoConsulta && dataDaVacina) {
      const novaConsulta = {
        id: Date.now(),
        name: `${petNome} - ${tipoConsulta} em ${dataDaVacina}`,
        applied: false,
      };

      setVaccines((prev) => [novaConsulta, ...prev]);

      setMessage(
        `✅ A consulta de ${petNome} para ${tipoConsulta} foi marcada para ${dataDaVacina}!`,
      );

      setPetNome("");
      setTipoConsulta("");
      setDataDaVacina("");
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
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
      />

      <TextInput
        style={styles.input}
        placeholder="Tipo de consulta"
        placeholderTextColor="#666d70"
        value={tipoConsulta}
        onChangeText={setTipoConsulta}
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

      <Text style={styles.sectionTitle}>Vacinas e consultas</Text>

      <FlatList
        data={vaccines}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ItemLista
            item={item}
            styles={styles}
            markApplied={markApplied}
            removeItem={removeItem}
          />
        )}
      />
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

  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: "#d2dae2",
  },

  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f0f9f4",
  },

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

  input: {
    borderWidth: 1,
    borderColor: "#b2bec3",
    padding: 10,
    marginBottom: 15,
    borderRadius: 6,
    backgroundColor: "#fff",
  },

  button: {
    backgroundColor: "#00b894",
    padding: 10,
    borderRadius: 5,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },

  message: {
    marginTop: 20,
    padding: 12,
    fontSize: 16,
    color: "#2d3436",
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#00b894",
    borderRadius: 6,
    backgroundColor: "#dff8ed",
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#2d3436",
  },

  item: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: "#dfe6e9",
    borderRadius: 8,
  },

  itemApplied: {
    backgroundColor: "#b9f6ca",
  },

  text: {
    fontSize: 16,
    color: "#2d3436",
    marginBottom: 10,
  },

  removeButton: {
    marginTop: 8,
    backgroundColor: "#d63031",
    padding: 10,
    borderRadius: 5,
  },
});
