import StatCard from "../components/StatCard";
import { useEffect, useState } from "react";
import {
    FaUsers,
    FaCalendarCheck,
    FaUmbrellaBeach,
  FaRobot,
  FaTimes
} from "react-icons/fa";
import { getAttendanceSummary, getDashboardDetails, getLeaves } from "../api/chatbot";

const formatDate = (value) => value ? new Date(value).toLocaleDateString() : "Date unavailable";

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
  const [selectedCard, setSelectedCard] = useState(null);
  const [dashboardDetails, setDashboardDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

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

  const cards = [
    { id: "employees", title: "Total Employees", value: summary?.totalEmployees || "0", icon: <FaUsers size={24} />, color: "bg-blue-600", dataKey: "employees", kind: "employee" },
    { id: "present", title: "Present Today", value: summary?.presentCount || "0", icon: <FaCalendarCheck size={24} />, color: "bg-green-600", dataKey: "present", kind: "attendance" },
    { id: "leave", title: "Leave", value: summary?.approvedLeaveCount || "0", icon: <FaUmbrellaBeach size={24} />, color: "bg-yellow-500", dataKey: "onLeave", kind: "leave" },
    { id: "absent", title: "Absent Today", value: summary?.absentCount || "0", icon: <FaRobot size={24} />, color: "bg-purple-600", dataKey: "absent", kind: "employee" },
    { id: "pending", title: "Pending Leaves", value: summary?.pendingLeaves || "0", icon: <FaUmbrellaBeach size={24} />, color: "bg-orange-500", dataKey: "pendingLeaveRequests", kind: "leave" },
  ];

  const openCardDetails = async (card) => {
    setSelectedCard(card);
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const response = await getDashboardDetails();
      if (!response?.success || !response.data) {
        throw new Error("Dashboard details were unavailable.");
      }
      setDashboardDetails(response.data);
      setSummary({
        totalEmployees: response.data.totalEmployees,
        presentCount: response.data.presentCount,
        approvedLeaveCount: response.data.approvedLeaveCount,
        absentCount: response.data.absentCount,
        pendingLeaves: response.data.pendingLeaves,
      });
    } catch (detailsFetchError) {
      console.error("Error fetching dashboard details:", detailsFetchError);
      setDetailsError("Could not load current records. Please try again.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const detailItems = selectedCard && dashboardDetails
    ? dashboardDetails[selectedCard.dataKey] || []
    : [];

  return (
    <div className="page-enter max-w-[1600px] mx-auto">
      {/* Heading */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-5 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600 mb-2">Overview</p>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-slate-500 mt-2">
            Welcome back, {user?.name || "User"}. Here is today at a glance.
          </p>
        </div>
        <button className="bg-slate-900 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-slate-900/15 hover:-translate-y-0.5 hover:bg-blue-700 transition">
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
        {cards.map((card) => (
          <StatCard
            key={card.id}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            onClick={() => openCardDetails(card)}
            expanded={selectedCard?.id === card.id}
            detailsId="dashboard-card-details"
          />
        ))}
      </div>

      {selectedCard && (
        <section
          id="dashboard-card-details"
          aria-live="polite"
          className="bg-white/90 rounded-2xl border border-slate-200 mt-6 p-5 lg:p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
        >
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{selectedCard.title}</h2>
              <p className="text-sm text-slate-500 mt-1">
                {detailsLoading ? "Refreshing current records..." : `${detailItems.length} records`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCard(null)}
              aria-label="Close dashboard details"
              className="p-2 text-slate-500 hover:text-slate-900 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              <FaTimes />
            </button>
          </div>

          {detailsError && <p role="alert" className="text-red-700 py-4">{detailsError}</p>}
          {detailsLoading && <p className="text-slate-500 py-4">Loading records...</p>}
          {!detailsLoading && !detailsError && detailItems.length === 0 && (
            <p className="text-slate-500 py-4">No records found.</p>
          )}
          {!detailsLoading && !detailsError && detailItems.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {detailItems.map((item) => {
                const person = item.user || item;
                const description = selectedCard.kind === "employee"
                  ? [person.designation, person.department?.name].filter(Boolean).join(" · ")
                  : selectedCard.kind === "attendance"
                    ? `${item.status || "Present"} · Checked in ${item.loginTime ? new Date(item.loginTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "time unavailable"}`
                    : `${item.type || "Leave"} · ${formatDate(item.from)} to ${formatDate(item.to)}`;

                return (
                  <li key={item._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-3">
                    <div>
                      <p className="font-medium text-slate-800">{person.name || "Employee"}</p>
                      <p className="text-sm text-slate-500">
                        {[person.employeeId, description].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {item.status && selectedCard.kind === "leave" && (
                      <span className="text-sm font-medium text-slate-600">{item.status}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* Recent Activity */}
      <div className="bg-white/90 rounded-2xl shadow-[0_12px_30px_rgba(15,23,42,0.06)] border border-white mt-8 p-6 lg:p-7">
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