import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { AText, useA11y } from "./Acessibilidade";

export default function Libras() {
  const [modalVisivel, setModalVisivel] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const { cores } = useA11y();

  const htmlVLibras = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background-color: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .card-texto {
            background-color: #f0f4f8;
            border-left: 4px solid #2980b9;
            padding: 15px;
            border-radius: 8px;
            width: 90%;
            margin-top: 15px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }
          h3 { margin-top: 0; color: #2c3e50; font-size: 18px; text-align: center; }
          p { color: #34495e; font-size: 16px; line-height: 1.4; margin: 0; }
          .instrucao {
            margin-top: 15px;
            font-size: 13px;
            color: #7f8c8d;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <h3>🤟 Tradução em Libras - CãoVida</h3>

        <div class="card-texto">
          <p id="texto-para-traduzir">
            Bem-vindo ao CãoVida! Preencha o formulário para agendar vacinas e consultas para o seu pet.
          </p>
        </div>

        <p class="instrucao">Aguarde o avatar carregar ou toque no ícone azul na lateral.</p>

        <!-- Widget Oficial do VLibras -->
        <div vw class="enabled">
          <div vw-access-button class="active"></div>
          <div vw-plugin-wrapper>
            <div class="vw-plugin-top-wrapper"></div>
          </div>
        </div>

        <script src="https://vlibras.gov.br/app/vlibras-plugin.js"></script>
        <script>
          let widget;
          window.onload = function() {
            widget = new window.VLibras.Widget('https://vlibras.gov.br/app');
            
            // Força a tradução do texto automaticamente após a inicialização
            setTimeout(() => {
              const texto = document.getElementById('texto-para-traduzir').innerText;
              if (widget && widget.plugin) {
                widget.plugin.translate(texto);
              }
            }, 3500); // 3.5 segundos para dar tempo do avatar 3D carregar na memória
          };
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.librasButton}
        onPress={() => setModalVisivel(true)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Abrir tradutor de Libras"
      >
        <AText style={styles.librasButtonText}>🤟 Tradutor de Libras</AText>
      </TouchableOpacity>

      <Modal
        visible={modalVisivel}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          <TouchableOpacity
            style={[
              styles.closeButton,
              { backgroundColor: cores.botaoRemover || "#E73638" },
            ]}
            onPress={() => {
              setModalVisivel(false);
              setCarregando(true);
            }}
          >
            <AText style={styles.closeButtonText}>Fechar Libras</AText>
          </TouchableOpacity>

          {carregando && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2980b9" />
              <AText style={{ marginTop: 10 }}>
                Carregando avatar 3D do VLibras...
              </AText>
            </View>
          )}

          <WebView
            originWhitelist={["*"]}
            source={{ html: htmlVLibras }}
            style={{ flex: 1, opacity: carregando ? 0 : 1 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            androidHardwareAccelerationDisabled={false}
            onLoadEnd={() => setCarregando(false)}
            onError={() => setCarregando(false)}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  librasButton: {
    backgroundColor: "#2980b9",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  librasButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  closeButton: {
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
});
