import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ListaRacas({ onSelectBreed }) {
  const [racas, setRacas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    buscarRacas();
  }, []);

  async function buscarRacas() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("https://dogapi.dog/api/v2/breeds");

      if (!response.ok) {
        throw new Error("Erro na API");
      }

      const json = await response.json();

      setRacas(json.data);
    } catch (erro) {
      setError("Não foi possível carregar as raças.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View>
        <ActivityIndicator size="large" />
        <Text>Carregando raças...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View>
        <Text>{error}</Text>

        <TouchableOpacity onPress={buscarRacas}>
          <Text>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView>
      {racas.map((raca) => (
        <TouchableOpacity
          key={raca.id}
          onPress={() => onSelectBreed(raca.attributes.name)}
        >
          <Text>{raca.attributes.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
