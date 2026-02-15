import React from "react";
import { View } from "react-native";

type CardProps = {
  children: React.ReactNode;
};

export function Card({ children }: CardProps) {
  return (
    <View
      style={{
        borderRadius: 18,
        borderCurve: "continuous",
        padding: 16,
        gap: 12,
        backgroundColor: "#ffffff",
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
      }}
    >
      {children}
    </View>
  );
}
