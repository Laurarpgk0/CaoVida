import { Text, TouchableOpacity, View } from "react-native";

export default function ItemLista({ item, styles, markApplied, removeItem }) {
  return (
    <View style={[styles.item, item.applied && styles.itemApplied]}>
      <Text style={styles.text}>{item.name}</Text>

      {!item.applied && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => markApplied(item.id)}
        >
          <Text style={styles.buttonText}>Marcar como aplicada</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeItem(item.id)}
      >
        <Text style={styles.buttonText}>Remover</Text>
      </TouchableOpacity>
    </View>
  );
}
