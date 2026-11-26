import { StyleSheet, TouchableOpacity, View } from "react-native";
import { AText, useA11y } from "../a11y/Acessibilidade";

const statusSync = {
  synced: "Sincronizada",
  pending: "Pendente de sincronização",
  syncing: "Enviando para o servidor...",
  error: "Falha no envio. Aguardando nova tentativa.",
  conflict: "Conflito: a consulta foi alterada no servidor.",
};

export default function ItemLista({
  item,
  styles: stylesProp,
  markApplied,
  removeItem,
  resolverConflitoServidor,
  resolverConflitoLocal,
}) {
  const { cores } = useA11y();
  const status = item.syncStatus || "synced";
  const temConflito = status === "conflict" && item.serverVersion;

  return (
    <View style={stylesProp?.item || styles.item}>
      <AText style={styles.text}>{item.name}</AText>

      <AText style={styles.syncStatus}>
        {statusSync[status] || "Estado de sincronização desconhecido"}
      </AText>

      {temConflito && (
        <View style={styles.conflictBox}>
          <AText style={styles.conflictTitle}>
            Como deseja resolver este conflito?
          </AText>

          <TouchableOpacity
            style={[
              styles.conflictButton,
              { backgroundColor: cores.botaoVerde },
            ]}
            onPress={() => resolverConflitoServidor(item.id)}
            accessibilityRole="button"
            accessibilityLabel="Manter versão do servidor"
          >
            <AText style={styles.buttonText}>Manter versão do servidor</AText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.conflictButton, { backgroundColor: "#2563A6" }]}
            onPress={() => resolverConflitoLocal(item.id)}
            accessibilityRole="button"
            accessibilityLabel="Manter minha versão"
          >
            <AText style={styles.buttonText}>Manter minha versão</AText>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: cores.botaoVerde }]}
        onPress={() => markApplied(item.id)}
        accessibilityRole="button"
        accessibilityLabel="Marcar consulta como aplicada"
      >
        <AText style={styles.buttonText}>
          {item.applied ? "Aplicada" : "Marcar como aplicada"}
        </AText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.removeButton, { backgroundColor: cores.botaoRemover }]}
        onPress={() => removeItem(item.id)}
        accessibilityRole="button"
        accessibilityLabel="Remover consulta"
      >
        <AText style={styles.buttonText}>Remover</AText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  text: {
    marginBottom: 8,
  },
  syncStatus: {
    marginBottom: 12,
    fontSize: 13,
  },
  conflictBox: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
  },
  conflictTitle: {
    marginBottom: 10,
    fontWeight: "bold",
  },
  conflictButton: {
    padding: 12,
    borderRadius: 6,
    minHeight: 48,
    justifyContent: "center",
    marginBottom: 8,
  },
  button: {
    padding: 12,
    borderRadius: 6,
    minHeight: 48,
    justifyContent: "center",
    marginBottom: 10,
  },
  removeButton: {
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
});
