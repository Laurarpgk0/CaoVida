import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";

const padrao = { tema: "claro", escala: 1 };
const chave = "p2.acessibilidade";

const Ctx = createContext(null);

export function AcessibilidadeProvider({ children }) {
  const [p, setP] = useState(padrao);
  const [pronto, setPronto] = useState(false);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    let vivo = true;
    AsyncStorage.getItem(chave)
      .then((raw) => {
        if (raw && vivo) {
          const x = JSON.parse(raw);
          setP({
            tema: x.tema === "escuro" ? "escuro" : "claro",
            escala: [1, 1.25, 1.5].includes(x.escala) ? x.escala : 1,
          });
        }
      })
      .catch(() => {
        if (vivo) setAviso("Não foi possível recuperar as preferências");
      })
      .finally(() => {
        if (vivo) setPronto(true);
      });
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    if (pronto) {
      AsyncStorage.setItem(chave, JSON.stringify(p)).catch(() =>
        setAviso("Não foi possível salvar as preferências"),
      );
    }
  }, [p, pronto]);

  const cores =
    p.tema === "escuro"
      ? {
          fundo: "#121212",
          texto: "#FFFFFF", // Texto principal em branco no modo escuro
          borda: "#38C194",
          inputFundo: "#1E1E1E",
          placeholder: "#A0A0A0", // Placeholder visível no modo escuro
          card: "#2D3436",
          botaoVerde: "#38C194",
          botaoRemover: "#D63031",
        }
      : {
          fundo: "#FAF9E8",
          texto: "#2D3436", // Texto escuro no fundo claro
          borda: "#38C194",
          inputFundo: "#FAF9E8",
          placeholder: "#788285", // Placeholder visível no modo claro
          card: "#E9E5DD",
          botaoVerde: "#38C194",
          botaoRemover: "#C0392B",
        };

  return (
    <Ctx.Provider
      value={{ p, mudar: (x) => setP((v) => ({ ...v, ...x })), cores, aviso }}
    >
      {pronto ? children : <Text>Carregando preferências…</Text>}
    </Ctx.Provider>
  );
}

export function useA11y() {
  const c = useContext(Ctx);
  if (!c) throw new Error("Adicione AcessibilidadeProvider");
  return c;
}

export function AText({ style, ...props }) {
  const { p, cores } = useA11y();
  return (
    <Text
      {...props}
      allowFontScaling
      style={[
        {
          color: cores.texto,
          fontSize: 16 * p.escala,
          lineHeight: 24 * p.escala,
        },
        style,
      ]}
    />
  );
}

export function Ajustes() {
  const { p, mudar, cores, aviso } = useA11y();
  return (
    <ScrollView
      style={{ backgroundColor: cores.fundo }}
      contentContainerStyle={{ padding: 20, gap: 16 }}
    >
      <AText accessibilityRole="header">Acessibilidade</AText>
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel="Tema escuro"
        accessibilityState={{ checked: p.tema === "escuro" }}
        onPress={() => mudar({ tema: p.tema === "claro" ? "escuro" : "claro" })}
        style={{
          minHeight: 48,
          padding: 12,
          borderWidth: 1,
          borderColor: cores.borda,
          borderRadius: 6,
        }}
      >
        <AText>Tema atual: {p.tema}</AText>
      </Pressable>
      {[1, 1.25, 1.5].map((escala) => (
        <Pressable
          key={escala}
          accessibilityRole="button"
          accessibilityLabel={`Fonte ${escala * 100} por cento`}
          accessibilityState={{ selected: p.escala === escala }}
          onPress={() => mudar({ escala })}
          style={{
            minHeight: 48,
            padding: 12,
            borderWidth: p.escala === escala ? 2 : 1,
            borderColor: cores.borda,
            borderRadius: 6,
          }}
        >
          <AText>Fonte {escala * 100}%</AText>
        </Pressable>
      ))}
      <AText>
        Texto de teste: confira se a leitura e a navegação continuam possíveis
        com a maior fonte.
      </AText>
      {!!aviso && <AText accessibilityRole="alert">{aviso}</AText>}
    </ScrollView>
  );
}
