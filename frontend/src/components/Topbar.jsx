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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">

      {/* Search */}
      <div className="relative w-96">

        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-11 pr-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
        />

      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">

        {/* Notification */}
        <button className="relative">

          <FaBell size={20} className="text-gray-600" />

          <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            3
          </span>

        </button>

        {/* User */}
        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
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