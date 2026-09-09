function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-lg transition duration-300">

      <div className="flex justify-between items-center">

        <div>

          <p className="text-sm text-gray-500">
            {title}
          </p>

          <h2 className="text-3xl font-bold text-gray-800 mt-2">
            {value}
          </h2>

        </div>

        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${color}`}>
          {icon}
        </div>

      </div>

    </div>
  );
}

export default StatCard;