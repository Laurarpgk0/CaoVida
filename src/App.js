import { StatusBar } from "expo-status-bar";
import CadastroScreen from "../src/screens/CadastroScreen";
import VLibrasWeb from "./a11y/VLibrasWeb";

export default function App() {
  return (
    <>
      <StatusBar style="dark" />

      <CadastroScreen />

      <VLibrasWeb />
    </>
  );
}
