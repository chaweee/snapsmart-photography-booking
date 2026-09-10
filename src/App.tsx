import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import AdminBookings from "./admin/AdminBookings";
import AdminCalendar from "./admin/AdminCalendar";
import AdminDashboard from "./admin/AdminDashboard";
import AdminLayout from "./admin/AdminLayout";
import AdminPackages from "./admin/AdminPackages";
import AdminPayments from "./admin/AdminPayments";
import AdminClients from "./admin/AdminClients";
import AdminGalleries from "./admin/AdminGalleries";
import AdminTeamMembers from "./admin/AdminTeamMembers";
import AdminNotifications from "./admin/AdminNotifications";
import AdminTodoList from "./admin/AdminTodoList";
import AdminWalkInBooking from "./admin/AdminWalkInBooking";
import ClientBookings from "./client/ClientBookings";
import ClientGalleries from "./client/ClientGalleries";
import ClientLayout from "./client/ClientLayout";
import ClientNotifications from "./client/ClientNotifications";
import ScrollToTop from "./components/ScrollToTop";
import AuthPage from "./pages/AuthPage";
import BookingPage from "./pages/BookingPage";
import AlbumPreviewPage from "./pages/AlbumPreviewPage";
import HomePage from "./pages/HomePage";
import PortfolioPage from "./pages/PortfolioPage";

function App() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<HomePage isLoggedIn={false} />} />

        <Route
          path="/portfolio"
          element={<PortfolioPage isLoggedIn={false} />}
        />

        <Route path="/book" element={<BookingPage />} />

        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />

        <Route path="/client" element={<ClientLayout />}>
          <Route index element={<Navigate to="/client/bookings" replace />} />
          <Route path="bookings" element={<ClientBookings />} />
          <Route path="galleries" element={<ClientGalleries />} />
          <Route path="notifications" element={<ClientNotifications />} />
        </Route>
        <Route path="/album-preview" element={<AlbumPreviewPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="walk-in-booking" element={<AdminWalkInBooking />} />
          <Route path="calendar" element={<AdminCalendar />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="galleries" element={<AdminGalleries />} />
          <Route path="packages" element={<AdminPackages />} />
          <Route path="team-members" element={<AdminTeamMembers />} />
          <Route path="to-do-list" element={<AdminTodoList />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;