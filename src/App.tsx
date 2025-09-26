import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import SoftphoneProvider from "./contexts/SoftphoneProviderSipMl5";

import Layout from "./components/layout/Layout";
import ErrorBoundary from "./components/common/ErrorBoundary";
import LoginForm from "./components/auth/LoginForm";
import Dashboard from "./components/dashboard/Dashboard";
import LandingPage from "./components/landing/LandingPage";
import ProtocolPage from "./components/protocol/ProtocolPage";

// Solicitar permissão para notificações
const requestNotificationPermission = async () => {
  if ("Notification" in window && Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    console.log("Permissão de notificação:", permission);
  }
};

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35]"></div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  // Adicionar este useEffect para solicitar permissões
  React.useEffect(() => {
    // Solicitar permissões ao carregar a aplicação
    requestNotificationPermission();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/home" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route
          path="/login"
          element={!user ? <LoginForm /> : <Navigate to="/" />}
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <SocketProvider>
                <ErrorBoundary>
                  <SoftphoneProvider>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/protocols" element={<Dashboard />} />
                        <Route path="/protocol/:protocolNumber" element={<ProtocolPage />} />
                        <Route path="/chat" element={<Dashboard />} />
                        <Route path="/pending" element={<Dashboard />} />
                        <Route path="/completed" element={<Dashboard />} />
                        <Route path="/departments" element={<Dashboard />} />
                        <Route path="/reports" element={<Dashboard />} />
                        <Route path="/settings" element={<Dashboard />} />
                      </Routes>
                    </Layout>
                  </SoftphoneProvider>
                </ErrorBoundary>
              </SocketProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#404040",
              color: "#fff",
            },
            success: {
              style: {
                background: "#28A745",
              },
            },
            error: {
              style: {
                background: "#dc2626",
              },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
