import { FaBell, FaSearch } from "react-icons/fa";
import { useEffect, useState } from "react";

function Topbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const userName = user?.name || "User";
  const userRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User";
  const initials = userName.split(" ").map(n => n[0]).join("").toUpperCase() || "U";

  return (
    <header className="topbar h-20 border-b border-slate-200/80 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-10">

      {/* Search */}
      <div className="relative w-full max-w-md">

        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
        />

      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">

        {/* Notification */}
        <button className="relative">

          <FaBell size={18} className="text-slate-500" />

          <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            3
          </span>

        </button>

        {/* User */}
        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/20">
            {initials}
          </div>

          <div>

            <p className="font-semibold">
              {userName}
            </p>

            <p className="text-sm text-gray-500">
              {userRole}
            </p>

          </div>

        </div>

      </div>

    </header>
  );
}

export default Topbar;