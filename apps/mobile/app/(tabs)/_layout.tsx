import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";

function TabIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={22} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0D0D0D",
          borderTopColor: "#1E1E1E",
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: "#22C55E",
        tabBarInactiveTintColor: "#555",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
