import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { lazy, Suspense } from "react";
import ScrollToTop from "./components/ScrollToTop";
import HomePage from "./pages/HomePage";
import ChatAssistant from "./components/ChatAssistant";
import { useAuth } from "./auth/authContext";
import type { ReactNode } from "react";

const AdminDashboard = lazy(() => import("./admin/LiveDashboard"));
const AdminGalleries = lazy(() => import("./admin/PrivateGalleries"));
const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const AdminPackages = lazy(() => import("./admin/AdminPackages"));
const LiveTodoList = lazy(() => import("./admin/LiveTodoList"));
const PaymentProofs = lazy(() => import("./admin/PaymentProofs"));
const AdminWalkInBooking = lazy(() => import("./admin/AdminWalkInBooking"));
const BookingTeamAssignments = lazy(() => import("./admin/BookingTeamAssignments"));
const ClientGalleries = lazy(() => import("./client/PrivateGalleries"));
const ClientLayout = lazy(() => import("./client/ClientLayout"));
const LiveRecords = lazy(() => import("./components/LiveRecords"));
const FeatureUnavailable = lazy(() => import("./components/FeatureUnavailable"));
const BookingViews = lazy(() => import("./components/BookingViews"));
const NotificationsPage = lazy(() => import("./components/NotificationsPage"));
const TeamPortal = lazy(() => import("./photographer/TeamPortal"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const PortfolioManager = lazy(() => import("./admin/PortfolioManager"));
const TeamDirectory = lazy(() => import("./admin/TeamDirectory"));
const PublicPortfolio = lazy(() => import("./pages/PublicPortfolio"));
const BookingPage = lazy(() => import("./pages/BookingPage"));

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

      <Suspense fallback={<p role="status">Loading page...</p>}><Routes>
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
      </Routes></Suspense>

      <ChatAssistant />

    </>
  );
}

export default App;
