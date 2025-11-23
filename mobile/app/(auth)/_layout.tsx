import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../hooks/useAuth";

export default function AuthRoutesLayout() {
  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isSignedIn) {
    return <Redirect href={"/(home)/(tabs)/home"} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
