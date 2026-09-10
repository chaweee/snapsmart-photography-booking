import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Client.css";

function ClientLayout() {
  return (
    <div className="client-portal-page">
      <Navbar isLoggedIn />

      <main className="client-portal-main">
        <Outlet />
      </main>
    </div>
  );
}

export default ClientLayout;