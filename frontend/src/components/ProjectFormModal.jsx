import { useState } from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";

const DEFAULT_FORM = {
  name: "",
  clientDetails: {
    name: "",
    email: "",
    contactNo: "",
    address: "",
  },
  progress: 0,
  teamLead: "",
  employees: [],
  status: "Active",
};

function ProjectFormModal({ isOpen, onClose, onSubmit, onRetryOptions, options, optionsLoading, optionsError }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({ ...form, progress: Number(form.progress) });
    } catch (submitError) {
      setError(submitError.response?.data?.message || submitError.message || "Could not create the project.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEmployee = (employeeId) => {
    setForm((current) => ({
      ...current,
      employees: current.employees.includes(employeeId)
        ? current.employees.filter((id) => id !== employeeId)
        : [...current.employees, employeeId],
    }));
  };

  const selectableEmployees = options.users.filter((user) => user._id !== form.teamLead);
  const hasRequiredOptions = options.users.length > 0;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-form-title"
        className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-xl bg-white shadow-2xl sm:rounded-xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700">Project setup</p>
            <h2 id="project-form-title" className="mt-1 text-xl font-bold text-slate-900">Add project</h2>
            <p className="mt-1 text-sm text-slate-500">Add delivery details, ownership, and team members.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close project form"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:opacity-50"
          >
            <FaTimes />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          {error && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</p>}
          {optionsError && (
            <div role="alert" className="flex flex-col gap-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between">
              <span>{optionsError}</span>
              <button
                type="button"
                onClick={onRetryOptions}
                disabled={optionsLoading}
                className="min-h-9 shrink-0 rounded-md border border-rose-300 bg-white px-3 text-sm font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-50"
              >
                {optionsLoading ? "Retrying..." : "Retry"}
              </button>
            </div>
          )}

          {optionsLoading ? (
            <p className="py-8 text-center text-sm text-slate-500">Loading team members...</p>
          ) : optionsError ? null : !hasRequiredOptions ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
              Add at least one active employee before creating a project.
            </p>
          ) : (
            <>
              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
                  Project name <span className="text-rose-600">*</span>
                  <input
                    autoFocus
                    required
                    maxLength={120}
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="e.g. Customer portal redesign"
                    className="h-10 w-full min-w-0 rounded-md border border-slate-300 px-3 font-normal text-slate-800 outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                  />
                </label>

                <label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
                  Client name <span className="text-rose-600">*</span>
                  <input
                    required
                    maxLength={120}
                    value={form.clientDetails.name}
                    onChange={(event) => setForm({ ...form, clientDetails: { ...form.clientDetails, name: event.target.value } })}
                    placeholder="Company or client name"
                    className="h-10 w-full min-w-0 rounded-md border border-slate-300 px-3 font-normal text-slate-800 outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                  />
                </label>

                <label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-700">
                  Client email <span className="text-rose-600">*</span>
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={form.clientDetails.email}
                    onChange={(event) => setForm({ ...form, clientDetails: { ...form.clientDetails, email: event.target.value } })}
                    placeholder="contact@company.com"
                    className="h-10 w-full min-w-0 rounded-md border border-slate-300 px-3 font-normal text-slate-800 outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                  />
                </label>

                <label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-700">
                  Mobile number <span className="text-rose-600">*</span>
                  <input
                    required
                    type="tel"
                    autoComplete="tel"
                    value={form.clientDetails.contactNo}
                    onChange={(event) => setForm({ ...form, clientDetails: { ...form.clientDetails, contactNo: event.target.value } })}
                    placeholder="Client phone number"
                    className="h-10 w-full min-w-0 rounded-md border border-slate-300 px-3 font-normal text-slate-800 outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                  />
                </label>

                <label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
                  Address <span className="text-rose-600">*</span>
                  <textarea
                    required
                    rows={2}
                    maxLength={300}
                    value={form.clientDetails.address}
                    onChange={(event) => setForm({ ...form, clientDetails: { ...form.clientDetails, address: event.target.value } })}
                    placeholder="Client address"
                    className="min-h-20 w-full min-w-0 resize-y rounded-md border border-slate-300 px-3 py-2.5 font-normal text-slate-800 outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                  />
                </label>

                <label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-700">
                  Team lead <span className="text-rose-600">*</span>
                  <select
                    required
                    value={form.teamLead}
                    onChange={(event) => setForm({
                      ...form,
                      teamLead: event.target.value,
                      employees: form.employees.filter((id) => id !== event.target.value),
                    })}
                    className="h-10 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-700 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                  >
                    <option value="">Select a team lead</option>
                    {options.users.map((user) => (
                      <option key={user._id} value={user._id}>{user.name} · {user.employeeId}</option>
                    ))}
                  </select>
                </label>

                <label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-700">
                  Status
                  <select
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value })}
                    className="h-10 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-700 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                  >
                    <option value="Active">Active</option>
                    <option value="On Hold">On hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </label>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
                    <label htmlFor="project-progress">Progress</label>
                    <output htmlFor="project-progress" className="font-bold tabular-nums text-slate-900">{form.progress}%</output>
                  </div>
                  <input
                    id="project-progress"
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={form.progress}
                    onChange={(event) => setForm({ ...form, progress: event.target.value })}
                    className="h-10 w-full min-w-0 accent-teal-700"
                  />
                </div>

              </div>

              <fieldset className="rounded-lg border border-slate-200">
                <legend className="ml-3 px-1 text-sm font-semibold text-slate-800">Team members <span className="font-normal text-slate-400">(optional)</span></legend>
                {form.teamLead ? (
                  selectableEmployees.length ? (
                    <div className="grid max-h-40 grid-cols-1 gap-1 overflow-y-auto p-2 sm:grid-cols-2">
                      {selectableEmployees.map((user) => (
                        <label key={user._id} className="flex min-w-0 items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={form.employees.includes(user._id)}
                            onChange={() => toggleEmployee(user._id)}
                            className="h-4 w-4 shrink-0 accent-teal-700"
                          />
                          <span className="min-w-0 truncate">{user.name} <span className="text-xs text-slate-400">{user.employeeId}</span></span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="px-4 py-3 text-sm text-slate-500">No other active employees available.</p>
                  )
                ) : (
                  <p className="px-4 py-3 text-sm text-slate-500">Choose a team lead to assign additional members.</p>
                )}
              </fieldset>
            </>
          )}

          <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || optionsLoading || !!optionsError || !hasRequiredOptions}
              className="h-10 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create project"}
            </button>
          </footer>
        </form>
      </section>
    </div>,
    document.body
  );
}

export default ProjectFormModal;