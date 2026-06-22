import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Dumbbell,
  LogOut,
  Moon,
  Sun,
  Timer,
  TrendingUp,
  User,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../contexts/auth-context";
import { useTheme } from "../contexts/ThemeContext";
import {
  getAllExercisesProgress,
  type ExerciseProgressEntry,
} from "../services/requests/exercises/getAllExercisesProgress";
import type {
  CardioDataPoint,
  StrengthDataPoint,
} from "../services/requests/exercises/getExerciseProgress";

const LINE_COLORS = [
  "#06b6d4", // cyan
  "#f97316", // orange
  "#8b5cf6", // violet
  "#10b981", // emerald
  "#ef4444", // red
  "#eab308", // yellow
  "#3b82f6", // blue
  "#ec4899", // pink
  "#22c55e", // green
  "#a855f7", // purple
];

const formatDate = (isoStr: string) => {
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return isoStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(2);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hh}:${mm}`;
};

const formatDuration = (secs: number) => {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
};

interface MultiSeriesPoint {
  date: string;
  [exerciseName: string]: number | string | null;
}

const buildSeries = (
  entries: ExerciseProgressEntry[],
  metric: "estimated1RM" | "maxDuration",
): MultiSeriesPoint[] => {
  const dateSet = new Set<string>();
  entries.forEach((entry) => entry.data.forEach((d) => dateSet.add(d.date)));
  const dates = [...dateSet].sort();

  return dates.map((date) => {
    const point: MultiSeriesPoint = { date: formatDate(date) };
    entries.forEach((entry) => {
      const found = entry.data.find((d) => d.date === date);
      if (!found) {
        point[entry.exercise.name] = null;
        return;
      }
      if (metric === "estimated1RM" && "estimated1RM" in found) {
        point[entry.exercise.name] = (found as StrengthDataPoint).estimated1RM;
      } else if (metric === "maxDuration" && "maxDuration" in found) {
        point[entry.exercise.name] = Math.round(((found as CardioDataPoint).maxDuration / 60) * 10) / 10;
      }
    });
    return point;
  });
};

const StatCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="bg-card border border-border rounded-2xl p-5 text-center">
    <p className="text-2xl font-extrabold text-primary">{value}</p>
    <p className="text-sm font-semibold mt-1">{label}</p>
    {sub && <p className="text-xs text-secondary-foreground opacity-60 mt-0.5">{sub}</p>}
  </div>
);

const ProgressOverviewPage = () => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [entries, setEntries] = useState<ExerciseProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [hiddenStrength, setHiddenStrength] = useState<Set<string>>(new Set());
  const [hiddenCardio, setHiddenCardio] = useState<Set<string>>(new Set());

  useEffect(() => {
    getAllExercisesProgress()
      .then(setEntries)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const strengthEntries = useMemo(
    () => entries.filter((e) => e.exercise.category === "strength"),
    [entries],
  );
  const cardioEntries = useMemo(
    () => entries.filter((e) => e.exercise.category === "cardio"),
    [entries],
  );

  const visibleStrength = useMemo(
    () => strengthEntries.filter((e) => !hiddenStrength.has(e.exercise._id)),
    [strengthEntries, hiddenStrength],
  );
  const visibleCardio = useMemo(
    () => cardioEntries.filter((e) => !hiddenCardio.has(e.exercise._id)),
    [cardioEntries, hiddenCardio],
  );

  const strengthChart = useMemo(
    () => buildSeries(visibleStrength, "estimated1RM"),
    [visibleStrength],
  );
  const cardioChart = useMemo(
    () => buildSeries(visibleCardio, "maxDuration"),
    [visibleCardio],
  );

  const totalSessionsLogged = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((entry) =>
      entry.data.forEach((d) => set.add(d.date + "|" + entry.exercise._id)),
    );
    return set.size;
  }, [entries]);

  const bestOverall1RM = useMemo(() => {
    let best = 0;
    let label = "";
    strengthEntries.forEach((entry) => {
      entry.data.forEach((d) => {
        const value = (d as StrengthDataPoint).estimated1RM;
        if (value > best) {
          best = value;
          label = entry.exercise.name;
        }
      });
    });
    return best > 0 ? { value: best, label } : null;
  }, [strengthEntries]);

  const bestOverallDuration = useMemo(() => {
    let best = 0;
    let label = "";
    cardioEntries.forEach((entry) => {
      entry.data.forEach((d) => {
        const value = (d as CardioDataPoint).maxDuration;
        if (value > best) {
          best = value;
          label = entry.exercise.name;
        }
      });
    });
    return best > 0 ? { value: best, label } : null;
  }, [cardioEntries]);

  const toggleStrength = (id: string) => {
    setHiddenStrength((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCardio = (id: string) => {
    setHiddenCardio((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hasAnyData = entries.length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold tracking-tight">StrongerNotes</span>
        </div>
        <nav className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-80 transition-all border border-border"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <Link
            to="/profile"
            className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-80 transition-all border border-border"
            aria-label="Profile"
          >
            <User size={20} />
          </Link>
          <button
            onClick={logout}
            className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-80 transition-all border border-border"
            aria-label="Sign out"
          >
            <LogOut size={20} />
          </button>
        </nav>
      </header>

      <main className="flex-1 px-6 py-10 max-w-5xl mx-auto w-full">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-secondary-foreground hover:text-foreground mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 bg-primary/10 flex items-center justify-center rounded-2xl shrink-0">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Progress Overview</h1>
            <p className="text-secondary-foreground opacity-70 text-sm mt-1">
              Track every exercise's evolution over time
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="text-center py-24 text-secondary-foreground opacity-70">
            <p>Could not load progress data.</p>
          </div>
        ) : !hasAnyData ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-14 text-center text-secondary-foreground">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold mb-1">No data yet</p>
            <p className="text-sm opacity-70">
              Log sets in your sessions to see progress across exercises here.
            </p>
            <Link
              to="/dashboard"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-all"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard label="Exercises Tracked" value={String(entries.length)} />
              <StatCard label="Sessions Logged" value={String(totalSessionsLogged)} />
              {bestOverall1RM && (
                <StatCard
                  label="Best Est. 1RM"
                  value={`${bestOverall1RM.value} kg`}
                  sub={bestOverall1RM.label}
                />
              )}
              {bestOverallDuration && (
                <StatCard
                  label="Best Duration"
                  value={formatDuration(bestOverallDuration.value)}
                  sub={bestOverallDuration.label}
                />
              )}
            </div>

            {strengthEntries.length > 0 && (
              <section className="bg-card border border-border rounded-2xl p-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h2 className="font-bold">Strength — Est. 1RM Progression (kg)</h2>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {strengthEntries.map((entry, idx) => {
                    const color = LINE_COLORS[idx % LINE_COLORS.length];
                    const hidden = hiddenStrength.has(entry.exercise._id);
                    return (
                      <button
                        key={entry.exercise._id}
                        aria-label={`${hidden ? "Show" : "Hide"} ${entry.exercise.name} strength progress`}
                        onClick={() => toggleStrength(entry.exercise._id)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          hidden
                            ? "bg-transparent text-secondary-foreground border-border opacity-60"
                            : "bg-secondary text-secondary-foreground border-border"
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: hidden ? "transparent" : color, borderColor: color, border: `1px solid ${color}` }}
                        />
                        {entry.exercise.name}
                      </button>
                    );
                  })}
                </div>

                {visibleStrength.length === 0 ? (
                  <p className="text-sm text-secondary-foreground opacity-70 py-12 text-center">
                    Select at least one exercise to see the chart.
                  </p>
                ) : (
                  <div
                    data-testid="strength-progress-overview-chart"
                    role="img"
                    aria-label="Strength estimated 1RM progress overview chart"
                  >
                    <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={strengthChart} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" opacity={0.5} />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--color-secondary-foreground, #6b7280)" />
                      <YAxis tick={{ fontSize: 12 }} stroke="var(--color-secondary-foreground, #6b7280)" width={45} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card, #fff)",
                          border: "1px solid var(--color-border, #e5e7eb)",
                          borderRadius: "12px",
                          fontSize: "13px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
                      {visibleStrength.map((entry) => {
                        const idx = strengthEntries.findIndex((e) => e.exercise._id === entry.exercise._id);
                        const color = LINE_COLORS[idx % LINE_COLORS.length];
                        return (
                          <Line
                            key={entry.exercise._id}
                            type="monotone"
                            dataKey={entry.exercise.name}
                            stroke={color}
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: color }}
                            activeDot={{ r: 5 }}
                            connectNulls
                          />
                        );
                      })}
                    </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>
            )}

            {cardioEntries.length > 0 && (
              <section className="bg-card border border-border rounded-2xl p-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Timer className="w-5 h-5 text-primary" />
                  <h2 className="font-bold">Cardio — Duration Progression (min)</h2>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {cardioEntries.map((entry, idx) => {
                    const color = LINE_COLORS[idx % LINE_COLORS.length];
                    const hidden = hiddenCardio.has(entry.exercise._id);
                    return (
                      <button
                        key={entry.exercise._id}
                        aria-label={`${hidden ? "Show" : "Hide"} ${entry.exercise.name} cardio progress`}
                        onClick={() => toggleCardio(entry.exercise._id)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          hidden
                            ? "bg-transparent text-secondary-foreground border-border opacity-60"
                            : "bg-secondary text-secondary-foreground border-border"
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: hidden ? "transparent" : color, borderColor: color, border: `1px solid ${color}` }}
                        />
                        {entry.exercise.name}
                      </button>
                    );
                  })}
                </div>

                {visibleCardio.length === 0 ? (
                  <p className="text-sm text-secondary-foreground opacity-70 py-12 text-center">
                    Select at least one exercise to see the chart.
                  </p>
                ) : (
                  <div
                    data-testid="cardio-progress-overview-chart"
                    role="img"
                    aria-label="Cardio duration progress overview chart"
                  >
                    <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={cardioChart} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" opacity={0.5} />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--color-secondary-foreground, #6b7280)" />
                      <YAxis tick={{ fontSize: 12 }} stroke="var(--color-secondary-foreground, #6b7280)" width={45} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card, #fff)",
                          border: "1px solid var(--color-border, #e5e7eb)",
                          borderRadius: "12px",
                          fontSize: "13px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
                      {visibleCardio.map((entry) => {
                        const idx = cardioEntries.findIndex((e) => e.exercise._id === entry.exercise._id);
                        const color = LINE_COLORS[idx % LINE_COLORS.length];
                        return (
                          <Line
                            key={entry.exercise._id}
                            type="monotone"
                            dataKey={entry.exercise.name}
                            stroke={color}
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: color }}
                            activeDot={{ r: 5 }}
                            connectNulls
                          />
                        );
                      })}
                    </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>
            )}

            <section className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-bold">Per-Exercise Summary</h2>
              </div>
              <div className="divide-y divide-border">
                {entries.map((entry) => {
                  const isStrength = entry.exercise.category === "strength";
                  const sessions = entry.data.length;
                  let bestValue = "";
                  if (isStrength) {
                    const best = Math.max(
                      ...entry.data.map((d) => (d as StrengthDataPoint).estimated1RM),
                    );
                    bestValue = `${best} kg est. 1RM`;
                  } else {
                    const best = Math.max(
                      ...entry.data.map((d) => (d as CardioDataPoint).maxDuration),
                    );
                    bestValue = formatDuration(best);
                  }

                  return (
                    <Link
                      key={entry.exercise._id}
                      to={`/exercises/${entry.exercise._id}/progress`}
                      aria-label={`View progress details for ${entry.exercise.name}`}
                      className="flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition-colors"
                    >
                      <div>
                        <p className="font-semibold">{entry.exercise.name}</p>
                        <p className="text-xs text-secondary-foreground opacity-70 mt-0.5">
                          {entry.exercise.muscleGroup}
                          {" · "}
                          <span className={isStrength ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"}>
                            {entry.exercise.category}
                          </span>
                          {" · "}
                          {sessions} {sessions === 1 ? "session" : "sessions"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">{bestValue}</p>
                        <p className="text-xs text-secondary-foreground opacity-60">View details →</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default ProgressOverviewPage;
