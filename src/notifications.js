import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
      alert("Permissão para notificações não concedida.");
      return;
    }

    try {
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: "fefa2ca9-8b96-4944-b576-e89bb85ae27c",
        })
      ).data;
    } catch (error) {
      console.log("Erro ao buscar token do Expo:", error);
    }
  } else {
    alert("Push notifications precisam de um dispositivo físico.");
  }

  if (token) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ expo_push_token: token })
        .eq("id", user.id);

      if (error) {
        console.error("Erro ao salvar token no Supabase:", error);
      }
    }
  }

  return token;
}

export async function enviarNotificacaoLocal(petNome, tipoConsulta) {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Notificações CaoVida",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 500, 250],
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return {
        success: false,
        message: "Consulta salva, mas a permissão de notificação foi negada.",
      };
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "CaoVida - Consulta cadastrada",
        body: `${petNome}: ${tipoConsulta} foi salva no aparelho.`,
        sound: true,
      },
      trigger: null,
    });

    return {
      success: true,
      message: "Notificação enviada com sucesso!",
    };
  } catch (error) {
    console.log("Erro ao enviar notificação local:", error);
    return {
      success: false,
      message: "Consulta salva, mas não foi possível enviar a notificação.",
    };
  }
}
