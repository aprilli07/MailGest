export default function Header( {me} ) {
  return (
      <div className="navbar bg-base-100 shadow-sm mb-8 rounded-xl flex items-center justify-start space-x-3">
        <button className="btn btn-square btn-ghost">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block h-8 w-8 stroke-current">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>

      <span className="text-3xl font-semibold">📬 MailGest</span>

      {me && (
        <span className="ml-auto text-base">
          Signed in as <b>{me.email}</b>
        </span>
      )}
    </div>
  );
}