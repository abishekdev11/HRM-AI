function StatCard({ title, value, icon, color, onClick, expanded, detailsId }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-controls={detailsId}
      className={`stagger-in group w-full rounded-lg border bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${expanded ? "border-teal-500 ring-1 ring-teal-500/20" : "border-slate-200 hover:border-teal-200"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <h2 className="mt-3 text-3xl font-bold tabular-nums text-slate-900">{value}</h2>
        </div>
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white shadow-sm transition-transform group-hover:scale-105 ${color}`}>
          {icon}
        </div>
      </div>
      <div className="mt-5 h-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full w-full rounded-full opacity-70 ${color}`} />
      </div>
    </button>
  );
}

export default StatCard;