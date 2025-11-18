export default function AuthBar({ me, onLogin, onLogout, onSummarize, loading }) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="text-white text-lg italic font-bold mr-auto">
        Because no one likes long emails.
      </div>
      <div className="flex justify-end items-center gap-3">
        {me ? (
          <>
            <button
              onClick={onSummarize}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              {loading ? "Summarizing..." : "Summarize Emails"}
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Log Out
            </button>
          </>
        ) : (
          <button
            onClick={onLogin}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Sign in with Google
          </button>
        )}
      </div>
    </div>
  );
}