export default function SummaryStats({ stats }) {
  return (
    <div className="flex gap-4 mb-8">
      <div className="flex-1 bg-red-900/20 border border-red-700 rounded p-4">
        <p className="text-lg font-bold">{stats.high}</p>
        <p className="text-sm text-red-400">High Priority</p>
      </div>
      <div className="flex-1 bg-green-900/20 border border-green-700 rounded p-4">
        <p className="text-lg font-bold">{stats.medium}</p>
        <p className="text-sm text-green-400">Medium Priority</p>
      </div>
      <div className="flex-1 bg-gray-800 border border-gray-700 rounded p-4">
        <p className="text-lg font-bold">{stats.low}</p>
        <p className="text-sm text-gray-400">Low Priority</p>
      </div>
    </div>
  );
}