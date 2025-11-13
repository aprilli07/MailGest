export default function EmailCard({ sender, subject, body, priority, date }) {
  const priorityColors = {
    High: "border-red-700 bg-red-900/20",
    Medium: "border-green-700 bg-green-900/20",
    Low: "border-gray-700 bg-gray-800"
  };

  return (
    <div className={`p-4 rounded-lg border ${priorityColors[priority]} text-left`}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">{sender}</h3>
          <p className="text-sm text-gray-400">{subject}</p>
        </div>
        <span className="text-xs text-gray-400">{date}</span>
      </div>
      <p className="mt-2 text-gray-300">{body}</p>
    </div>
  );
}