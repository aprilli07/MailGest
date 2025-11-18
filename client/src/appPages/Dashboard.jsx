import { useState, useEffect } from "react";
import Header from "../components/Header";
import SummaryStats from "../components/SummaryStats";
import FilterBar from "../components/FilterBar";
import EmailList from "../components/EmailList";
import axios from "axios";
import AuthBar from "../components/AuthBar";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { useRef } from "react";

export default function Dashboard() {
  // store logged in user's email 
  const [me, setMe] = useState(null);
  // store raw fetched email summaries from backend
  const [emails, setEmails] = useState([]);
  // email list after frontend filtering/sorting
  const [filteredEmails, setFilteredEmails] = useState([]);
  // button loading state
  const [loading, setLoading] = useState(false);
  // UI filter state 
  const [filters, setFilters] = useState({
    timeRange: "1w",
    count: 10,
    sortBy: "date",
  });
  // loading/sign in state for user info (used for Toast popup)
  const [loadingUser, setLoadingUser] = useState(true);

  // axios instance to talk to backend
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE,
    withCredentials: true,
  });

  // fetch logged in user info
  const fetchMe = async () => {
    try {
      const { data } = await api.get("/api/me");
      if (data.ok) setMe(data.user); // store user's email 
    } catch (err) {
      console.error("Error fetching user:", err);
    } finally {
      setLoadingUser(false);
    }
  };

  const loginToastShown = useRef(false);

useEffect(() => {
  // don't show Toast popup if still loading user info
  if (loadingUser) return;            
  
  if (!me) {
    // If user logs out -> show sign-in toast once.
    if (!loginToastShown.current) {
      toast("✉️ Sign in to summarize your emails", {
        duration: 6000,
      });
      // logged in -> don't show again until logout
      loginToastShown.current = true;
    }
  } else {
    // If user logs in -> do nothing
    // Only reset on logout.
  }
}, [me, loadingUser]);

  // fetch email summaries from backend
  const fetchSummary = async () => {
    //console.log("▶️ fetchSummary called with filters:", filters);
    setLoading(true);

    try {
      // send filters to backend (backend runs gemini summarization)
      const { data } = await api.post("/api/summary", {
        emailCount: filters.count,
        dateRange: filters.timeRange,
        sortBy: filters.sortBy,
      });

      //console.log("📩 Server response:", data);

      // if successful, store summaries 
      if (data.ok && Array.isArray(data.summaries)) {
        setEmails(data.summaries);
        toast.success("Emails summarized successfully!");
      } else {
        setEmails([]);
        toast.error("No emails found to summarize.");
      }
    } catch (err) {
      console.error("❌ Failed to fetch summaries:", err);
      toast.error("Uh Oh! Failed to summarize emails.");
    } finally {
      setLoading(false);
    }
  };

  // redirect user to google OAuth login page
  const login = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE}/auth/google`;
  };

  // log out user
  const logout = async () => {
    try {
      await api.post("/api/logout");
      setMe(null);
      setEmails([]);
      setFilteredEmails([]);
      loginToastShown.current = false; // reset toast shown state on logout
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  // load user info on mount
  useEffect(() => {
    fetchMe();
  }, []);

  // Frontend only sorts + count limit
  useEffect(() => {
    let list = [...emails];

    // sort by importance or date
    if (filters.sortBy === "importance") {
      const order = { High: 1, Medium: 2, Low: 3 };
      list.sort((a, b) => order[a.importance] - order[b.importance]);
    } else {
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // limit number of displayed emails 
    if (filters.count > 0) {
      list = list.slice(0, filters.count);
    }
    
    // store filtered list
    setFilteredEmails(list);
  }, [filters, emails]);

  // compute summary statistics
  const stats = {
    high: emails.filter((e) => e.importance === "High").length,
    medium: emails.filter((e) => e.importance === "Medium").length,
    low: emails.filter((e) => e.importance === "Low").length,
  };

  return (
    <div className="text-white bg-black min-h-screen p-8">
      <Toaster position="top-center" />
      <Header me={me}/>
      <AuthBar
        me={me}
        onLogin={login}
        onLogout={logout}
        onSummarize={fetchSummary}
        loading={loading}
      />
      <SummaryStats stats={stats} />
      <FilterBar filters={filters} setFilters={setFilters} />
      <EmailList emails={filteredEmails} />
    </div>
  );
}