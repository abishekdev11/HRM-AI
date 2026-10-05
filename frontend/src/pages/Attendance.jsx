import { useEffect, useState } from "react";
import { getMyAttendance, getLeaves, approveLeave, rejectLeave, getAttendanceSummary } from "../api/chatbot";
import { FaCalendarCheck, FaCheck, FaTimes, FaUmbrellaBeach, FaUserTimes } from "react-icons/fa";

function Attendance() {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ totalEmployees:0, presentCount:0, absentCount:0, pendingLeaves:0 });
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [dateErrors, setDateErrors] = useState({});

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getMyAttendance();
      setRecords(res.data || []);

      const summaryRes = await getAttendanceSummary();
      if (summaryRes && summaryRes.success) {
        setSummary(summaryRes.data || summary);
      }

      const leavesRes = await getLeaves();
      if (leavesRes && leavesRes.success) {
        const leaves = (leavesRes.data || []).filter(l => l.status === 'Pending');
        setPendingLeaves(leaves);
        
        // Validate dates
        const errors = {};
        leaves.forEach(l => {
          const fromDate = new Date(l.from);
          const toDate = new Date(l.to);
          if (fromDate >= toDate) {
            errors[l._id] = 'Invalid date range';
          }
        });
        setDateErrors(errors);
      }
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    try { await approveLeave(id); await load(); } catch (e) { console.error(e); }
  };

  const handleReject = async (id) => {
    try { await rejectLeave(id); await load(); } catch (e) { console.error(e); }
  };

  const canApproveLeaves = userRole === 'admin' || userRole === 'manager';
  const metrics = [
    { label: "Present today", value: summary.presentCount, icon: FaCalendarCheck, tone: "teal" },
    { label: "Absent today", value: summary.absentCount, icon: FaUserTimes, tone: "rose" },
    { label: "Pending leaves", value: summary.pendingLeaves, icon: FaUmbrellaBeach, tone: "amber" },
  ];

  return (
    <div className="page-enter mx-auto max-w-[1500px] space-y-6">
      <header>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Workforce</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Attendance</h1>
        <p className="mt-2 text-sm text-slate-500">Review your recent attendance and pending leave requests.</p>
      </header>

      <section aria-label="Attendance summary" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon, tone }) => {
          const tones = {
            teal: "bg-teal-50 text-teal-700 ring-teal-100",
            rose: "bg-rose-50 text-rose-700 ring-rose-100",
            amber: "bg-amber-50 text-amber-800 ring-amber-100",
          };
          return (
            <div key={label} className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <span className={`grid h-11 w-11 place-items-center rounded-lg ring-1 ${tones[tone]}`}>
                <Icon size={17} />
              </span>
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
              </div>
            </div>
          );
        })}
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">My recent attendance</h2>
            <p className="mt-1 text-sm text-slate-500">Your latest recorded work days.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-700">
                      {new Date(record.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 ring-1 ring-inset ring-teal-100">{record.status}</span>
                    </td>
                  </tr>
                ))}
                {!loading && records.length === 0 && (
                  <tr><td colSpan={2} className="px-5 py-12 text-center text-sm text-slate-500">No attendance records found.</td></tr>
                )}
                {loading && <tr><td colSpan={2} className="px-5 py-12 text-center text-sm text-slate-500">Loading attendance...</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">Pending leave requests</h2>
              <p className="mt-1 text-sm text-slate-500">Requests awaiting review.</p>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">{pendingLeaves.length} pending</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {pendingLeaves.map((leave) => (
              <li key={leave._id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800">{leave.user?.name || "Unknown employee"}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {new Date(leave.from).toLocaleDateString()} – {new Date(leave.to).toLocaleDateString()} · {leave.type || "Leave"}
                  </p>
                  {dateErrors[leave._id] && <p className="mt-1 text-xs font-medium text-rose-700">{dateErrors[leave._id]}</p>}
                </div>
                {canApproveLeaves && !dateErrors[leave._id] && (
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => handleApprove(leave._id)} className="inline-flex min-h-9 items-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
                      <FaCheck size={12} /> Approve
                    </button>
                    <button type="button" onClick={() => handleReject(leave._id)} className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2">
                      <FaTimes size={12} /> Reject
                    </button>
                  </div>
                )}
                {dateErrors[leave._id] && <span className="text-sm text-slate-400">Cannot process</span>}
              </li>
            ))}
            {pendingLeaves.length === 0 && <li className="px-5 py-12 text-center text-sm text-slate-500">No pending leave requests.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default Attendance;
