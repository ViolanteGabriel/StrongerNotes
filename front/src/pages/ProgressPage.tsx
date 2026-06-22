import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
  getExerciseProgress,
  type ExerciseProgress,
  type StrengthDataPoint,
  type CardioDataPoint,
} from "../services/requests/exercises/getExerciseProgress";

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

const StatCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="bg-card border border-border rounded-2xl p-5 text-center">
    <p className="text-2xl font-extrabold text-primary">{value}</p>
    <p className="text-sm font-semibold mt-1">{label}</p>
    {sub && <p className="text-xs text-secondary-foreground opacity-60 mt-0.5">{sub}</p>}
  </div>
);

const ProgressPage = () => {
  const { id } = useParams<{ id: string }>();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [progress, setProgress] = useState<ExerciseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    getExerciseProgress(id)
      .then(setProgress)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const isStrength = progress?.exercise.category === "strength";
  const dataPoints = progress?.data ?? [];
  const hasData = dataPoints.length > 0;

  // --- Strength stats ---
  const strengthPoints = dataPoints as StrengthDataPoint[];
  const best1RM = hasData && isStrength
    ? Math.max(...strengthPoints.map((d) => d.estimated1RM))
    : null;
  const bestWeight = hasData && isStrength
    ? Math.max(...strengthPoints.map((d) => d.maxWeight))
    : null;
  const firstPoint = strengthPoints[0];
  const lastPoint = strengthPoints[strengthPoints.length - 1];
  const strengthImprovement =
    hasData && isStrength && firstPoint && lastPoint && firstPoint.estimated1RM > 0
      ? Math.round(((lastPoint.estimated1RM - firstPoint.estimated1RM) / firstPoint.estimated1RM) * 100)
      : null;

  // --- Cardio stats ---
  const cardioPoints = dataPoints as CardioDataPoint[];
  const bestDuration = hasData && !isStrength
    ? Math.max(...cardioPoints.map((d) => d.maxDuration))
    : null;
  const firstCardio = cardioPoints[0];
  const lastCardio = cardioPoints[cardioPoints.length - 1];
  const cardioImprovement =
    hasData && !isStrength && firstCardio && lastCardio && firstCardio.maxDuration > 0
      ? Math.round(((lastCardio.maxDuration - firstCardio.maxDuration) / firstCardio.maxDuration) * 100)
      : null;

  const chartData: Record<string, string | number>[] = isStrength
    ? strengthPoints.map((d) => ({
        date: formatDate(d.date),
        "Max Weight (kg)": d.maxWeight,
        "Est. 1RM (kg)": d.estimated1RM,
      }))
    : cardioPoints.map((d) => ({
        date: formatDate(d.date),
        "Duration (min)": Math.round((d.maxDuration / 60) * 10) / 10,
      }));

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold tracking-tight">StrongerNotes</span>
        </div>
        <nav className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-80 transition-all border border-border" aria-label="Toggle theme">
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <Link to="/profile" className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-80 transition-all border border-border" aria-label="Profile">
            <User size={20} />
          </Link>
          <button onClick={logout} className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-80 transition-all border border-border" aria-label="Sign out">
            <LogOut size={20} />
          </button>
        </nav>
      </header>

      <main className="flex-1 px-6 py-10 max-w-4xl mx-auto w-full">
        <Link to="/exercises" className="inline-flex items-center gap-2 text-sm font-medium text-secondary-foreground hover:text-foreground mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Exercise Library
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="text-center py-24 text-secondary-foreground opacity-70">
            <p>Could not load progress data. Exercise may not exist.</p>
          </div>
        ) : progress ? (
          <>
            {/* Header */}
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 bg-primary/10 flex items-center justify-center rounded-2xl shrink-0">
                {isStrength ? <TrendingUp className="w-6 h-6 text-primary" /> : <Timer className="w-6 h-6 text-primary" />}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">{progress.exercise.name}</h1>
                <p className="text-secondary-foreground opacity-70 text-sm mt-1">
                  {progress.exercise.muscleGroup} ·{" "}
                  <span className={`font-medium ${isStrength ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"}`}>
                    {progress.exercise.category}
                  </span>
                  {progress.exercise.isCustom && <span className="ml-2 text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">custom</span>}
                </p>
              </div>
            </div>

            {/* Empty state */}
            {!hasData ? (
              <div className="bg-card border border-dashed border-border rounded-2xl p-14 text-center text-secondary-foreground">
                <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold mb-1">No data yet</p>
                <p className="text-sm opacity-70">
                  Start a session and log sets for this exercise to see your progress here.
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
                {/* Stats */}
                <div className={`grid grid-cols-2 ${isStrength ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4 mb-8`}>
                  {isStrength ? (
                    <>
                      <StatCard label="Best Est. 1RM" value={`${best1RM} kg`} sub="Epley formula" />
                      <StatCard label="Max Weight" value={`${bestWeight} kg`} />
                      <StatCard label="Sessions Logged" value={String(dataPoints.length)} />
                      {strengthImprovement !== null && (
                        <StatCard
                          label="1RM Improvement"
                          value={`${strengthImprovement > 0 ? "+" : ""}${strengthImprovement}%`}
                          sub="first vs. last session"
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <StatCard label="Best Duration" value={formatDuration(bestDuration!)} />
                      <StatCard label="Sessions Logged" value={String(dataPoints.length)} />
                      {cardioImprovement !== null && (
                        <StatCard
                          label="Duration Improvement"
                          value={`${cardioImprovement > 0 ? "+" : ""}${cardioImprovement}%`}
                          sub="first vs. last session"
                        />
                      )}
                    </>
                  )}
                </div>

                {/* Chart */}
                <div className="bg-card border border-border rounded-2xl p-6 mb-8">
                  <h2 className="font-bold mb-6">
                    {isStrength ? "Load Progression" : "Duration Progression"}
                  </h2>
                  <div
                    data-testid="exercise-progress-chart"
                    role="img"
                    aria-label={`${progress.exercise.name} ${isStrength ? "load" : "duration"} progress chart`}
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" opacity={0.5} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          stroke="var(--color-secondary-foreground, #6b7280)"
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          stroke="var(--color-secondary-foreground, #6b7280)"
                          width={45}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--color-card, #fff)",
                            border: "1px solid var(--color-border, #e5e7eb)",
                            borderRadius: "12px",
                            fontSize: "13px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "13px", paddingTop: "16px" }} />
                        {isStrength ? (
                          <>
                            <Line
                              type="monotone"
                              dataKey="Est. 1RM (kg)"
                              stroke="#06b6d4"
                              strokeWidth={2.5}
                              dot={{ r: 4, fill: "#06b6d4" }}
                              activeDot={{ r: 6 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="Max Weight (kg)"
                              stroke="#64748b"
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              dot={{ r: 3, fill: "#64748b" }}
                            />
                          </>
                        ) : (
                          <Line
                            type="monotone"
                            dataKey="Duration (min)"
                            stroke="#f97316"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: "#f97316" }}
                            activeDot={{ r: 6 }}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* History table */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-border">
                    <h2 className="font-bold">Session History</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" aria-label={`${progress.exercise.name} progress history`}>
                      <thead>
                        <tr className="border-b border-border bg-secondary/30">
                          <th className="text-left px-5 py-3 font-semibold text-secondary-foreground opacity-80">Date</th>
                          {isStrength ? (
                            <>
                              <th className="text-right px-5 py-3 font-semibold text-secondary-foreground opacity-80">Max Weight</th>
                              <th className="text-right px-5 py-3 font-semibold text-secondary-foreground opacity-80">Reps</th>
                              <th className="text-right px-5 py-3 font-semibold text-secondary-foreground opacity-80">Est. 1RM</th>
                            </>
                          ) : (
                            <>
                              <th className="text-right px-5 py-3 font-semibold text-secondary-foreground opacity-80">Max Duration</th>
                              <th className="text-right px-5 py-3 font-semibold text-secondary-foreground opacity-80">Rest</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {[...dataPoints].reverse().map((point, i) => (
                          <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                            <td className="px-5 py-3 font-medium">
                              {new Date((point as StrengthDataPoint | CardioDataPoint).date).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
                              })}
                            </td>
                            {isStrength ? (
                              <>
                                <td className="px-5 py-3 text-right">{(point as StrengthDataPoint).maxWeight} kg</td>
                                <td className="px-5 py-3 text-right">{(point as StrengthDataPoint).reps}</td>
                                <td className="px-5 py-3 text-right font-semibold text-primary">{(point as StrengthDataPoint).estimated1RM} kg</td>
                              </>
                            ) : (
                              <>
                                <td className="px-5 py-3 text-right">{formatDuration((point as CardioDataPoint).maxDuration)}</td>
                                <td className="px-5 py-3 text-right">{(point as CardioDataPoint).restSecs != null ? `${(point as CardioDataPoint).restSecs}s` : "—"}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
};

export default ProgressPage;
