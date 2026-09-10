import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import AdminBookings from "./admin/AdminBookings";
import AdminCalendar from "./admin/AdminCalendar";
import AdminDashboard from "./admin/AdminDashboard";
import AdminLayout from "./admin/AdminLayout";
import AdminPackages from "./admin/AdminPackages";
import AdminPayments from "./admin/AdminPayments";
import AdminTeamMembers from "./admin/AdminTeamMembers";
import AdminTodoList from "./admin/AdminTodoList";
import AdminWalkInBooking from "./admin/AdminWalkInBooking";
import AuthPage from "./pages/AuthPage";
import BookingPage from "./pages/BookingPage";
import HomePage from "./pages/HomePage";
import PortfolioPage from "./pages/PortfolioPage";

function App() {
  // Temporary until Supabase authentication is connected.
  const isLoggedIn = false;

  return (
    <Routes>
      <Route path="/" element={<HomePage isLoggedIn={isLoggedIn} />} />

      <Route
        path="/portfolio"
        element={<PortfolioPage isLoggedIn={isLoggedIn} />}
      />

      <Route path="/book" element={<BookingPage />} />

      <Route path="/login" element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />

        <Route path="bookings" element={<AdminBookings />} />

        <Route path="walk-in-booking" element={<AdminWalkInBooking />} />

        <Route path="calendar" element={<AdminCalendar />} />

        <Route path="payments" element={<AdminPayments />} />

        <Route
          path="clients"
          element={<div>Manage Clients page coming next.</div>}
        />

        <Route
          path="galleries"
          element={<div>Manage Galleries page coming next.</div>}
        />

        <Route path="packages" element={<AdminPackages />} />

        <Route path="team-members" element={<AdminTeamMembers />} />

        <Route path="to-do-list" element={<AdminTodoList />} />

        <Route
          path="notifications"
          element={<div>Notifications page coming next.</div>}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;