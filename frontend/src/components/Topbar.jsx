import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import WorkProgress from "./WorkProgress";

function Topbar() {
  const [user, setUser] = useState(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const userName = user?.name || "User";
  const userRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User";
  const initials = userName.split(/\s+/).filter(Boolean).slice(0, 2).map((namePart) => namePart[0]).join("").toUpperCase() || "U";
  const sectionName = {
    "/dashboard": "Dashboard",
    "/projects": "Projects",
    "/queries": "Queries",
    "/users": "Employees",
    "/departments": "Departments",
    "/attendance": "Attendance",
    "/leave": "Leave",
    "/ai-assistant": "AI Assistant",
  }[pathname] || "Workspace";
  const showWorkProgress = user && user.role !== "admin" && user.role !== "manager";

  return (
    <header className="topbar sticky top-0 z-10 border-b border-slate-200/80">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-700">CompanyHub</p>
          <h2 className="truncate text-base font-semibold text-slate-900 sm:text-lg">{sectionName}</h2>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <div className="hidden text-right sm:block">
            <p className="max-w-48 truncate text-sm font-semibold text-slate-800">{userName}</p>
            <p className="text-xs text-slate-500">{userRole}</p>
          </div>
          <div
            className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-teal-500 text-sm font-bold text-white shadow-lg shadow-blue-500/20 ring-2 ring-white"
            aria-label={`${userName}, ${userRole}`}
            title={`${userName} · ${userRole}`}
          >
            {initials}
          </div>
        </div>
      </div>
      {showWorkProgress && <WorkProgress />}

    </header>
  );
}

export default Topbar;