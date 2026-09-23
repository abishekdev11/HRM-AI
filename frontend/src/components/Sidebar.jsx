// src/components/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { logout as logoutAPI } from "../api/chatbot";
import {
  FaChartPie,
  FaUsers,
  FaCalendarCheck,
  FaUmbrellaBeach,
  FaMoneyCheckAlt,
  FaChartLine,
  FaRobot,
  FaCog,
  FaSitemap,
  FaSignOutAlt,
} from "react-icons/fa";

function Sidebar() {
  const userJson = localStorage.getItem("user");
  let user = null;
  try {
    user = userJson ? JSON.parse(userJson) : null;
  } catch (e) {
    user = null;
  }

  const isAdmin = user && user.role === "admin";
  const isManager = user && user.role === "manager";
  const isAdminOrManager = isAdmin || isManager;

  const menuItems = [
    ...(isAdminOrManager ? [{ name: "Dashboard", icon: <FaChartPie />, path: "/dashboard" }] : []),
    ...(isAdminOrManager ? [{ name: "Employees", icon: <FaUsers />, path: "/users" }] : []),
    ...(isAdminOrManager ? [{ name: "Departments", icon: <FaSitemap />, path: "/departments" }] : []),
    ...(isAdminOrManager ? [{ name: "Attendance", icon: <FaCalendarCheck />, path: "/attendance" }] : []),
    { name: "Leave", icon: <FaUmbrellaBeach />, path: "/leave" },
    { name: "AI Assistant", icon: <FaRobot />, path: "/ai-assistant" },
  ];

  const navigate = useNavigate();

const handleLogout = async () => {

    const confirmLogout = window.confirm(
        "Are you sure you want to logout?"
    );

    if (!confirmLogout) return;

    try {
      // Call logout API to record logout time
      await logoutAPI();
    } catch (e) {
      console.error("Logout error:", e);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");

};

  return (
    <aside className="app-sidebar w-64 text-white flex flex-col">

      {/* Logo */}
     <div className="sidebar-brand p-6 border-b border-white/10">

    <h1 className="relative text-2xl font-bold tracking-tight">
        CompanyHub
    </h1>

    <p className="relative text-sm text-sky-100/60 mt-1">
        Management System
    </p>

</div>

      {/* Menu */}
      <nav className="flex-1 mt-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `nav-item flex items-center gap-3 px-4 py-3 transition ${
                isActive
                  ? "nav-item-active"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
     <button
    onClick={handleLogout}
    className="flex items-center gap-3 p-6 text-slate-300 hover:bg-white/10 hover:text-white text-left w-full"
>
    <FaSignOutAlt />
    Logout
</button>

    </aside>
  );
}

export default Sidebar;