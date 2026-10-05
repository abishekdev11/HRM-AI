import StatCard from "../components/StatCard";
import { useEffect, useState } from "react";
import {
    FaUsers,
    FaCalendarCheck,
    FaUmbrellaBeach,
  FaUserTimes,
  FaTimes
} from "react-icons/fa";
import { getAttendanceSummary, getDashboardDetails, getLeaves } from "../api/chatbot";
import { Link } from "react-router-dom";

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
    { id: "employees", title: "Total employees", value: summary?.totalEmployees || "0", icon: <FaUsers size={17} />, color: "bg-slate-800", dataKey: "employees", kind: "employee" },
    { id: "present", title: "Present today", value: summary?.presentCount || "0", icon: <FaCalendarCheck size={17} />, color: "bg-teal-700", dataKey: "present", kind: "attendance" },
    { id: "leave", title: "On leave", value: summary?.approvedLeaveCount || "0", icon: <FaUmbrellaBeach size={17} />, color: "bg-amber-600", dataKey: "onLeave", kind: "leave" },
    { id: "absent", title: "Absent today", value: summary?.absentCount || "0", icon: <FaUserTimes size={17} />, color: "bg-rose-700", dataKey: "absent", kind: "employee" },
    { id: "pending", title: "Pending leaves", value: summary?.pendingLeaves || "0", icon: <FaUmbrellaBeach size={17} />, color: "bg-cyan-700", dataKey: "pendingLeaveRequests", kind: "leave" },
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
      <div className="mb-7 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Overview</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">Welcome back, {user?.name || "User"}. Here is today at a glance.</p>
        </div>
        <div className="w-full max-w-sm border-l-2 border-teal-600 pl-4 md:w-72">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-700">Workforce presence</span>
            <span className="text-sm font-bold tabular-nums text-teal-800">{attendancePercentage}%</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-label="Workforce present today"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={attendancePercentage}
          >
            <div className="h-full rounded-full bg-teal-600 transition-[width] duration-500" style={{ width: `${attendancePercentage}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">{summary.presentCount} of {summary.totalEmployees} employees present</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
          className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:p-6"
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
              className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              <FaTimes />
            </button>
          </div>

          {detailsError && <p role="alert" className="py-4 text-sm text-rose-700">{detailsError}</p>}
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
      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">Recent leave applications</h2>
            <p className="mt-1 text-sm text-slate-500">Latest requests across your organization.</p>
          </div>
          <Link to="/leave" className="shrink-0 text-sm font-semibold text-teal-800 hover:text-teal-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
            View all
          </Link>
        </div>
        <div className="divide-y divide-slate-100 px-5">
          {leaves && leaves.length > 0 ? (
            leaves.map((leave) => (
              <div key={leave._id} className="flex items-center gap-3 py-4">
                <div className={`h-2.5 w-2.5 shrink-0 ${getActivityColor(leave.status)} rounded-full ring-4 ring-slate-50`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {leave.user?.name || "Employee"} applied for {leave.type?.toLowerCase() || "leave"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {leave.status} · {getTimeAgo(leave.createdAt)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">No recent leave applications.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;