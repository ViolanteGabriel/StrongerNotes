import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Dumbbell,
  LogOut,
  Moon,
  Plus,
  Search,
  Sun,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/auth-context";
import { useTheme } from "../contexts/ThemeContext";
import { getExercises, type Exercise } from "../services/requests/exercises/getExercises";
import { createExercise } from "../services/requests/exercises/createExercise";

const MUSCLE_GROUPS = [
  "All",
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Quadriceps",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Core",
  "Full Body",
];

const ExercisesPage = () => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "strength" | "cardio">("all");
  const [muscleFilter, setMuscleFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<"strength" | "cardio">("strength");
  const [newMuscle, setNewMuscle] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    getExercises()
      .then(setExercises)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = exercises.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.muscleGroup.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || e.category === categoryFilter;
    const matchesMuscle = muscleFilter === "All" || e.muscleGroup === muscleFilter;
    return matchesSearch && matchesCategory && matchesMuscle;
  });

  const handleCreate = async () => {
    setFormError("");
    if (!newName.trim()) { setFormError("Exercise name is required."); return; }
    if (!newMuscle.trim()) { setFormError("Muscle group is required."); return; }
    setCreating(true);
    try {
      const created = await createExercise({ name: newName.trim(), category: newCategory, muscleGroup: newMuscle.trim() });
      setExercises((prev) => [created, ...prev]);
      setNewName("");
      setNewCategory("strength");
      setNewMuscle("");
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setFormError("Failed to create exercise. Please try again.");
    } finally {
      setCreating(false);
    }
  };

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

      <main className="flex-1 px-6 py-10 max-w-5xl mx-auto w-full">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-secondary-foreground hover:text-foreground mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Exercise Library</h1>
            <p className="text-secondary-foreground opacity-70 mt-1 text-sm">Browse public exercises or create your own</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-all"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cancel" : "New Exercise"}
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="font-bold mb-4">Create Custom Exercise</h2>
            {formError && (
              <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label htmlFor="new-exercise-name" className="block text-sm font-semibold mb-1">Name</label>
                <input
                  id="new-exercise-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Cable Fly"
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <div>
                <label htmlFor="new-exercise-category" className="block text-sm font-semibold mb-1">Category</label>
                <select
                  id="new-exercise-category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as "strength" | "cardio")}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="strength">Strength</option>
                  <option value="cardio">Cardio</option>
                </select>
              </div>
              <div>
                <label htmlFor="new-exercise-muscle" className="block text-sm font-semibold mb-1">Muscle Group</label>
                <input
                  id="new-exercise-muscle"
                  type="text"
                  value={newMuscle}
                  onChange={(e) => setNewMuscle(e.target.value)}
                  placeholder="e.g. Chest"
                  list="muscle-groups"
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <datalist id="muscle-groups">
                  {MUSCLE_GROUPS.filter((m) => m !== "All").map((m) => <option key={m} value={m} />)}
                </datalist>
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
            >
              <Check className="w-4 h-4" />
              {creating ? "Creating…" : "Create Exercise"}
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-foreground opacity-50" />
            <input
              aria-label="Search exercises"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or muscle group…"
              className="w-full pl-9 pr-4 py-2.5 bg-input border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "strength", "cardio"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                  categoryFilter === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-secondary-foreground border-border hover:opacity-80"
                }`}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Muscle group pills */}
        <div className="flex gap-2 flex-wrap mb-6">
          {MUSCLE_GROUPS.map((m) => (
            <button
              key={m}
              onClick={() => setMuscleFilter(m)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                muscleFilter === m
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:opacity-80"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Exercise grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-secondary-foreground opacity-70">
            <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No exercises match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((exercise) => (
              <div key={exercise._id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 flex items-center justify-center rounded-lg shrink-0 mt-0.5">
                  <Dumbbell className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{exercise.name}</p>
                    {exercise.isCustom && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-medium">custom</span>
                    )}
                  </div>
                  <p className="text-xs text-secondary-foreground opacity-60 mt-0.5">{exercise.muscleGroup}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      exercise.category === "strength"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    }`}>
                      {exercise.category}
                    </span>
                    <Link
                      to={`/exercises/${exercise._id}/progress`}
                      aria-label={`View progress for ${exercise.name}`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:opacity-80 transition-opacity font-medium"
                    >
                      <TrendingUp className="w-3 h-3" />
                      Progress
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <p className="text-center text-xs text-secondary-foreground opacity-50 mt-6">
            {filtered.length} exercise{filtered.length !== 1 ? "s" : ""} shown
          </p>
        )}
      </main>
    </div>
  );
};

export default ExercisesPage;
