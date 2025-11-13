export default function FilterBar({ filters, setFilters }) {
  return (
    <div className="flex flex-wrap gap-4 my-6">
      {/* Date Range Filter */}
      <select
        value={filters.timeRange}
        onChange={(e) => setFilters((prev) => ({ ...prev, timeRange: e.target.value }))}
        className="bg-gray-800 p-2 rounded"
      >
        <option value="">— Select Time Range —</option>
        <option value="1d">Last 1 Day</option>
        <option value="1w">Last 1 Week</option>
        <option value="1m">Last 1 Month</option>
        <option value="all">All Time</option>
      </select>

      {/* Count Filter */}
      <select
        value={filters.count}
        onChange={(e) => setFilters((prev) => ({ ...prev, count: Number(e.target.value) }))}
        className="bg-gray-800 p-2 rounded"
      >
        <option value="">— Select Email Count —</option>
        <option value={10}>Last 10 Emails</option>
        <option value={20}>Last 20 Emails</option>
        <option value={50}>Last 50 Emails</option>
      </select>

      {/* Sort Filter */}
      <select
        value={filters.sortBy}
        onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
        className="bg-gray-800 p-2 rounded"
      >
        <option value="date">Sort by Date</option>
        <option value="importance">Sort by Importance</option>
      </select>
    </div>
  );
}