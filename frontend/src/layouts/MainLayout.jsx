import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function MainLayout() {
  return (
    <div className="app-shell flex h-screen">

      <Sidebar />

      <div className="flex-1 flex flex-col">

        <Topbar />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default MainLayout;