import { StatusBar } from "expo-status-bar";
import { AcessibilidadeProvider } from "../a11y/Acessibilidade";

import VLibrasWeb from "../a11y/VLibrasWeb";
import CadastroScreen from "../screens/CadastroScreen";

export default function App() {
  return (
    <AcessibilidadeProvider>
      <StatusBar style="dark" />
      <CadastroScreen />
      <VLibrasWeb />
    </AcessibilidadeProvider>
  );
}
