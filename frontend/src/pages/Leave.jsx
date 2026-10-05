import { useEffect, useState } from "react";
import { applyLeave, getLeaves } from "../api/chatbot";
import { FaCheck, FaPaperPlane, FaTimes, FaUmbrellaBeach } from "react-icons/fa";

function Leave() {
  const [form, setForm] = useState({ from: '', to: '', type: 'Casual', reason: '' });
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getLeaves();
      const requests = res.data || [];
      setLeaves([
        ...requests.filter((leave) => leave.status === 'Pending'),
        ...requests.filter((leave) => leave.status !== 'Pending'),
      ]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const pendingCount = leaves.filter((leave) => leave.status === "Pending").length;

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
    <div className="page-enter mx-auto max-w-[1500px] space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Time away</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Leave requests</h1>
          <p className="mt-2 text-sm text-slate-500">Submit time off and follow the status of your requests.</p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 ring-1 ring-inset ring-amber-200 sm:self-auto">
          <FaUmbrellaBeach size={13} /> {pendingCount} pending
        </div>
      </header>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Apply for leave</h2>
          <p className="mt-1 text-sm text-slate-500">Choose your dates and include a reason if useful.</p>
        </div>
        <div className="p-5">
          {dateError && <div role="alert" className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{dateError}</div>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              From
              <input type="date" value={form.from} onChange={(event) => setForm({ ...form, from: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3 font-normal text-slate-700 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15" />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              To
              <input type="date" value={form.to} onChange={(event) => setForm({ ...form, to: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3 font-normal text-slate-700 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15" />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Leave type
              <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-700 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15">
                <option>Casual</option>
                <option>Sick</option>
                <option>Emergency</option>
              </select>
            </label>
            <div className="flex items-end">
              <button type="button" onClick={submit} disabled={loading} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
                <FaPaperPlane size={12} /> {loading ? "Submitting..." : "Submit request"}
              </button>
            </div>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 sm:col-span-2 xl:col-span-4">
              Reason <span className="font-normal text-slate-400">(optional)</span>
              <textarea placeholder="Add a short note" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} className="min-h-20 resize-y rounded-md border border-slate-300 px-3 py-2.5 font-normal text-slate-700 outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15" />
            </label>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">Recent requests</h2>
            <p className="mt-1 text-sm text-slate-500">Your leave history, newest requests first.</p>
          </div>
          <span className="text-sm tabular-nums text-slate-500">{leaves.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {["Requested by", "Dates", "Type", "Status"].map((heading) => (
                  <th key={heading} className="border-b border-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaves.map((leave) => {
                const statusStyles = leave.status === "Approved"
                  ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                  : leave.status === "Rejected"
                    ? "bg-rose-50 text-rose-800 ring-rose-200"
                    : "bg-amber-50 text-amber-800 ring-amber-200";
                const StatusIcon = leave.status === "Approved" ? FaCheck : leave.status === "Rejected" ? FaTimes : null;

                return (
                  <tr key={leave._id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-medium text-slate-800">{leave.user?.name || "You"}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {new Date(leave.from).toLocaleDateString()} – {new Date(leave.to).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{leave.type}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles}`}>
                        {StatusIcon && <StatusIcon size={10} />}{leave.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!loading && leaves.length === 0 && <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-500">No leave requests yet.</td></tr>}
              {loading && <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-500">Loading leave requests...</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Leave;
