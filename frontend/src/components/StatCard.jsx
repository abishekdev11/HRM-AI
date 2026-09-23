function StatCard({ title, value, icon, color }) {
  return (
    <div className="stagger-in group bg-white/90 rounded-2xl border border-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] p-6 hover:-translate-y-1 hover:shadow-[0_18px_35px_rgba(15,23,42,0.12)] transition duration-300">

      <div className="flex justify-between items-center">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h2 className="text-3xl font-bold tracking-tight text-slate-800 mt-2">
            {value}
          </h2>

        </div>

        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 group-hover:scale-105 transition ${color}`}>
          {icon}
        </div>

      </div>

    </div>
  );
}

export default StatCard;