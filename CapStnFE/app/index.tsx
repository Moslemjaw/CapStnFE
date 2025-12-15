import { Redirect } from "expo-router";
import { useContext } from "react";
import AuthContext from "@/context/AuthContext";

export default function Index() {
  const { isAuthenticated } = useContext(AuthContext);

  if (isAuthenticated) {
    return <Redirect href={"/(protected)/choose-path" as any} />;
  }

  return <Redirect href="/(auth)/login" />;
}
