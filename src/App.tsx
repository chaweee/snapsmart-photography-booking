import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import AdminDashboard from "./admin/LiveDashboard";
import AdminGalleries from "./admin/PrivateGalleries";
import AdminLayout from "./admin/AdminLayout";
import AdminPackages from "./admin/AdminPackages";
import LiveTodoList from "./admin/LiveTodoList";
import PaymentProofs from "./admin/PaymentProofs";
import AdminWalkInBooking from "./admin/AdminWalkInBooking";
import BookingTeamAssignments from "./admin/BookingTeamAssignments";
import ClientGalleries from "./client/PrivateGalleries";
import ClientLayout from "./client/ClientLayout";
import LiveRecords from "./components/LiveRecords";
import FeatureUnavailable from "./components/FeatureUnavailable";
import BookingViews from "./components/BookingViews";
import NotificationsPage from "./components/NotificationsPage";
import TeamPortal from "./photographer/TeamPortal";
import ScrollToTop from "./components/ScrollToTop";
import AuthPage from "./pages/AuthPage";
import PortfolioManager from "./admin/PortfolioManager";
import TeamDirectory from "./admin/TeamDirectory";
import PublicPortfolio from "./pages/PublicPortfolio";
import BookingPage from "./pages/BookingPage";
import HomePage from "./pages/HomePage";
import ChatAssistant from "./components/ChatAssistant";
import { useAuth } from "./auth/authContext";
import type { ReactNode } from "react";

function ProtectedRoute({ children, roles }: { children: ReactNode; roles: string[] }) {
  const { session, role, loading } = useAuth();
  if (loading) return <p>Loading account...</p>;
  if (!session) return <Navigate to="/login" replace />;
  if (!role || !roles.includes(role)) return <p>Access denied. Please contact an administrator if your account role is incorrect.</p>;
  return children;
}

function RequireLogin({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <p>Loading account...</p>;
  return session ? children : <Navigate to="/login" replace />;
}

function App() {
  const { session } = useAuth();

  return (
    <>
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<HomePage isLoggedIn={!!session} />} />

        <Route
          path="/portfolio"
          element={<PublicPortfolio />}
        />

        <Route path="/album-preview" element={<FeatureUnavailable title="Album preview" publicPage />} />

        <Route path="/book" element={<RequireLogin><BookingPage /></RequireLogin>} />

        <Route path="/login" element={<AuthPage key="login" />} />
        <Route path="/signup" element={<AuthPage key="signup" />} />

        <Route path="/client" element={<ProtectedRoute roles={['client']}><ClientLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/client/bookings" replace />} />
          <Route path="bookings" element={<BookingViews key="clientBookings" mode="client" />} />
          <Route path="galleries" element={<ClientGalleries />} />
          <Route path="notifications" element={<NotificationsPage mode="client" />} />
        </Route>

        <Route path="/photographer" element={<ProtectedRoute roles={['photographer', 'videographer']}><TeamPortal /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="bookings" element={<><BookingViews key="adminBookings" mode="admin" /><BookingTeamAssignments /></>} />
          <Route path="walk-in-booking" element={<AdminWalkInBooking />} />
          <Route path="calendar" element={<BookingViews key="adminCalendar" mode="calendar" />} />
          <Route path="payments" element={<PaymentProofs />} />
          <Route path="clients" element={<LiveRecords key="adminClients" kind="adminClients" />} />
          <Route path="galleries" element={<AdminGalleries />} />
          <Route path="portfolio" element={<PortfolioManager />} />
          <Route path="packages" element={<AdminPackages />} />
          <Route path="team-members" element={<TeamDirectory />} />
          <Route path="to-do-list" element={<LiveTodoList />} />
          <Route path="notifications" element={<NotificationsPage mode="admin" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ChatAssistant />

    </>
  );
}

export default App;
