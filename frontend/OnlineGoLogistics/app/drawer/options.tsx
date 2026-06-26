import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";

export default function Options() {
  return (
   
    
      <Pressable onPress={() => router.replace("/login")}>
        <Text style={{ color: "red", marginTop: 20 }}>Logout</Text>
      </Pressable>
   
  );
}

