import AsyncStorage from "@react-native-async-storage/async-storage";

const storageKey = (userId) => `caovida:offline:${userId}`;

export const createOperationId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

export const formatConsulta = (item) => ({
  ...item,
  id: item._id || item.id,
  name: `${item.petNome} da raça ${item.raca} marcou a consulta ${item.tipoConsulta} para a data ${item.dataDaVacina}`,
  applied: Boolean(item.applied),
});

export async function loadOfflineState(userId) {
  const value = await AsyncStorage.getItem(storageKey(userId));

  if (!value) return { consultas: [], queue: [] };

  try {
    const data = JSON.parse(value);

    return {
      consultas: Array.isArray(data.consultas) ? data.consultas : [],
      queue: Array.isArray(data.queue) ? data.queue : [],
    };
  } catch {
    return { consultas: [], queue: [] };
  }
}

export async function saveOfflineState(userId, state) {
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(state));
}

export async function syncOfflineQueue(userId, accessToken, apiUrl, onChange) {
  const state = await loadOfflineState(userId);

  while (state.queue.length > 0) {
    const operation = state.queue[0];

    if (operation.status === "conflict") break;

    const localItem = state.consultas.find(
      (item) => item.id === operation.localId || item.id === operation.targetId,
    );

    if (localItem) localItem.syncStatus = "syncing";

    await saveOfflineState(userId, state);
    onChange?.(state);

    try {
      let response;

      if (operation.type === "create") {
        response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ...operation.data,
            clientMutationId: operation.id,
          }),
        });
      }

      if (operation.type === "update") {
        response = await fetch(`${apiUrl}/${operation.targetId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ...(operation.data || {}),
            baseUpdatedAt: operation.baseUpdatedAt,
          }),
        });
      }

      if (operation.type === "delete") {
        response = await fetch(`${apiUrl}/${operation.targetId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }

      if (
        !response ||
        (!response.ok &&
          !(operation.type === "delete" && response.status === 404))
      ) {
        const error = new Error(`Erro HTTP ${response?.status || 0}`);
        error.status = response?.status;

        if (response?.status === 409) {
          const responseText = await response.text();

          try {
            error.details = JSON.parse(responseText);
          } catch {
            console.log("Resposta do conflito:", responseText);
          }

          console.log("Dados do conflito:", error.details);
        }

        throw error;
      }

      if (operation.type === "create") {
        const serverItem = await response.json();
        const serverId = serverItem._id;

        const index = state.consultas.findIndex(
          (item) => item.id === operation.localId,
        );

        if (index !== -1) {
          state.consultas[index] = formatConsulta({
            ...serverItem,
            syncStatus: "synced",
          });
        }

        state.queue.forEach((pending) => {
          if (pending.targetId === operation.localId) {
            pending.targetId = serverId;

            if (pending.type === "update") {
              pending.baseUpdatedAt = serverItem.updatedAt;
            }
          }
        });
      }

      if (operation.type === "update") {
        const serverItem = await response.json();

        const index = state.consultas.findIndex(
          (item) => item.id === operation.targetId,
        );

        if (index !== -1) {
          state.consultas[index] = formatConsulta({
            ...serverItem,
            syncStatus: "synced",
          });
        }
      }

      if (operation.type === "delete") {
        state.consultas = state.consultas.filter(
          (item) => item.id !== operation.targetId,
        );
      }

      state.queue.shift();
      await saveOfflineState(userId, state);
      onChange?.(state);
    } catch (error) {
      operation.status = error.status === 409 ? "conflict" : "error";

      if (localItem) {
        localItem.syncStatus = operation.status;

        if (error.details?.current) {
          localItem.serverVersion = error.details.current;
        }
      }

      await saveOfflineState(userId, state);
      onChange?.(state);
      break;
    }
  }

  return state;
}
