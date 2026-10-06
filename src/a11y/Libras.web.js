import { useVideoPlayer, VideoView } from "expo-video";
import { Text, View } from "react-native";

function VideoLibras({ uri }) {
  const player = useVideoPlayer(uri);

  return (
    <View>
      <Text accessibilityRole="header">Orientações em Libras</Text>

      <VideoView
        player={player}
        nativeControls
        style={{ width: "100%", height: 240 }}
      />

      <Text>Use os controles para iniciar ou pausar o vídeo.</Text>
    </View>
  );
}

export default function Libras() {
  const uri = process.env.EXPO_PUBLIC_LIBRAS_VIDEO_URL;

  if (!uri) {
    return null;
  }

  return <VideoLibras uri={uri} />;
}
