import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, LogOut, LayoutDashboard, PlusCircle, History, TrendingUp, Sun, Moon, BookOpen } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/auth-context";
import { getSessions, type SessionSummary } from "../services/requests/sessions/getSessions";
import { getSessionById, type SessionDetail } from "../services/requests/sessions/getSessionById";
import { getWorkouts, type Workout } from "../services/requests/workouts/getWorkouts";
import { createSession } from "../services/requests/sessions/createSession";

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString();
};

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-80 transition-all border border-border"
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const displayName = user?.name || "Athlete";
  const displayEmail = user?.email || "";
  const userInitial = displayName.charAt(0).toUpperCase() || "U";

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [recentDetails, setRecentDetails] = useState<SessionDetail[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(true);
  const [workoutsError, setWorkoutsError] = useState("");
  const [startingWorkoutId, setStartingWorkoutId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadSessions = async () => {
      setSessionsLoading(true);
      setSessionsError("");
      try {
        const data = await getSessions();
        if (cancelled) return;
        setSessions(data);

        const recent = data.slice(0, 5);
        const detailResults = await Promise.all(
          recent.map((session) => getSessionById(session._id).catch(() => null))
        );
        if (cancelled) return;
        setRecentDetails(detailResults.filter(Boolean) as SessionDetail[]);
      } catch {
        if (cancelled) return;
        setSessionsError("Could not load session data.");
      } finally {
        if (!cancelled) setSessionsLoading(false);
      }
    };

    loadSessions();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadWorkouts = async () => {
      setWorkoutsLoading(true);
      setWorkoutsError("");
      try {
        const data = await getWorkouts();
        if (cancelled) return;
        setWorkouts(data);
      } catch {
        if (cancelled) return;
        setWorkoutsError("Could not load routines.");
      } finally {
        if (!cancelled) setWorkoutsLoading(false);
      }
    };

    loadWorkouts();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalSessions = sessions.length;
  const recentSessions = sessions.slice(0, 5);

  const totalVolume = useMemo(() => {
    let sum = 0;
    recentDetails.forEach((detail) => {
      detail.sets.forEach((set) => {
        if (set.reps && set.weightKg) {
          sum += set.reps * set.weightKg;
        }
      });
    });
    return Math.round(sum);
  }, [recentDetails]);

  const best1RM = useMemo(() => {
    let best = 0;
    recentDetails.forEach((detail) => {
      detail.sets.forEach((set) => {
        if (set.reps && set.weightKg) {
          const estimate = set.weightKg * (1 + set.reps / 30);
          if (estimate > best) best = estimate;
        }
      });
    });
    return best > 0 ? Math.round(best) : null;
  }, [recentDetails]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNewWorkout = () => {
    navigate("/workouts/new");
  };

  const handleHistory = () => {
    navigate("/sessions");
  };

  const handleProgress = () => {
    navigate("/progress");
  };

  const handleExercises = () => {
    navigate("/exercises");
  };

  const handleStartRoutine = async (workoutId: string) => {
    setStartingWorkoutId(workoutId);
    setWorkoutsError("");
    try {
      const created = await createSession({ workoutId });
      navigate(`/sessions/${created._id}`);
    } catch {
      setWorkoutsError("Could not start session. Please try again.");
    } finally {
      setStartingWorkoutId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-2 border-b border-border">
          <Dumbbell className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold tracking-tight">StrongerNotes</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3 w-full p-3 rounded-xl bg-primary/10 text-primary font-bold"
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button
            onClick={handleNewWorkout}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-secondary transition-colors text-secondary-foreground"
          >
            <PlusCircle size={20} />
            New Workout
          </button>
          <button
            onClick={handleHistory}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-secondary transition-colors text-secondary-foreground"
          >
            <History size={20} />
            History
          </button>
          <button
            onClick={handleProgress}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-secondary transition-colors text-secondary-foreground"
          >
            <TrendingUp size={20} />
            Progress
          </button>
          <button
            onClick={handleExercises}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-secondary transition-colors text-secondary-foreground"
          >
            <BookOpen size={20} />
            Exercises
          </button>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-3 mb-4">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
              {userInitial}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">{displayName}</p>
              <p className="text-xs text-secondary-foreground opacity-60 truncate">{displayEmail}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-colors text-secondary-foreground"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-20 bg-card border-b border-border flex items-center justify-between px-8">
          <h2 className="text-xl font-bold">Training Dashboard</h2>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="md:hidden w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
              {user?.name?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto w-full">
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold mb-2">Welcome back, {displayName}!</h1>
            <p className="text-secondary-foreground opacity-70 text-lg">Ready for another scientific session?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
              <p className="text-sm text-secondary-foreground mb-1 uppercase tracking-wider font-semibold opacity-60">Total Sessions</p>
              <h3 className="text-4xl font-black">{sessionsLoading ? "--" : totalSessions}</h3>
              <p className="text-xs text-secondary-foreground opacity-60 mt-1">All time</p>
            </div>
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
              <p className="text-sm text-secondary-foreground mb-1 uppercase tracking-wider font-semibold opacity-60">Volume (kg)</p>
              <h3 className="text-4xl font-black">{sessionsLoading ? "--" : totalVolume}</h3>
              <p className="text-xs text-secondary-foreground opacity-60 mt-1">Last 5 sessions</p>
            </div>
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
              <p className="text-sm text-secondary-foreground mb-1 uppercase tracking-wider font-semibold opacity-60">Next PR</p>
              <h3 className="text-4xl font-black text-primary">{sessionsLoading ? "--" : best1RM ? `${best1RM} kg` : "--"}</h3>
              <p className="text-xs text-secondary-foreground opacity-60 mt-1">Best est. 1RM</p>
            </div>
          </div>

          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Routines</h3>
              <button
                onClick={handleNewWorkout}
                className="text-primary font-bold hover:underline"
              >
                New Routine
              </button>
            </div>

            {workoutsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : workoutsError ? (
              <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {workoutsError}
              </div>
            ) : workouts.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border border-dashed p-10 text-center">
                <p className="text-secondary-foreground opacity-50 mb-6">No routines created yet.</p>
                <button
                  onClick={handleNewWorkout}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all inline-flex items-center gap-2"
                >
                  <PlusCircle size={18} />
                  Create First Routine
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workouts.map((workout) => (
                  <div key={workout._id} className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold">{workout.name}</p>
                      <p className="text-xs text-secondary-foreground opacity-60">
                        {workout.exercises?.length ?? 0} exercise{(workout.exercises?.length ?? 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/workouts/${workout._id}`)}
                        aria-label={`View ${workout.name}`}
                        className="px-3 py-2 text-sm font-semibold bg-secondary text-secondary-foreground rounded-lg hover:opacity-80 transition-all"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleStartRoutine(workout._id)}
                        aria-label={`Start ${workout.name}`}
                        disabled={startingWorkoutId === workout._id}
                        className="px-3 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all disabled:opacity-60"
                      >
                        {startingWorkoutId === workout._id ? "Starting..." : "Start"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Recent Activities</h3>
              <button onClick={handleHistory} className="text-primary font-bold hover:underline">
                View All
              </button>
            </div>
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sessionsError ? (
              <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {sessionsError}
              </div>
            ) : recentSessions.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border border-dashed p-12 text-center">
                <p className="text-secondary-foreground opacity-50 mb-6">No workouts registered yet.</p>
                <button
                  onClick={handleNewWorkout}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all inline-flex items-center gap-2"
                >
                  <PlusCircle size={18} />
                  Start First Workout
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session) => {
                  const dateLabel = formatDate(session.date ?? session.createdAt);
                  return (
                    <button
                      key={session._id}
                      type="button"
                      aria-label={`Open ${session.workout?.name ?? "workout"} session from ${dateLabel}`}
                      onClick={() => navigate(`/sessions/${session._id}`)}
                      className="w-full text-left bg-card border border-border rounded-2xl px-6 py-4 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-lg font-bold">{session.workout?.name ?? "Workout"}</p>
                          <p className="text-xs text-secondary-foreground opacity-60">{dateLabel}</p>
                        </div>
                        <span className="text-sm font-semibold text-primary">Open</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
