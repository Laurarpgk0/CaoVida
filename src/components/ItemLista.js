import { StyleSheet, TouchableOpacity, View } from "react-native";
import { AText, useA11y } from "../a11y/Acessibilidade";

export default function ItemLista({
  item,
  styles: stylesProp,
  markApplied,
  removeItem,
}) {
  const { cores } = useA11y();

  return (
    <View style={stylesProp?.item || styles.item}>
      {/* Usar AText em vez de Text garante que a cor do texto siga a preferência do tema (cores.texto) */}
      <AText style={styles.text}>{item.name}</AText>

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
    marginBottom: 12,
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
