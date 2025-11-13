import EmailCard from "./EmailCard";

export default function EmailList({ emails }) {
    if (!emails.length) {
      return <p className="text-gray-400 text-center mt-4">No emails to show</p>;
    }

  return (
    <div className="space-y-4 mt-4">
      {emails.map((email, i) => (
                <div
          key={i}
          className={`p-4 rounded-xl border shadow-sm transition-all hover:shadow-md ${
            email.importance === "High"
              ? "bg-red-50 border-red-200"
              : email.importance === "Medium"
              ? "bg-yellow-50 border-yellow-200"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">{email.from}</h2>
              <h3 className="text-lg font-bold text-gray-800 mt-1">{email.subject}</h3>
              <p className="text-base text-gray-700 mt-2">{email.summary}</p>
            </div>
            <div className="text-right ml-4">
              <p className="text-sm text-gray-500">
                {email.date ? email.date.split("T")[0] : ""}
              </p>
              <span
                className={`inline-block mt-1 text-xs font-semibold px-2 py-1 rounded-full ${
                  email.importance === "High"
                    ? "bg-red-100 text-red-700"
                    : email.importance === "Medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {email.importance || "Uncategorized"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
