import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import { lazy, Suspense } from "react";
import ScrollToTop from "./components/ScrollToTop";
import HomePage from "./pages/HomePage";
import ChatAssistant from "./components/ChatAssistant";
import IdleLogout from "./components/IdleLogout";
import { useAuth } from "./auth/authContext";
import type { ReactNode } from "react";
import { adminPageLoaders } from "./lib/adminPageLoaders";

const AdminDashboard = lazy(adminPageLoaders.dashboard);
const AdminGalleries = lazy(adminPageLoaders.galleries);
const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const AdminPackages = lazy(adminPageLoaders.packages);
const LiveTodoList = lazy(adminPageLoaders.todoList);
const PaymentProofs = lazy(adminPageLoaders.payments);
const AdminWalkInBooking = lazy(adminPageLoaders.walkIn);
const BookingTeamAssignments = lazy(adminPageLoaders.teamAssignments);
const ClientGalleries = lazy(() => import("./client/PrivateGalleries"));
const ClientLayout = lazy(() => import("./client/ClientLayout"));
const LiveRecords = lazy(adminPageLoaders.records);
const FeatureUnavailable = lazy(() => import("./components/FeatureUnavailable"));
const BookingViews = lazy(adminPageLoaders.bookingViews);
const NotificationsPage = lazy(adminPageLoaders.notifications);
const TeamPortal = lazy(() => import("./photographer/TeamPortal"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const PortfolioManager = lazy(adminPageLoaders.portfolio);
const TeamDirectory = lazy(adminPageLoaders.teamDirectory);
const PublicPortfolio = lazy(() => import("./pages/PublicPortfolio"));
const BookingPage = lazy(() => import("./pages/BookingPage"));
const RegistrationConfirmed = lazy(() => import("./pages/RegistrationConfirmed"));

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
  const { pathname } = useLocation();

  return (
    <>
      <ScrollToTop />
      {/* Signed-in users are logged out after 15 minutes of inactivity. */}
      <IdleLogout />

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
        <Route path="/auth/confirmed" element={<RegistrationConfirmed />} />

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

      {/* The booking assistant is for clients and visitors: not on the admin or team portals, and not over the log in / sign up forms. */}
      {!/^\/(?:admin|photographer|login|signup|auth)(?:\/|$)/.test(pathname) && <ChatAssistant />}

    </>
  );
}

export default App;
