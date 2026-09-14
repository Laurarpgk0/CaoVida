import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import ItemLista from "../components/ItemLista";

//URL gerada no Render após o deploy do backend
const API_URL = "https://caovida-backend.onrender.com/api/consultas";

export default function CadastroScreen() {
  const [petNome, setPetNome] = useState("");
  const [tipoConsulta, setTipoConsulta] = useState("");
  const [dataDaVacina, setDataDaVacina] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [racas, setRacas] = useState([]);
  const [racaLoading, setRacaLoading] = useState(false);
  const [racaError, setRacaError] = useState("");
  const [modalRacas, setModalRacas] = useState(false);
  const [buscaRaca, setBuscaRaca] = useState("");
  const [racaSelecionada, setRacaSelecionada] = useState("");
  const [vaccines, setVaccines] = useState([]);

  // Carregar dados da API MongoDB
  const carregarConsultas = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      const listFormatada = data.map((item) => ({
        id: item._id,
        name: `${item.petNome} da raça ${item.raca} marcou a consulta ${item.tipoConsulta} para ${item.dataDaVacina}`,
        applied: item.applied,
      }));
      setVaccines(listFormatada);
    } catch (error) {
      setMessage("❌ Erro ao carregar dados do servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarConsultas();
  }, []);

  const buscarRacasAPI = async () => {
    try {
      setRacaLoading(true);
      setRacaError("");
      const response = await fetch("https://dog.ceo/api/breeds/list/all");
      if (!response.ok) throw new Error("Erro ao consultar a API");
      const data = await response.json();
      const listaRacas = [];
      Object.entries(data.message).forEach(([raca, subracas]) => {
        const racaFormatada = raca.charAt(0).toUpperCase() + raca.slice(1);
        if (subracas.length === 0) {
          listaRacas.push(racaFormatada);
        } else {
          subracas.forEach((subraca) => {
            const subracaFormatada =
              subraca.charAt(0).toUpperCase() + subraca.slice(1);
            listaRacas.push(`${subracaFormatada} ${racaFormatada}`);
          });
        }
      });
      setRacas(listaRacas.sort());
    } catch (error) {
      setRacaError("Não foi possível carregar as raças.");
    } finally {
      setRacaLoading(false);
    }
  };

  const abrirRacas = () => {
    setModalRacas(true);
    if (racas.length === 0) buscarRacasAPI();
  };

  const markApplied = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: "PATCH" });
      if (response.ok) carregarConsultas();
    } catch (error) {
      setMessage("❌ Erro ao atualizar status.");
    }
  };

  const removeItem = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (response.ok) carregarConsultas();
    } catch (error) {
      setMessage("❌ Erro ao remover item.");
    }
  };

  const handleRegister = async () => {
    if (
      petNome.trim() &&
      racaSelecionada &&
      tipoConsulta.trim() &&
      dataDaVacina.trim()
    ) {
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            petNome,
            raca: racaSelecionada,
            tipoConsulta,
            dataDaVacina,
          }),
        });

        if (response.ok) {
          setMessage("✅ Consulta cadastrada com sucesso!");
          setPetNome("");
          setRacaSelecionada("");
          setTipoConsulta("");
          setDataDaVacina("");
          carregarConsultas();
        }
      } catch (error) {
        setMessage("❌ Erro ao salvar no banco de dados.");
      }
    } else {
      setMessage("⚠️ Por favor, preencha todos os campos.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00b894" />
        <Text style={styles.loadingText}>Carregando CaoVida...</Text>
      </View>
    );
  }

  // Formulário renderizado no topo da lista
  const renderHeader = () => (
    <View style={styles.headerContainer}>
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

      <TouchableOpacity style={styles.input} onPress={abrirRacas}>
        <Text style={racaSelecionada ? styles.inputText : styles.placeholder}>
          {racaSelecionada || "Selecionar raça do Pet"}
        </Text>
      </TouchableOpacity>

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
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={vaccines}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ItemLista
            item={item}
            styles={styles}
            markApplied={markApplied}
            removeItem={removeItem}
          />
        )}
      />

      <Modal
        visible={modalRacas}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalRacas(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>🐶 Escolha a raça do cachorro</Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar raça..."
              placeholderTextColor="#777"
              value={buscaRaca}
              onChangeText={setBuscaRaca}
            />

            {racaLoading && (
              <View style={styles.racaLoading}>
                <ActivityIndicator size="large" color="#00b894" />
                <Text>Carregando raças...</Text>
              </View>
            )}

            {racaError !== "" && (
              <Text style={styles.errorText}>{racaError}</Text>
            )}

            {!racaLoading && racaError === "" && (
              <FlatList
                data={racas.filter((raca) =>
                  raca.toLowerCase().includes(buscaRaca.toLowerCase()),
                )}
                keyExtractor={(item, index) => `${item}-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.racaItem}
                    onPress={() => {
                      setRacaSelecionada(item);
                      setModalRacas(false);
                      setBuscaRaca("");
                    }}
                  >
                    <Text style={styles.racaText}>🐕 {item}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Nenhuma raça encontrada.</Text>
                }
              />
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalRacas(false)}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: "#f0f9f4",
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 10,
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
    borderColor: "#00b894",
    padding: 10,
    marginBottom: 15,
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  inputText: {
    color: "#2d3436",
  },
  placeholder: {
    color: "#666d70",
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
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    height: "80%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "#2d3436",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#b2bec3",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    color: "#2d3436",
  },
  racaItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  racaText: {
    fontSize: 17,
    color: "#2d3436",
  },
  racaLoading: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 10,
  },
  errorText: {
    color: "#d63031",
    textAlign: "center",
    margin: 15,
  },
  emptyText: {
    textAlign: "center",
    padding: 20,
    color: "#777",
  },
  closeButton: {
    backgroundColor: "#d63031",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  closeButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});
