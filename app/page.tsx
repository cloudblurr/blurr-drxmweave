"use client";

import App from "../App";
import { AuthProvider } from "../components/AuthContext";

export default function HomePage() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
