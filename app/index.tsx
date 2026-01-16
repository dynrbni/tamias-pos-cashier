import { Redirect } from "expo-router";

export default function Index() {
    // Redirect to login on app start
    return <Redirect href="/login" />;
}
