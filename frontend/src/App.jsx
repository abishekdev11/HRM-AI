import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AIAssistant from "./pages/AIAssistant";
import UserManagement from "./pages/UserManagement";
import DepartmentManagement from "./pages/DepartmentManagement";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route  element={
            <ProtectedRoute>
                <MainLayout />
            </ProtectedRoute>
        }>

        <Route path="/dashboard" element={
          <ProtectedRoute roles={["admin", "manager"]}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/ai-assistant" element={<AIAssistant />} />
        <Route path="/attendance" element={
          <ProtectedRoute roles={["admin","manager"]}>
            <Attendance />
          </ProtectedRoute>
        } />
        <Route path="/leave" element={<Leave />} />
        <Route path="/users" element={
          <ProtectedRoute roles={["admin", "manager"]}>
            <UserManagement />
          </ProtectedRoute>
        } />
        <Route path="/departments" element={
          <ProtectedRoute roles={["admin", "manager"]}>
            <DepartmentManagement />
          </ProtectedRoute>
        } />

        </Route>

      </Routes>

    </BrowserRouter>
  );
}

export default App;