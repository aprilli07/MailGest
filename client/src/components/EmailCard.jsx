export default function EmailCard({ email }) {
  const priorityColors = {
    High: "border-red-700/40 bg-red-900/10",
    Medium: "border-green-700/40 bg-green-900/10",
    Low: "border-yellow-700/40 bg-yellow-900/10",
  };

  // Parse sender name and email (gmail format: Name <name@gmail.com> )
  const parts = email.from.split("<");
  const senderName = parts[0].trim();
  const senderEmail = parts[1]?.replace(">", "").trim() || "";

  return (
    <div
      className={`
        p-6 rounded-xl border-2 shadow-sm transition-all hover:shadow-md bg-base-100 
        ${priorityColors[email.importance]}
      `}
    >
      <div className="flex justify-between items-start">
        <div>
          {/* Sender */}
          <h2 className="text-2xl font-extrabold text-white">{senderName}</h2>
          {/* Sender Email */}
          <p className="text-sm text-gray-400 mt-0.5">{senderEmail}</p>
          {/* Subject (single line, no wrap) */}
          <h3 className="text-lg font-bold text-white mt-2 whitespace-nowrap overflow-hidden text-ellipsis">
            {email.subject}
          </h3>
          {/* Summary (single line, no wrap) */}
          <p className="text-base text-gray-400 mt-3 whitespace-nowrap overflow-hidden text-ellipsis">
            {email.summary}
          </p>
        </div>

        {/* Date + Priority */}
        <div className="text-right ml-4">
          <p className="text-lg font-semibold text-white">
            {email.date ? email.date.split("T")[0] : ""}
          </p>

          <span
            className={`inline-block mt-1 text-sm font-semibold px-3 py-1.5 rounded-full
              ${
                email.importance === "High"
                  ? "bg-red-700 text-white"
                  : email.importance === "Medium"
                  ? "bg-green-700 text-white"
                  : "bg-yellow-700 text-white"
              }
            `}
          >
            {email.importance || "Uncategorized"}
          </span>
        </div>
      </div>
    </div>
  );
}