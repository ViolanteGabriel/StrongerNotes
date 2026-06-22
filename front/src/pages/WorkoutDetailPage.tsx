import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Dumbbell,
  LogOut,
  Moon,
  Pencil,
  Play,
  Plus,
  Search,
  Sun,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/auth-context";
import { useTheme } from "../contexts/ThemeContext";
import { getWorkoutById } from "../services/requests/workouts/getWorkoutById";
import { createWorkout } from "../services/requests/workouts/createWorkout";
import { updateWorkout } from "../services/requests/workouts/updateWorkout";
import { deleteWorkout } from "../services/requests/workouts/deleteWorkout";
import { getExercises, type Exercise } from "../services/requests/exercises/getExercises";
import { createSession } from "../services/requests/sessions/createSession";
import type { Workout } from "../services/requests/workouts/getWorkouts";

const WorkoutDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  const [deletingWorkout, setDeletingWorkout] = useState(false);

  const [workoutName, setWorkoutName] = useState("");
  const [editingName, setEditingName] = useState(isNew);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [exerciseSearch, setExerciseSearch] = useState("");
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  useEffect(() => {
    const fetches: Promise<void>[] = [
      getExercises().then(setAllExercises).catch(console.error),
    ];
    if (!isNew && id) {
      fetches.push(
        getWorkoutById(id)
          .then((w) => { setWorkout(w); setWorkoutName(w.name); setEditingName(false); })
          .catch(() => navigate("/dashboard"))
          .finally(() => setLoading(false))
      );
    }
    Promise.all(fetches);
  }, [id, isNew, navigate]);

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus();
  }, [editingName]);

  const selectedExerciseIds = workout?.exercises.map((e) => e._id) ?? [];

  const filteredExercises = allExercises.filter(
    (e) =>
      !selectedExerciseIds.includes(e._id) &&
      (e.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
        e.muscleGroup.toLowerCase().includes(exerciseSearch.toLowerCase()))
  );

  const handleSaveName = async () => {
    const name = workoutName.trim();
    if (!name) return;
    setSaving(true);
    try {
      if (isNew) {
        const created = await createWorkout({ name });
        navigate(`/workouts/${created._id}`, { replace: true });
      } else if (id) {
        const updated = await updateWorkout(id, { name });
        setWorkout(updated);
        setEditingName(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddExercise = async (exercise: Exercise) => {
    if (!workout) return;
    const newIds = [...selectedExerciseIds, exercise._id];
    try {
      const updated = await updateWorkout(workout._id, { exercises: newIds });
      setWorkout(updated);
    } catch (err) {
      console.error(err);
    }
    setExerciseSearch("");
  };

  const handleRemoveExercise = async (exerciseId: string) => {
    if (!workout) return;
    const newIds = selectedExerciseIds.filter((id) => id !== exerciseId);
    try {
      const updated = await updateWorkout(workout._id, { exercises: newIds });
      setWorkout(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartSession = async () => {
    if (!workout) return;
    setStartingSession(true);
    try {
      const session = await createSession({ workoutId: workout._id });
      navigate(`/sessions/${session._id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setStartingSession(false);
    }
  };

  const handleDeleteWorkout = async () => {
    if (!workout || !window.confirm("Delete this routine? This action cannot be undone.")) return;
    setDeletingWorkout(true);
    try {
      await deleteWorkout(workout._id);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setDeletingWorkout(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

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

      <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-secondary-foreground hover:text-foreground mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        {/* Workout name */}
        <div className="mb-8">
          {editingName ? (
            <div className="flex items-center gap-3">
              <input
                ref={nameInputRef}
                aria-label="Routine name"
                type="text"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape" && !isNew) setEditingName(false); }}
                placeholder="e.g. Push Day A"
                className="flex-1 text-2xl font-bold bg-transparent border-b-2 border-primary outline-none pb-1 placeholder:text-secondary-foreground/40"
              />
              <button
                aria-label="Save routine name"
                onClick={handleSaveName}
                disabled={saving || !workoutName.trim()}
                className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                <Check className="w-5 h-5" />
              </button>
              {!isNew && (
                <button
                  aria-label="Cancel routine name edit"
                  onClick={() => { setWorkoutName(workout?.name ?? ""); setEditingName(false); }}
                  className="p-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-80 transition-all border border-border"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight">{workout?.name}</h1>
              <button
                aria-label="Edit routine name"
                onClick={() => setEditingName(true)}
                className="p-1.5 rounded-lg text-secondary-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {!isNew && workout && (
          <>
            {/* Actions */}
            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={handleStartSession}
                disabled={startingSession || workout.exercises.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
              >
                <Play className="w-4 h-4" />
                {startingSession ? "Starting…" : "Start Session"}
              </button>
              {workout.exercises.length === 0 && (
                <span className="text-sm text-secondary-foreground opacity-70">Add exercises first</span>
              )}
            </div>

            {/* Exercise list */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold">Exercises ({workout.exercises.length})</h2>
                <button
                  onClick={() => setShowExercisePicker((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-80 transition-all border border-border"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>

              {/* Exercise picker */}
              {showExercisePicker && (
                <div className="bg-card border border-border rounded-2xl p-4 mb-4">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-foreground opacity-50" />
                    <input
                      aria-label="Search exercises"
                      type="text"
                      value={exerciseSearch}
                      onChange={(e) => setExerciseSearch(e.target.value)}
                      placeholder="Search exercises…"
                      className="w-full pl-9 pr-4 py-2 bg-input border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {filteredExercises.length === 0 ? (
                      <p className="text-sm text-secondary-foreground opacity-70 text-center py-4">No exercises found</p>
                    ) : (
                      filteredExercises.map((ex) => (
                        <button
                          key={ex._id}
                          aria-label={`Add ${ex.name}`}
                          onClick={() => handleAddExercise(ex)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-secondary transition-all text-left"
                        >
                          <div>
                            <span className="text-sm font-medium">{ex.name}</span>
                            <span className="text-xs text-secondary-foreground opacity-60 ml-2">{ex.muscleGroup}</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ex.category === "strength" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"}`}>
                            {ex.category}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <Link to="/exercises" className="text-sm text-primary hover:opacity-80 transition-opacity font-medium">
                      Browse full library or create custom →
                    </Link>
                  </div>
                </div>
              )}

              {workout.exercises.length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center text-secondary-foreground opacity-70">
                  <p className="text-sm">No exercises yet. Click "Add" to build your routine.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {workout.exercises.map((ex, i) => (
                    <div key={ex._id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{ex.name}</p>
                        <p className="text-xs text-secondary-foreground opacity-60">{ex.muscleGroup} · {ex.category}</p>
                      </div>
                      <button
                        aria-label={`Remove ${ex.name}`}
                        onClick={() => handleRemoveExercise(ex._id)}
                        className="p-1.5 text-secondary-foreground hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Danger zone */}
            <div className="border border-red-200 dark:border-red-900/40 rounded-2xl p-5 mt-10">
              <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">Danger Zone</h3>
              <button
                onClick={handleDeleteWorkout}
                disabled={deletingWorkout}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                {deletingWorkout ? "Deleting…" : "Delete Routine"}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default WorkoutDetailPage;
