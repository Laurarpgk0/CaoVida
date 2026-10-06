import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ajustes, AText, useA11y } from "../a11y/Acessibilidade";
import Libras from "../a11y/Libras";
import ItemLista from "../components/ItemLista";

const API_URL = "https://caovida-backend.onrender.com/api/consultas";

export default function CadastroScreen() {
  const { p, cores } = useA11y();
  const [petNome, setPetNome] = useState("");
  const [tipoConsulta, setTipoConsulta] = useState("");
  const [dataDaVacina, setDataDaVacina] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [racas, setRacas] = useState([]);
  const [racaLoading, setRacaLoading] = useState(false);
  const [racaError, setRacaError] = useState("");
  const [modalRacas, setModalRacas] = useState(false);
  const [modalA11y, setModalA11y] = useState(false);
  const [buscaRaca, setBuscaRaca] = useState("");
  const [racaSelecionada, setRacaSelecionada] = useState("");
  const [vaccines, setVaccines] = useState([]);

  const dynamicStyles = {
    container: { flex: 1, backgroundColor: cores.fundo },
    input: {
      borderWidth: 1,
      borderColor: cores.borda,
      padding: 12,
      marginBottom: 15,
      borderRadius: 6,
      backgroundColor: cores.inputFundo,
      minHeight: 48,
    },
    inputText: { color: cores.texto },
    placeholder: { color: cores.placeholder },
    card: {
      backgroundColor: cores.card,
      borderColor: cores.borda,
      borderWidth: p.tema === "escuro" ? 1 : 0,
    },
    divider: { borderBottomColor: p.tema === "escuro" ? "#444444" : "#D8D4CC" },
    modal: { backgroundColor: cores.inputFundo },
    button: { backgroundColor: cores.botaoVerde },
    removeButton: { backgroundColor: cores.botaoRemover },
    message: {
      borderColor: cores.borda,
      backgroundColor: p.tema === "escuro" ? "#1E1E1E" : "#E9E5DD",
    },
  };

  const carregarConsultas = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      const listFormatada = data.map((item) => ({
        id: item._id,
        name: `${item.petNome} da raça ${item.raca} marcou a consulta ${item.tipoConsulta} para a data ${item.dataDaVacina}`,
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
      if (!response.ok) {
        throw new Error("Erro ao consultar a API");
      }
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
    if (racas.length === 0) {
      buscarRacasAPI();
    }
  };

  const markApplied = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: "PATCH" });
      if (response.ok) {
        carregarConsultas();
      }
    } catch (error) {
      setMessage("❌ Erro ao atualizar status.");
    }
  };

  const removeItem = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (response.ok) {
        carregarConsultas();
      }
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
      <View style={[styles.loadingContainer, dynamicStyles.container]}>
        <ActivityIndicator size="large" color={cores.botaoVerde} />
        <AText style={styles.loadingText}>Carregando CaoVida...</AText>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <ScrollView contentContainerStyle={styles.listContent}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={[styles.a11yButton, { backgroundColor: cores.botaoVerde }]}
            onPress={() => setModalA11y(true)}
            accessibilityRole="button"
            accessibilityLabel="Abrir painel de ajustes de acessibilidade"
          >
            <AText style={styles.a11yButtonText}>
              ⚙️ Ajustes de Acessibilidade
            </AText>
          </TouchableOpacity>

          <AText accessibilityRole="header" style={styles.title}>
            🐾 CaoVida
          </AText>

          <AText style={styles.subtitle}>Controle de vacinas e consultas</AText>

          <View style={styles.librasContainer}>
            <Libras />
          </View>

          <TextInput
            style={[dynamicStyles.input, dynamicStyles.inputText]}
            placeholder="Nome do Pet"
            placeholderTextColor={cores.placeholder}
            value={petNome}
            onChangeText={setPetNome}
            accessibilityLabel="Nome do Pet"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          <TouchableOpacity
            style={dynamicStyles.input}
            onPress={abrirRacas}
            accessibilityRole="button"
            accessibilityLabel={
              racaSelecionada
                ? `Raça selecionada: ${racaSelecionada}`
                : "Selecionar raça do Pet"
            }
          >
            <AText
              style={
                racaSelecionada
                  ? dynamicStyles.inputText
                  : dynamicStyles.placeholder
              }
            >
              {racaSelecionada || "Selecionar raça do Pet"}
            </AText>
          </TouchableOpacity>

          <TextInput
            style={[dynamicStyles.input, dynamicStyles.inputText]}
            placeholder="Tipo de consulta"
            placeholderTextColor={cores.placeholder}
            value={tipoConsulta}
            onChangeText={setTipoConsulta}
            accessibilityLabel="Tipo de consulta"
          />

          <TextInput
            style={[dynamicStyles.input, dynamicStyles.inputText]}
            placeholder="Data da consulta (dd/mm/aaaa)"
            placeholderTextColor={cores.placeholder}
            value={dataDaVacina}
            onChangeText={setDataDaVacina}
            accessibilityLabel="Data da consulta no formato dia, mês e ano"
          />

          <TouchableOpacity
            style={[styles.button, dynamicStyles.button]}
            onPress={handleRegister}
            accessibilityRole="button"
            accessibilityLabel="Cadastrar Consulta"
          >
            <AText style={styles.buttonText}>Cadastrar Consulta</AText>
          </TouchableOpacity>

          {message !== "" && (
            <AText
              accessibilityRole="alert"
              style={[styles.message, dynamicStyles.message]}
            >
              {message}
            </AText>
          )}

          <AText accessibilityRole="header" style={styles.sectionTitle}>
            Vacinas e consultas
          </AText>
        </View>

        {vaccines.map((item) => (
          <ItemLista
            key={item.id}
            item={item}
            styles={{
              ...styles,
              item: [styles.item, dynamicStyles.card],
              button: [styles.button, dynamicStyles.button],
              removeButton: [styles.removeButton, dynamicStyles.removeButton],
            }}
            markApplied={markApplied}
            removeItem={removeItem}
          />
        ))}
      </ScrollView>

      <Modal
        visible={modalA11y}
        animationType="slide"
        onRequestClose={() => setModalA11y(false)}
      >
        <View style={dynamicStyles.container}>
          <Ajustes />
          <TouchableOpacity
            style={[styles.closeA11yButton, dynamicStyles.removeButton]}
            onPress={() => setModalA11y(false)}
          >
            <AText style={styles.closeButtonText}>Fechar Ajustes</AText>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        visible={modalRacas}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalRacas(false)}
      >
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainer, dynamicStyles.modal]}>
            <AText accessibilityRole="header" style={styles.modalTitle}>
              🐶 Escolha a raça do cachorro
            </AText>

            <TextInput
              style={[
                dynamicStyles.input,
                dynamicStyles.inputText,
                { marginBottom: 10 },
              ]}
              placeholder="Pesquisar raça..."
              placeholderTextColor={cores.placeholder}
              value={buscaRaca}
              onChangeText={setBuscaRaca}
            />

            {racaLoading && (
              <View style={styles.racaLoading}>
                <ActivityIndicator size="large" color={cores.botaoVerde} />
                <AText>Carregando raças...</AText>
              </View>
            )}

            {racaError !== "" && (
              <AText accessibilityRole="alert" style={styles.errorText}>
                {racaError}
              </AText>
            )}

            {!racaLoading && racaError === "" && (
              <FlatList
                data={racas.filter((raca) =>
                  raca.toLowerCase().includes(buscaRaca.toLowerCase()),
                )}
                keyExtractor={(item, index) => `${item}-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.racaItem, dynamicStyles.divider]}
                    onPress={() => {
                      setRacaSelecionada(item);
                      setModalRacas(false);
                      setBuscaRaca("");
                    }}
                  >
                    <AText style={styles.racaText}>🐕 {item}</AText>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <AText style={styles.emptyText}>
                    Nenhuma raça encontrada.
                  </AText>
                }
              />
            )}

            <TouchableOpacity
              style={[styles.closeButton, dynamicStyles.removeButton]}
              onPress={() => setModalRacas(false)}
            >
              <AText style={styles.closeButtonText}>Fechar</AText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10 },
  listContent: { padding: 20, paddingBottom: 40 },
  headerContainer: { marginBottom: 10 },
  a11yButton: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
    minHeight: 48,
    justifyContent: "center",
  },
  a11yButtonText: { color: "#FFFFFF", textAlign: "center", fontWeight: "bold" },
  title: {
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    fontSize: 24,
  },
  subtitle: { textAlign: "center", marginBottom: 20 },
  librasContainer: { marginVertical: 10, padding: 10, borderRadius: 8 },
  button: {
    padding: 12,
    borderRadius: 6,
    minHeight: 48,
    justifyContent: "center",
  },
  buttonText: { color: "#FFFFFF", textAlign: "center", fontWeight: "bold" },
  message: {
    marginTop: 20,
    padding: 12,
    textAlign: "center",
    borderWidth: 1,
    borderRadius: 6,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    fontSize: 20,
  },
  item: { marginBottom: 15, padding: 15, borderRadius: 8 },
  removeButton: { marginTop: 8, padding: 10, borderRadius: 5 },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: { borderRadius: 15, padding: 20, height: "80%" },
  modalTitle: {
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    fontSize: 22,
  },
  racaItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  racaText: { fontSize: 16 },
  racaLoading: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 10,
  },
  errorText: { color: "#D63031", textAlign: "center", margin: 15 },
  emptyText: { textAlign: "center", padding: 20 },
  closeButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    minHeight: 48,
    justifyContent: "center",
  },
  closeA11yButton: {
    padding: 15,
    margin: 20,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "bold",
  },
});
