import { useEffect, useState } from "react";
import { getMyAttendance, getLeaves, approveLeave, rejectLeave, getAttendanceSummary } from "../api/chatbot";

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Attendance</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-3">My Recent Attendance</h2>
          <ul className="space-y-2">
            {records.map(r => (
              <li key={r._id} className="text-sm">{new Date(r.date).toLocaleDateString()} — {r.status}</li>
            ))}
            {records.length===0 && <li className="text-sm text-gray-500">No records found.</li>}
          </ul>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-3">Summary</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-green-50 rounded">
              <div className="text-sm text-gray-500">Present</div>
              <div className="text-xl font-bold">{summary.presentCount}</div>
            </div>
            <div className="p-3 bg-red-50 rounded">
              <div className="text-sm text-gray-500">Absent</div>
              <div className="text-xl font-bold">{summary.absentCount}</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded">
              <div className="text-sm text-gray-500">Pending Leaves</div>
              <div className="text-xl font-bold">{summary.pendingLeaves}</div>
            </div>
          </div>

          <h3 className="font-semibold mt-4 mb-2">Pending Leave Requests</h3>
          <ul className="space-y-2">
            {pendingLeaves.map(l => (
              <li key={l._id} className="flex justify-between items-center border p-2 rounded">
                <div>
                  <div className="font-medium">{l.user?.name || 'Unknown'}</div>
                  <div className="text-sm text-gray-600">{new Date(l.from).toLocaleDateString()} - {new Date(l.to).toLocaleDateString()}</div>
                  {dateErrors[l._id] && <div className="text-red-600 text-xs mt-1">{dateErrors[l._id]}</div>}
                </div>
                {canApproveLeaves && !dateErrors[l._id] && (
                  <div className="space-x-2">
                    <button onClick={()=>handleApprove(l._id)} className="bg-green-600 text-white px-3 py-1 rounded">Approve</button>
                    <button onClick={()=>handleReject(l._id)} className="bg-red-600 text-white px-3 py-1 rounded">Reject</button>
                  </div>
                )}
                {dateErrors[l._id] && (
                  <div className="text-gray-500 text-sm">Cannot process</div>
                )}
              </li>
            ))}
            {pendingLeaves.length===0 && <li className="text-sm text-gray-500">No pending leave requests.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Attendance;
