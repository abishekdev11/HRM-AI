import { useEffect, useState } from "react";
import { applyLeave, getLeaves } from "../api/chatbot";

function Leave() {
  const [form, setForm] = useState({ from: '', to: '', type: 'Casual', reason: '' });
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getLeaves();
      setLeaves(res.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    try {
      setDateError('');
      if (form.from && form.to) {
        const fromDate = new Date(form.from);
        const toDate = new Date(form.to);
        if (fromDate >= toDate) {
          setDateError('Invalid date range: From date must be before To date');
          return;
        }
      }
      setLoading(true);
      await applyLeave(form);
      setForm({ from: '', to: '', type: 'Casual', reason: '' });
      await load();
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Leave Requests</h1>

      <div className="bg-white p-4 rounded mb-6 shadow">
        <h2 className="font-semibold mb-3">Apply for Leave</h2>
        {dateError && <div className="text-red-600 text-sm mb-3">{dateError}</div>}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input type="date" value={form.from} onChange={(e)=>setForm({...form, from:e.target.value})} className="border p-2 rounded" />
          <input type="date" value={form.to} onChange={(e)=>setForm({...form, to:e.target.value})} className="border p-2 rounded" />
          <select value={form.type} onChange={(e)=>setForm({...form, type:e.target.value})} className="border p-2 rounded">
            <option>Casual</option>
            <option>Sick</option>
            <option>Emergency</option>
          </select>
          <button onClick={submit} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">{loading ? 'Submitting...' : 'Apply'}</button>
        </div>
        <textarea placeholder="Reason (optional)" value={form.reason} onChange={(e)=>setForm({...form, reason:e.target.value})} className="w-full mt-3 border rounded p-2" />
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3">Recent Leaves</h2>
        <ul className="space-y-3">
          {leaves.map(l => (
            <li key={l._id} className="border p-3 rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{l.user?.name || 'You'}</div>
                <div className="text-sm text-gray-600">{new Date(l.from).toLocaleDateString()} - {new Date(l.to).toLocaleDateString()}</div>
                <div className="text-sm text-gray-600">Type: {l.type}</div>
                <div className="text-sm font-medium">Status: <span className={l.status === 'Approved' ? 'text-green-600' : l.status === 'Rejected' ? 'text-red-600' : 'text-yellow-600'}>{l.status}</span></div>
              </div>
            </li>
          ))}
          {leaves.length===0 && <li className="text-sm text-gray-500">No leave requests.</li>}
        </ul>
      </div>
    </div>
  );
}

export default Leave;
