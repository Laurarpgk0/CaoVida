import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from "expo-network";
import { useEffect, useRef, useState } from "react";
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
import { useSession } from "../SessionProvider";
import { Ajustes, AText, useA11y } from "../a11y/Acessibilidade";
import Libras from "../a11y/Libras";
import ItemLista from "../components/ItemLista";
import { API_URL } from "../config";
import { enviarNotificacaoLocal } from "../notifications";
import {
  createOperationId,
  formatConsulta,
  loadOfflineState,
  saveOfflineState,
  syncOfflineQueue,
} from "../offlineConsultas";
import { supabase } from "../supabase";

const authFetch = async (url, options = {}) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("Sem sessão");

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${session.access_token}`,
    },
  });
};

export default function CadastroScreen() {
  const { p, cores } = useA11y();
  const { session, signOut } = useSession();
  const userId = session?.user?.id;

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
  const [syncMessage, setSyncMessage] = useState("Verificando conexão...");

  const syncingRef = useRef(false);

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
    divider: {
      borderBottomColor: p.tema === "escuro" ? "#444444" : "#D8D4CC",
    },
    modal: { backgroundColor: cores.inputFundo },
    button: { backgroundColor: cores.botaoVerde },
    removeButton: { backgroundColor: cores.botaoRemover },
    message: {
      borderColor: cores.borda,
      backgroundColor: p.tema === "escuro" ? "#1E1E1E" : "#E9E5DD",
    },
  };

  const sincronizarPendencias = async () => {
    if (!userId || !session?.access_token || syncingRef.current) return;

    const network = await Network.getNetworkStateAsync();

    if (!network.isConnected || network.isInternetReachable === false) {
      setSyncMessage("Sem internet. Alterações salvas no aparelho.");
      return;
    }

    syncingRef.current = true;
    setSyncMessage("Sincronizando alterações...");

    try {
      const result = await syncOfflineQueue(
        userId,
        session.access_token,
        API_URL,
        (state) => {
          setVaccines(state.consultas.map(formatConsulta));
        },
      );

      setSyncMessage(
        result.queue.length === 0
          ? "Consultas sincronizadas."
          : "Existem alterações aguardando sincronização.",
      );
    } catch (error) {
      console.log("Erro na sincronização:", error.message);
      setSyncMessage("Falha na sincronização. Tentaremos novamente.");
    } finally {
      syncingRef.current = false;
    }
  };

  const carregarConsultas = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const localState = await loadOfflineState(userId);

      setVaccines(localState.consultas.map(formatConsulta));

      const network = await Network.getNetworkStateAsync();

      if (!network.isConnected || network.isInternetReachable === false) {
        setSyncMessage("Sem internet. Consultas disponíveis no aparelho.");
        return;
      }

      const response = await authFetch(API_URL);

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`);
      }

      const data = await response.json();

      const deletedIds = new Set(
        localState.queue
          .filter((operation) => operation.type === "delete")
          .map((operation) => operation.targetId),
      );

      const pendingIds = new Set(
        localState.queue
          .filter((operation) => operation.type !== "delete")
          .flatMap((operation) => [operation.localId, operation.targetId])
          .filter(Boolean),
      );

      const pendingItems = localState.consultas.filter((item) =>
        pendingIds.has(item.id),
      );

      const remoteItems = data
        .filter((item) => !deletedIds.has(item._id))
        .map((item) =>
          formatConsulta({
            ...item,
            syncStatus: "synced",
          }),
        );

      const merged = [
        ...pendingItems,
        ...remoteItems.filter(
          (remote) => !pendingItems.some((local) => local.id === remote.id),
        ),
      ];

      const updatedState = {
        consultas: merged,
        queue: localState.queue,
      };

      await saveOfflineState(userId, updatedState);
      setVaccines(merged.map(formatConsulta));
      setMessage("");

      if (updatedState.queue.length > 0) {
        await sincronizarPendencias();
      } else {
        setSyncMessage("Consultas sincronizadas.");
      }
    } catch (error) {
      console.log("Erro ao carregar consultas:", error.message);
      setSyncMessage("Não foi possível atualizar pela internet.");
      setMessage("Exibindo os dados disponíveis no aparelho.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    carregarConsultas();

    const subscription = Network.addNetworkStateListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        carregarConsultas();
      } else {
        setSyncMessage("Sem internet. Alterações salvas no aparelho.");
      }
    });

    return () => subscription.remove();
  }, [userId]);

  const buscarRacasAPI = async () => {
    const chaveRacas = "caovida:racas:cachorro:v1";

    try {
      setRacaLoading(true);
      setRacaError("");

      const salvas = await AsyncStorage.getItem(chaveRacas);

      if (salvas) {
        const listaSalva = JSON.parse(salvas);

        if (Array.isArray(listaSalva) && listaSalva.length > 0) {
          setRacas(listaSalva);
        }
      }

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

      const listaOrdenada = listaRacas.sort();

      await AsyncStorage.setItem(chaveRacas, JSON.stringify(listaOrdenada));

      setRacas(listaOrdenada);
      setRacaError("");
    } catch (error) {
      const salvas = await AsyncStorage.getItem(chaveRacas);

      if (salvas) {
        const listaSalva = JSON.parse(salvas);
        setRacas(listaSalva);
        setRacaError("");
      } else {
        setRacaError(
          "Sem internet e sem raças salvas. Conecte-se à internet uma vez para baixar a lista.",
        );
      }
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
    if (!userId) return;

    try {
      const state = await loadOfflineState(userId);
      const item = state.consultas.find((consulta) => consulta.id === id);

      if (!item) return;

      const createOperation = state.queue.find(
        (operation) => operation.type === "create" && operation.localId === id,
      );

      item.applied = true;
      item.syncStatus = "pending";

      if (createOperation) {
        createOperation.data.applied = true;
      } else {
        state.queue = state.queue.filter(
          (operation) =>
            !(operation.type === "update" && operation.targetId === id),
        );

        state.queue.push({
          id: createOperationId(),
          type: "update",
          targetId: id,
          baseUpdatedAt: item.updatedAt || null,
          data: {
            petNome: item.petNome,
            raca: item.raca,
            tipoConsulta: item.tipoConsulta,
            dataDaVacina: item.dataDaVacina,
            applied: true,
          },
        });
      }

      await saveOfflineState(userId, state);
      setVaccines(state.consultas.map(formatConsulta));
      setSyncMessage("Alteração aguardando sincronização.");

      await sincronizarPendencias();
    } catch (error) {
      console.log("Erro ao atualizar consulta:", error.message);
      setMessage("Não foi possível atualizar a consulta.");
    }
  };

  const resolverConflitoServidor = async (id) => {
    if (!userId) return;

    try {
      const state = await loadOfflineState(userId);
      const item = state.consultas.find((consulta) => consulta.id === id);

      if (!item?.serverVersion) return;

      state.consultas = state.consultas.map((consulta) =>
        consulta.id === id
          ? formatConsulta({
              ...item.serverVersion,
              syncStatus: "synced",
            })
          : consulta,
      );

      state.queue = state.queue.filter(
        (operation) =>
          !(operation.type === "update" && operation.targetId === id),
      );

      await saveOfflineState(userId, state);
      setVaccines(state.consultas.map(formatConsulta));
      setSyncMessage("Versão do servidor mantida.");
    } catch (error) {
      console.log("Erro ao resolver conflito:", error.message);
      setMessage("Não foi possível manter a versão do servidor.");
    }
  };

  const resolverConflitoLocal = async (id) => {
    if (!userId) return;

    try {
      const state = await loadOfflineState(userId);

      const item = state.consultas.find((consulta) => consulta.id === id);

      const operation = state.queue.find(
        (op) => op.type === "update" && op.targetId === id,
      );

      if (!item?.serverVersion || !operation) return;

      operation.baseUpdatedAt = item.serverVersion.updatedAt || null;
      delete operation.status;
      delete item.serverVersion;

      item.syncStatus = "pending";

      await saveOfflineState(userId, state);
      setVaccines(state.consultas.map(formatConsulta));
      setSyncMessage("Enviando sua versão para o servidor...");

      await sincronizarPendencias();
    } catch (error) {
      console.log("Erro ao resolver conflito:", error.message);
      setMessage("Não foi possível reenviar sua versão.");
    }
  };

  const removeItem = async (id) => {
    if (!userId) return;

    try {
      const state = await loadOfflineState(userId);

      const createOperation = state.queue.find(
        (operation) => operation.type === "create" && operation.localId === id,
      );

      if (createOperation) {
        state.queue = state.queue.filter(
          (operation) => operation.localId !== id && operation.targetId !== id,
        );
      } else {
        state.queue = state.queue.filter(
          (operation) =>
            !(operation.type === "update" && operation.targetId === id),
        );

        state.queue.push({
          id: createOperationId(),
          type: "delete",
          targetId: id,
        });
      }

      state.consultas = state.consultas.filter((item) => item.id !== id);

      await saveOfflineState(userId, state);
      setVaccines(state.consultas.map(formatConsulta));
      setSyncMessage("Exclusão aguardando sincronização.");

      await sincronizarPendencias();
    } catch (error) {
      console.log("Erro ao remover consulta:", error.message);
      setMessage("Não foi possível remover a consulta.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();

      setVaccines([]);
      setPetNome("");
      setRacaSelecionada("");
      setTipoConsulta("");
      setDataDaVacina("");
      setMessage("");
    } catch (error) {
      console.error("Erro ao terminar sessão:", error.message);
      setMessage(error.message || "Erro ao terminar sessão.");
    }
  };

  const handleRegister = async () => {
    if (
      !petNome.trim() ||
      !racaSelecionada ||
      !tipoConsulta.trim() ||
      !dataDaVacina.trim()
    ) {
      setMessage("Por favor, preencha todos os campos.");
      return;
    }

    if (!userId) {
      setMessage("Entre na sua conta para cadastrar uma consulta.");
      return;
    }

    try {
      const state = await loadOfflineState(userId);
      const operationId = createOperationId();
      const localId = `local:${operationId}`;

      const novaConsulta = {
        id: localId,
        petNome: petNome.trim(),
        raca: racaSelecionada,
        tipoConsulta: tipoConsulta.trim(),
        dataDaVacina: dataDaVacina.trim(),
        applied: false,
        syncStatus: "pending",
      };

      state.consultas.unshift(novaConsulta);

      state.queue.push({
        id: operationId,
        type: "create",
        localId,
        data: {
          petNome: novaConsulta.petNome,
          raca: novaConsulta.raca,
          tipoConsulta: novaConsulta.tipoConsulta,
          dataDaVacina: novaConsulta.dataDaVacina,
          applied: false,
        },
      });

      await saveOfflineState(userId, state);
      setVaccines(state.consultas.map(formatConsulta));

      setPetNome("");
      setRacaSelecionada("");
      setTipoConsulta("");
      setDataDaVacina("");

      setMessage("Consulta salva no aparelho.");
      setSyncMessage("Pendente de sincronização.");

      const notificacao = await enviarNotificacaoLocal(
        novaConsulta.petNome,
        novaConsulta.tipoConsulta,
      );

      setMessage(
        notificacao.success
          ? "Consulta salva! Notificação enviada com sucesso."
          : notificacao.message,
      );

      await sincronizarPendencias();
    } catch (error) {
      console.log("Erro ao salvar consulta:", error.message);
      setMessage("Erro ao salvar a consulta no aparelho.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, dynamicStyles.container]}>
        <ActivityIndicator size="large" color={cores.botaoVerde} />
        <AText style={styles.loadingText}>Carregando CaoVida... Aguarde</AText>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <ScrollView contentContainerStyle={styles.listContent}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={[styles.logoutButton, dynamicStyles.removeButton]}
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
          >
            <AText style={styles.logoutButtonText}>
              🚪 Sair da Conta (Logout)
            </AText>
          </TouchableOpacity>

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

          <AText style={styles.syncMessage}>{syncMessage}</AText>

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
            resolverConflitoServidor={resolverConflitoServidor}
            resolverConflitoLocal={resolverConflitoLocal}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { marginTop: 10 },
  listContent: { padding: 20, paddingBottom: 40 },
  headerContainer: { marginBottom: 10 },
  logoutButton: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
    minHeight: 48,
    justifyContent: "center",
  },
  logoutButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "bold",
  },
  a11yButton: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
    minHeight: 48,
    justifyContent: "center",
  },
  a11yButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "bold",
  },
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
  buttonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "bold",
  },
  message: {
    marginTop: 20,
    padding: 12,
    textAlign: "center",
    borderWidth: 1,
    borderRadius: 6,
  },
  syncMessage: {
    marginTop: 12,
    textAlign: "center",
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
