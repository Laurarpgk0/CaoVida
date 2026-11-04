import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 500, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("Falha ao obter token para push notification!");
      return;
    }

    // Obter o Expo Push Token
    try {
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: "fefa2ca9-8b96-4944-b576-e89bb85ae27c",
        })
      ).data;
    } catch (e) {
      console.log("Erro ao buscar token do Expo:", e);
    }
  } else {
    alert("Notificações Push só funcionam em dispositivos físicos.");
  }

  // Persistir o token no Supabase para o usuário atual
  if (token) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ expo_push_token: token })
        .eq("id", user.id);

      if (error) console.error("Erro ao salvar token no Supabase:", error);
    }
  }

  return token;
}
