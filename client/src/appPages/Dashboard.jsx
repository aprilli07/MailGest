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
  // Pull API base from Vite env
  const apiBase = import.meta.env.VITE_API_URL;

  // Capture JWT token from URL hash on OAuth redirect and set axios Authorization
  function initializeAuthToken() {
    if (typeof window === "undefined") return;
    const hash = window.location.hash || "";
    const match = hash.match(/token=([^&]+)/);
    if (match && match[1]) {
      const token = decodeURIComponent(match[1]);
      try {
        localStorage.setItem("authToken", token);
      } catch {}
      const cleanUrl = window.location.origin + window.location.pathname + window.location.search;
      window.history.replaceState(null, "", cleanUrl);
    }
    const saved = (() => {
      try {
        return localStorage.getItem("authToken");
      } catch {
        return null;
      }
    })();
    if (saved) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${saved}`;
    }
  }

  initializeAuthToken();
  // store logged in user's email 
  const [me, setMe] = useState(null);
  // store raw fetched email summaries from backend
  const [emails, setEmails] = useState([]);
  // email list after frontend filtering/sorting
  const [filteredEmails, setFilteredEmails] = useState([]);
  // button loading state
  const [loading, setLoading] = useState(false);
  // prefetching state to disable summarize until server finishes (new-user prefetch)
  const [prefetching, setPrefetching] = useState(false);
  // UI filter state 
  const [filters, setFilters] = useState({
    timeRange: "",
    count: "",
    sortBy: "",
  });
  // loading/sign in state for user info (used for Toast popup)
  const [loadingUser, setLoadingUser] = useState(true);

  // axios instance to talk to backend
  const api = axios.create({
    baseURL: apiBase,
    withCredentials: true,
  });

  // Ensure the Authorization header is applied to this axios instance
  try {
    const t = localStorage.getItem("authToken");
    if (t) api.defaults.headers.common["Authorization"] = `Bearer ${t}`;
  } catch {}

  // fetch logged in user info
  const fetchMe = async () => {
    try {
      const { data } = await api.get("/api/me");
      if (data.ok) setMe(data.user); // store user's emails
    } catch (err) {
      console.error("Error fetching user:", err);
    } finally {
      setLoadingUser(false);
    }
  };

  const loginToastShown = useRef(false);
  const prefetchToastId = useRef(null);

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

// Handle new-user prefetch state
useEffect(() => {
  if (!me) {
    // user logged out -> reset everything
    toast.dismiss(prefetchToastId.current);
    prefetchToastId.current = null;
    setPrefetching(false);
    return;
  }

  // user has summaries already -> no need to wait
  if (me.cacheReady) {
    toast.dismiss(prefetchToastId.current);
    prefetchToastId.current = null;
    setPrefetching(false);
    return;
  }

  // user logged in but backend still prefetching -> block summarize & show toast
  setPrefetching(true);

  // show toast only once
  if (!prefetchToastId.current) {
    prefetchToastId.current = toast.loading(
      "Preparing summaries... This may take a moment."
    );
  }

  // begin short polling
  let tries = 0;
  const interval = setInterval(async () => {
    tries++;

    try {
      const { data } = await api.get("/api/me");
      if (data.ok) setMe(data.user);

      // backend finished -> stop
      if (data?.user?.cacheReady) {
        toast.dismiss(prefetchToastId.current);
        toast.success("Summaries are ready!");
        prefetchToastId.current = null;
        setPrefetching(false);
        clearInterval(interval);
      }
    } catch {}

    // timeout after 10 tries
    if (tries >= 10) {
      toast.dismiss(prefetchToastId.current);
      toast("Prefetch is slow—you can summarize manually now.");
      prefetchToastId.current = null;
      setPrefetching(false);
      clearInterval(interval);
    }
  }, 1000);

  return () => clearInterval(interval);
}, [me]);

  // fetch email summaries from backend
  const fetchSummary = async () => {
    // If the user's initial prefetch hasn't finished yet, wait for it.
    setLoading(true);
    try {
      // if user is signed in but backend hasn't finished prefetching yet
      if (me && !me.cacheReady) {
        toast("Preparing summaries — fetching and summarizing your recent emails. Please wait...");

        // continously check if backend has finished prefetching (max timeout 30s)
        const deadline = Date.now() + 30_000;
        while (Date.now() < deadline) {
          // small delay
          await new Promise((r) => setTimeout(r, 1000));
          try {
            const { data } = await api.get("/api/me");
            // if cache is ready, break out of polling loop and fetch summaries
            if (data.ok) {
              setMe(data.user);
              if (data.user.cacheReady) break;
            }
          } catch (e) {
            // ignore and continue polling
          }
        }
      }

      // now request summaries (backend will return cached ones or summarize only new emails)
      const { data } = await api.post("/api/summary", {
        emailCount: filters.count,
        dateRange: filters.timeRange,
        sortBy: filters.sortBy,
      });

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
    window.location.href = `${apiBase}/auth/google`;
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

  // Filter, sort, and limit emails on frontend
  useEffect(() => {
    let list = [...emails];
    // apply time range filter (1d, 1w, 1m or "all")
    const computeCutoff = (r) => {
      if (!r || r === "all") return null;
      const now = new Date();
      if (r === "1d") return new Date(now - 1 * 24 * 60 * 60 * 1000);
      if (r === "1w") return new Date(now - 7 * 24 * 60 * 60 * 1000);
      if (r === "1m") return new Date(now - 30 * 24 * 60 * 60 * 1000);
      return null;
    };
    // only keep emails newer than cutoff
    const cutoff = computeCutoff(filters.timeRange);
    if (cutoff) {
      list = list.filter((e) => {
        try {
          return new Date(e.date) >= cutoff;
        } catch (err) {
          return true;
        }
      });
    }

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
    high: filteredEmails.filter((e) => e.importance === "High").length,
    medium: filteredEmails.filter((e) => e.importance === "Medium").length,
    low: filteredEmails.filter((e) => e.importance === "Low").length,
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
        prefetching={prefetching}
      />
      <SummaryStats stats={stats} />
      <FilterBar filters={filters} setFilters={setFilters} />
      <EmailList emails={filteredEmails} />
    </div>
  );
}