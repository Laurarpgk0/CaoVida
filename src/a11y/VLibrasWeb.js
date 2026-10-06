import { useEffect } from "react";
import { Platform } from "react-native";

export default function VLibrasWeb() {
  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    const iniciar = () => {
      if (!window.VLibras || !window.VLibras.Widget) {
        console.error("VLibras não foi carregado.");
        return;
      }

      if (document.getElementById("vlibras-container")) {
        return;
      }

      const container = document.createElement("div");
      container.id = "vlibras-container";
      container.setAttribute("vw", "true");
      container.className = "enabled";

      const accessButton = document.createElement("div");
      accessButton.setAttribute("vw-access-button", "true");
      accessButton.className = "active";

      const pluginWrapper = document.createElement("div");
      pluginWrapper.setAttribute("vw-plugin-wrapper", "true");

      const topWrapper = document.createElement("div");
      topWrapper.className = "vw-plugin-top-wrapper";

      pluginWrapper.appendChild(topWrapper);
      container.appendChild(accessButton);
      container.appendChild(pluginWrapper);

      document.body.appendChild(container);

      try {
        window.vlibrasWidget = new window.VLibras.Widget(
          "https://vlibras.gov.br/app",
        );
      } catch (error) {
        console.error("Erro ao inicializar VLibras:", error);
      }
    };

    const scriptAtual = document.getElementById("vlibras-script");

    if (scriptAtual) {
      setTimeout(iniciar, 1500);
      return;
    }

    const script = document.createElement("script");

    script.id = "vlibras-script";
    script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
    script.async = true;

    script.onload = () => {
      setTimeout(iniciar, 1500);
    };

    script.onerror = () => {
      console.error("Não foi possível carregar o VLibras.");
    };

    document.body.appendChild(script);
  }, []);

  return null;
}
