import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { TRPCProvider, trpc } from "@/lib/trpc";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  return (
    <TRPCProvider>
      <RootLayoutNav />
    </TRPCProvider>
  );
}

function RootLayoutNav() {
  const { session, loading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Fetch profile as soon as we have a session.
  // users.me auto-creates the profile row on first sign-in.
  const { data: me, isLoading: meLoading } = trpc.users.me.useQuery(undefined, {
    enabled: !!session,
  });

  useEffect(() => {
    if (authLoading) return;

    const inAuthGroup  = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";

    // Not signed in → always show auth screens
    if (!session) {
      if (!inAuthGroup) router.replace("/(auth)/sign-in");
      return;
    }

    // Signed in but still waiting for the profile to load
    if (meLoading) return;

    // A brand-new user has no fitnessLevel set → send them through onboarding
    const needsOnboarding = !me?.fitnessLevel;

    if (needsOnboarding && !inOnboarding) {
      router.replace("/onboarding");
    } else if (!needsOnboarding && (inAuthGroup || inOnboarding)) {
      router.replace("/(tabs)");
    }
  }, [session, authLoading, segments, me, meLoading]);

  // Show a blank splash while auth loads, or while we determine onboarding status
  if (authLoading || (session && meLoading)) {
    return <View style={{ flex: 1, backgroundColor: "#0D0D0D" }} />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)"      options={{ headerShown: false }} />
      <Stack.Screen name="(auth)"      options={{ headerShown: false }} />
      <Stack.Screen name="onboarding"  options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="goals"       options={{ headerShown: false }} />
      <Stack.Screen name="workouts"    options={{ headerShown: false }} />
      <Stack.Screen name="profile"     options={{ headerShown: false }} />
      <Stack.Screen name="modal"       options={{ presentation: "modal" }} />
    </Stack>
  );
}
