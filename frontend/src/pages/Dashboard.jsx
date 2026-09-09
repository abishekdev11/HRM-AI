import StatCard from "../components/StatCard";
import { useEffect, useState } from "react";
import {
    FaUsers,
    FaCalendarCheck,
    FaUmbrellaBeach,
    FaRobot
} from "react-icons/fa";
import { getAttendanceSummary, getLeaves } from "../api/chatbot";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState({
    totalEmployees: 0,
    presentCount: 0,
    approvedLeaveCount: 0,
    absentCount: 0,
    pendingLeaves: 0
  });
  const [leaves, setLeaves] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      
      // Fetch attendance summary
      const summaryData = await getAttendanceSummary();
      if (summaryData?.data) {
        setSummary(summaryData.data);
      }

      // Fetch leaves
      const leavesData = await getLeaves();
      if (leavesData?.data && Array.isArray(leavesData.data)) {
        setLeaves(leavesData.data.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Could not load dashboard data. Please try refreshing the page.");
    }
  };

  const getTimeAgo = (date) => {
    if (!date) return "Unknown";
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return new Date(date).toLocaleDateString();
  };

  const getActivityColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-yellow-500';
      case 'Approved': return 'bg-green-500';
      case 'Rejected': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const attendancePercentage = summary && summary.totalEmployees > 0
    ? Math.round((summary.presentCount / summary.totalEmployees) * 100)
    : 0;

  return (
    <div>
      {/* Heading */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-2">
            Welcome back, {user?.name || "User"} 👋
          </p>
        </div>
        <button className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition">
          Generate Report
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <StatCard
          title="Total Employees"
          value={summary?.totalEmployees || "0"}
          icon={<FaUsers size={24} />}
          color="bg-blue-600"
        />

        <StatCard
          title="Present Today"
          value={summary?.presentCount || "0"}
          icon={<FaCalendarCheck size={24} />}
          color="bg-green-600"
        />

        <StatCard
          title="Leave"
          value={summary?.approvedLeaveCount || "0"}
          icon={<FaUmbrellaBeach size={24} />}
          color="bg-yellow-500"
        />

        <StatCard
          title="Absent Today"
          value={summary?.absentCount || "0"}
          icon={<FaRobot size={24} />}
          color="bg-purple-600"
        />

        <StatCard
          title="Pending Leaves"
          value={summary?.pendingLeaves || "0"}
          icon={<FaUmbrellaBeach size={24} />}
          color="bg-orange-500"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-8 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Recent Leave Applications
          </h2>
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            View All
          </button>
        </div>

        <div className="space-y-5">
          {leaves && leaves.length > 0 ? (
            leaves.map((leave) => (
              <div key={leave._id} className="flex items-start gap-4">
                <div className={`w-3 h-3 ${getActivityColor(leave.status)} rounded-full mt-2`}></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {leave.user?.name || "Employee"} applied for {leave.type?.toLowerCase() || "leave"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Status: <span className="font-semibold">{leave.status}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {getTimeAgo(leave.createdAt)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No recent leave applications</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;