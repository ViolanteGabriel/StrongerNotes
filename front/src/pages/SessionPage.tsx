import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Dumbbell,
  LogOut,
  Moon,
  Plus,
  Sun,
  Timer,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/auth-context";
import { useTheme } from "../contexts/ThemeContext";
import { getSessionById, type SessionDetail, type WorkoutSet } from "../services/requests/sessions/getSessionById";
import { createSet } from "../services/requests/sessions/createSet";
import { updateSet } from "../services/requests/sessions/updateSet";
import { deleteSet } from "../services/requests/sessions/deleteSet";
import { deleteSession } from "../services/requests/sessions/deleteSession";
import type { Exercise } from "../services/requests/exercises/getExercises";

interface SetDraft {
  exerciseId: string;
  reps: string;
  weightKg: string;
  durationSecs: string;
  restSecs: string;
  notes: string;
}

const emptyDraft = (exerciseId: string): SetDraft => ({
  exerciseId,
  reps: "",
  weightKg: "",
  durationSecs: "",
  restSecs: "",
  notes: "",
});

const toOptionalPositiveInt = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return 1;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num <= 0) return 1;
  return Math.round(num);
};

const toOptionalPositiveNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return 1;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num <= 0) return 1;
  return num;
};

const SetRow = ({
  set,
  sessionId,
  onUpdate,
  onDelete,
}: {
  set: WorkoutSet;
  sessionId: string;
  onUpdate: (updated: WorkoutSet) => void;
  onDelete: (setId: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [reps, setReps] = useState(String(set.reps ?? ""));
  const [weightKg, setWeightKg] = useState(String(set.weightKg ?? ""));
  const [durationSecs, setDurationSecs] = useState(String(set.durationSecs ?? ""));
  const [restSecs, setRestSecs] = useState(String(set.restSecs ?? ""));
  const [notes, setNotes] = useState(set.notes ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        reps: toOptionalPositiveInt(reps),
        weightKg: toOptionalPositiveNumber(weightKg),
        durationSecs: toOptionalPositiveInt(durationSecs),
        restSecs: toOptionalPositiveInt(restSecs),
        notes: notes? notes.trim() : "",
      };
      const updated = await updateSet(sessionId, set._id, payload);
      onUpdate(updated);
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSet(sessionId, set._id);
      onDelete(set._id);
    } catch (err) {
      console.error(err);
    }
  };

  if (editing) {
    return (
      <div className="bg-secondary/50 rounded-xl px-4 py-3 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(set.exercise as Exercise).category === "strength" ? (
            <>
              <div>
                <label className="text-xs text-secondary-foreground opacity-70 font-medium">Reps</label>
                <input aria-label="Edit reps" type="number" min="1" value={reps} onChange={(e) => setReps(e.target.value)} className="w-full mt-1 px-2 py-1.5 bg-input border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-secondary-foreground opacity-70 font-medium">Weight (kg)</label>
                <input aria-label="Edit weight" type="number" min="0.5" step="0.5" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="w-full mt-1 px-2 py-1.5 bg-input border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </>
          ) : (
            <div>
              <label className="text-xs text-secondary-foreground opacity-70 font-medium">Duration (s)</label>
              <input aria-label="Edit duration" type="number" min="1" value={durationSecs} onChange={(e) => setDurationSecs(e.target.value)} className="w-full mt-1 px-2 py-1.5 bg-input border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
          )}
          <div>
            <label className="text-xs text-secondary-foreground opacity-70 font-medium">Rest (s)</label>
            <input aria-label="Edit rest" type="number" min="1" value={restSecs} onChange={(e) => setRestSecs(e.target.value)} className="w-full mt-1 px-2 py-1.5 bg-input border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="sm:col-span-1 col-span-2 sm:col-start-auto">
            <label className="text-xs text-secondary-foreground opacity-70 font-medium">Notes</label>
            <input aria-label="Edit notes" type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="optional" className="w-full mt-1 px-2 py-1.5 bg-input border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all">
            <Check className="w-3.5 h-3.5" /> Save
          </button>
          <button onClick={() => setEditing(false)} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-80 transition-all border border-border">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const isStrength = (set.exercise as Exercise).category === "strength";
  const summary = [
    isStrength && set.reps != null ? `${set.reps} reps` : null,
    isStrength && set.weightKg != null ? `${set.weightKg} kg` : null,
    !isStrength && set.durationSecs != null ? `${set.durationSecs}s` : null,
    set.restSecs != null ? `${set.restSecs}s rest` : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-secondary/50 transition-colors group">
      <span className="text-xs text-secondary-foreground opacity-50 w-4 shrink-0">{set.order + 1}</span>
      <p className="flex-1 text-sm">{summary || <span className="opacity-50 italic">No data logged</span>}</p>
      {set.notes && <p className="text-xs text-secondary-foreground opacity-60 truncate max-w-[120px]">{set.notes}</p>}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button aria-label="Edit set" onClick={() => setEditing(true)} className="p-1 rounded text-secondary-foreground hover:text-foreground transition-colors">
          <Dumbbell className="w-3.5 h-3.5" />
        </button>
        <button aria-label="Delete set" onClick={handleDelete} className="p-1 rounded text-secondary-foreground hover:text-red-500 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const AddSetForm = ({
  exercise,
  sessionId,
  nextOrder,
  onAdded,
  onCancel,
}: {
  exercise: Exercise;
  sessionId: string;
  nextOrder: number;
  onAdded: (set: WorkoutSet) => void;
  onCancel: () => void;
}) => {
  const [draft, setDraft] = useState<SetDraft>(emptyDraft(exercise._id));
  const [saving, setSaving] = useState(false);

  const set = (key: keyof SetDraft, val: string) => setDraft((d) => ({ ...d, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const added = await createSet(sessionId, {
        exerciseId: exercise._id,
        order: nextOrder,
        reps: toOptionalPositiveInt(draft.reps),
        weightKg: toOptionalPositiveNumber(draft.weightKg),
        durationSecs: toOptionalPositiveInt(draft.durationSecs),
        restSecs: toOptionalPositiveInt(draft.restSecs),
        notes: draft.notes.trim() || null,
      });
      onAdded(added);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {exercise.category === "strength" ? (
          <>
            <div>
              <label className="text-xs text-secondary-foreground opacity-70 font-medium">Reps</label>
              <input aria-label="Reps" type="number" min="1" value={draft.reps} onChange={(e) => set("reps", e.target.value)} className="w-full mt-1 px-2 py-1.5 bg-input border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-secondary-foreground opacity-70 font-medium">Weight (kg)</label>
              <input aria-label="Weight (kg)" type="number" min="0.5" step="0.5" value={draft.weightKg} onChange={(e) => set("weightKg", e.target.value)} className="w-full mt-1 px-2 py-1.5 bg-input border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </>
        ) : (
          <div>
            <label className="text-xs text-secondary-foreground opacity-70 font-medium">Duration (s)</label>
            <input aria-label="Duration (s)" type="number" min="1" value={draft.durationSecs} onChange={(e) => set("durationSecs", e.target.value)} className="w-full mt-1 px-2 py-1.5 bg-input border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
          </div>
        )}
        <div>
          <label className="text-xs text-secondary-foreground opacity-70 font-medium">Rest (s)</label>
          <input aria-label="Rest (s)" type="number" min="1" value={draft.restSecs} onChange={(e) => set("restSecs", e.target.value)} className="w-full mt-1 px-2 py-1.5 bg-input border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="sm:col-span-1 col-span-2">
          <label className="text-xs text-secondary-foreground opacity-70 font-medium">Notes</label>
          <input aria-label="Notes" type="text" value={draft.notes} onChange={(e) => set("notes", e.target.value)} placeholder="optional" className="w-full mt-1 px-2 py-1.5 bg-input border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all">
          <Check className="w-3.5 h-3.5" /> Log Set
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-80 transition-all border border-border">
          Cancel
        </button>
      </div>
    </div>
  );
};

const SessionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingForExercise, setAddingForExercise] = useState<string | null>(null);
  const [deletingSession, setDeletingSession] = useState(false);

  useEffect(() => {
    if (!id) return;
    getSessionById(id)
      .then((s) => { setSession(s); setSets(s.sets); })
      .catch(() => navigate("/dashboard"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSetAdded = (added: WorkoutSet) => {
    setSets((prev) => [...prev, added]);
    setAddingForExercise(null);
  };

  const handleSetUpdated = (updated: WorkoutSet) => {
    setSets((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
  };

  const handleSetDeleted = (setId: string) => {
    setSets((prev) => prev.filter((s) => s._id !== setId));
  };

  const handleDeleteSession = async () => {
    if (!session || !window.confirm("Delete this session? All logged sets will be lost.")) return;
    setDeletingSession(true);
    try {
      await deleteSession(session._id);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setDeletingSession(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const exercises: Exercise[] = (session.workout as { exercises?: Exercise[] }).exercises ?? [];
  const totalSets = sets.length;

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

        {/* Session header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">{session.workout.name}</h1>
              <p className="text-secondary-foreground opacity-70 mt-1 flex items-center gap-2">
                <Timer className="w-4 h-4" />
                {new Date(session.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div
              className="bg-primary/10 text-primary rounded-xl px-4 py-2 text-center shrink-0"
              aria-label={`${totalSets} ${totalSets === 1 ? "set" : "sets"} logged`}
            >
              <p className="text-2xl font-bold">{totalSets}</p>
              <p className="text-xs font-medium opacity-80">{totalSets === 1 ? "set" : "sets"} logged</p>
            </div>
          </div>
        </div>

        {/* Exercise blocks */}
        {exercises.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center text-secondary-foreground opacity-70">
            <p>This routine has no exercises. Edit the routine to add some.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {exercises.map((exercise) => {
              const exerciseSets = sets.filter((s) => {
                const ex = s.exercise as Exercise;
                return ex._id === exercise._id;
              });
              const isAdding = addingForExercise === exercise._id;

              return (
                <div key={exercise._id} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div>
                      <h3 className="font-bold">{exercise.name}</h3>
                      <p className="text-xs text-secondary-foreground opacity-60 mt-0.5">{exercise.muscleGroup} · {exercise.category}</p>
                    </div>
                    <span className="text-sm text-secondary-foreground opacity-60">{exerciseSets.length} set{exerciseSets.length !== 1 ? "s" : ""}</span>
                  </div>

                  <div className="p-2">
                    {exerciseSets.length === 0 && !isAdding ? (
                      <p className="text-sm text-secondary-foreground opacity-50 text-center py-3">No sets logged yet</p>
                    ) : (
                      exerciseSets.map((set) => (
                        <SetRow
                          key={set._id}
                          set={set}
                          sessionId={session._id}
                          onUpdate={handleSetUpdated}
                          onDelete={handleSetDeleted}
                        />
                      ))
                    )}

                    {isAdding ? (
                      <div className="px-2 pb-2 pt-1">
                        <AddSetForm
                          exercise={exercise}
                          sessionId={session._id}
                          nextOrder={exerciseSets.length}
                          onAdded={handleSetAdded}
                          onCancel={() => setAddingForExercise(null)}
                        />
                      </div>
                    ) : (
                      <button
                        aria-label={`Log set for ${exercise.name}`}
                        onClick={() => setAddingForExercise(exercise._id)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 rounded-xl transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Log Set
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Finish + Delete */}
        <div className="mt-10 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all"
          >
            <X className="w-4 h-4" />
            Finish Session
          </button>
          <button
            onClick={handleDeleteSession}
            disabled={deletingSession}
            className="inline-flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {deletingSession ? "Deleting…" : "Delete Session"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default SessionPage;
