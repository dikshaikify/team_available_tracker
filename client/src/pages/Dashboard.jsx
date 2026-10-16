import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const STATUS_STYLES = {
  available: "bg-green-100 text-green-800 ring-green-500",
  busy:      "bg-red-100 text-red-800 ring-red-500",
  away:      "bg-yellow-100 text-yellow-800 ring-yellow-500",
  offline:   "bg-slate-100 text-slate-600 ring-slate-400",
};

const DEMO_MEMBERS = [
  { id: 1,  name: "Amara Okafor",   role: "Engineering Manager", status: "available", timezone: "Africa/Lagos" },
  { id: 2,  name: "Liam Chen",      role: "Frontend Engineer",   status: "busy",      timezone: "America/Los_Angeles" },
  { id: 3,  name: "Sofia Rossi",    role: "Product Designer",    status: "available", timezone: "Europe/Rome" },
  { id: 4,  name: "Rahul Mehta",    role: "Backend Engineer",    status: "away",      timezone: "Asia/Kolkata" },
  { id: 5,  name: "Hannah Weber",   role: "QA Engineer",         status: "available", timezone: "Europe/Berlin" },
  { id: 6,  name: "Diego Alvarez",  role: "DevOps Engineer",     status: "offline",   timezone: "America/Mexico_City" },
  { id: 7,  name: "Yuki Tanaka",    role: "Data Analyst",        status: "busy",      timezone: "Asia/Tokyo" },
  { id: 8,  name: "Grace Mitchell", role: "Product Manager",     status: "available", timezone: "America/New_York" },
  { id: 9,  name: "Omar Haddad",    role: "Support Lead",        status: "away",      timezone: "Asia/Dubai" },
  { id: 10, name: "Chloe Dubois",   role: "Marketing Lead",      status: "offline",   timezone: "Europe/Paris" },
];

export default function Dashboard() {
  const [members, setMembers] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // A "demo" session is one created by the Google button — it stores
  // a non-JWT string starting with "demo-". In that case we serve
  // local demo data instead of calling the backend.
  const isDemo =
    typeof window !== "undefined" &&
    (localStorage.getItem("token") || "").startsWith("demo-");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      if (isDemo) {
        if (!cancelled) {
          setMembers(DEMO_MEMBERS);
          setLoading(false);
        }
        return;
      }

      try {
        const { data } = await api.get("/members");
        if (!cancelled) setMembers(data);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err.response?.data?.error ||
            err.message ||
            "Failed to load members";
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isDemo]);

  async function updateStatus(id, status) {
    // Optimistic update
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status } : m))
    );

    if (isDemo) return; // no backend call in demo mode

    try {
      await api.patch(`/members/${id}/status`, { status });
    } catch (err) {
      // Roll back on failure
      setError(err.response?.data?.error || "Failed to update status");
      // Re-fetch to resync
      try {
        const { data } = await api.get("/members");
        setMembers(data);
      } catch {
        // ignore
      }
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  const visible = useMemo(() => {
    return members.filter((m) => {
      const sOk = statusFilter === "all" || m.status === statusFilter;
      const rOk = roleFilter === "all" || m.role === roleFilter;
      return sOk && rOk;
    });
  }, [members, statusFilter, roleFilter]);

  const counts = useMemo(
    () =>
      members.reduce((acc, m) => {
        acc[m.status] = (acc[m.status] || 0) + 1;
        return acc;
      }, {}),
    [members]
  );

  const roles = useMemo(
    () => ["all", ...Array.from(new Set(members.map((m) => m.role))).sort()],
    [members]
  );

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Team Availability
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            <span className="text-green-600 font-medium">
              {counts.available || 0} available
            </span>
            {" · "}
            <span className="text-red-600 font-medium">
              {counts.busy || 0} busy
            </span>
            {" · "}
            <span className="text-yellow-600 font-medium">
              {counts.away || 0} away
            </span>
            {" · "}
            <span className="text-slate-500 font-medium">
              {counts.offline || 0} offline
            </span>
            {user?.email && (
              <span className="text-slate-400 ml-3 text-xs">
                signed in as {user.email}
                {isDemo && " (demo)"}
              </span>
            )}
          </p>
        </div>

        <button
          onClick={logout}
          className="text-sm px-4 py-2 rounded-lg bg-white ring-1 ring-slate-200 hover:bg-slate-100 transition"
        >
          Sign out
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {["all", "available", "busy", "away", "offline"].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition ${
                statusFilter === f
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
              }`}
            >
              {f}
              {f !== "all" && ` (${counts[f] || 0})`}
            </button>
          ))}
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-1.5 rounded-full text-sm bg-white ring-1 ring-slate-200 capitalize"
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {r === "all" ? "All roles" : r}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <p className="text-center text-slate-400 py-12">Loading members…</p>
      )}

      {/* Grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visible.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-slate-100 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">
                    {m.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {m.role} · {m.timezone}
                  </p>
                </div>
                <span className="text-xs text-slate-400 shrink-0 ml-2">
                  #{m.id}
                </span>
              </div>

              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 capitalize ${
                  STATUS_STYLES[m.status] || STATUS_STYLES.offline
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                {m.status}
              </span>

              <div className="mt-4 flex gap-1.5">
                {["available", "busy", "away"].map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(m.id, s)}
                    className={`flex-1 text-[11px] py-1.5 rounded-lg transition font-medium capitalize ${
                      m.status === s
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && visible.length === 0 && (
        <p className="text-center text-slate-400 py-12">
          No members match the current filters.
        </p>
      )}
    </div>
  );
}