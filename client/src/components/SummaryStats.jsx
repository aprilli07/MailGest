export default function SummaryStats({ stats }) {
  return (
    <div className="flex gap-4 mb-8">
      <div className="flex-1 bg-red-900/20 border border-red-700 rounded p-4">
        <p className="text-2xl font-extrabold">{stats.high}</p>
        <p className="text-2xl font-extrabold text-red-400">High Priority</p>
      </div>
      <div className="flex-1 bg-green-900/20 border border-green-700 rounded p-4">
        <p className="text-2xl font-extrabold">{stats.medium}</p>
        <p className="text-2xl font-extrabold text-green-400">Medium Priority</p>
      </div>
        <div className="flex-1 bg-yellow-900/20 border border-yellow-700 rounded p-4">
        <p className="text-2xl font-extrabold">{stats.low}</p>
        <p className="text-2xl font-extrabold text-yellow-400">Low Priority</p>
      </div>
    </div>
  );
}