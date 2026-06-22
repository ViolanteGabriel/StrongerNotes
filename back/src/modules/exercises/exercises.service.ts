import { Exercise, type IExercise } from './exercises.model.js';
import { Session } from '../sessions/sessions.model.js';
import { WorkoutSet, type ISet } from '../sessions/sets.model.js';
import type { CreateExerciseBody } from './exercises.schema.js';

export async function listExercises(userId: string) {
  return Exercise.find({
    $or: [{ isCustom: false }, { createdBy: userId }],
  })
    .sort({ isCustom: 1, name: 1 })
    .lean();
}

export async function createExercise(payload: CreateExerciseBody, userId: string) {
  const exercise = await Exercise.create({ ...payload, isCustom: true, createdBy: userId });
  return exercise.toObject();
}

export async function findExerciseById(exerciseId: string) {
  return Exercise.findById(exerciseId).lean();
}

export function canAccessExercise(exercise: Pick<IExercise, 'isCustom' | 'createdBy'>, userId: string) {
  return !exercise.isCustom || exercise.createdBy?.toString() === userId;
}

interface StrengthDataPoint {
  date: string;
  maxWeight: number;
  reps: number;
  estimated1RM: number;
}

interface CardioDataPoint {
  date: string;
  maxDuration: number;
  restSecs: number | null;
}

type ProgressDataPoint = StrengthDataPoint | CardioDataPoint;

function buildProgressData(
  exercise: Pick<IExercise, 'category'>,
  sets: ISet[],
  sessionDateMap: Map<string, Date>,
): ProgressDataPoint[] {
  const bySession = new Map<string, ISet[]>();
  for (const set of sets) {
    const key = set.session.toString();
    if (!bySession.has(key)) bySession.set(key, []);
    bySession.get(key)!.push(set);
  }

  const data: ProgressDataPoint[] = [];

  for (const [sessionId, sessionSets] of bySession) {
    const date = sessionDateMap.get(sessionId);
    if (!date) continue;
    const dateStr = date.toISOString();

    if (exercise.category === 'strength') {
      let bestSet = sessionSets[0];
      let best1RM = 0;
      for (const s of sessionSets) {
        const w = s.weightKg ?? 0;
        const r = s.reps ?? 1;
        const e1rm = r === 1 ? w : w * (1 + r / 30);
        if (e1rm > best1RM) {
          best1RM = e1rm;
          bestSet = s;
        }
      }
      data.push({
        date: dateStr,
        maxWeight: bestSet.weightKg ?? 0,
        reps: bestSet.reps ?? 0,
        estimated1RM: Math.round(best1RM * 10) / 10,
      });
    } else {
      const maxDuration = Math.max(...sessionSets.map((s) => s.durationSecs ?? 0));
      const maxDurationSet = sessionSets.find((s) => (s.durationSecs ?? 0) === maxDuration);
      data.push({
        date: dateStr,
        maxDuration,
        restSecs: maxDurationSet?.restSecs ?? null,
      });
    }
  }

  data.sort((a, b) => a.date.localeCompare(b.date));
  return data;
}

export async function getExerciseProgress(exerciseId: string, userId: string) {
  const exercise = await Exercise.findById(exerciseId).lean();
  if (!exercise) return null;

  const userSessions = await Session.find({ owner: userId }).select('_id date').lean();
  if (userSessions.length === 0) return { exercise, data: [] };

  const sessionIds = userSessions.map((s) => s._id);
  const sessionDateMap = new Map(userSessions.map((s) => [s._id.toString(), s.date]));

  const sets = await WorkoutSet.find({
    exercise: exerciseId,
    session: { $in: sessionIds },
  }).lean<ISet[]>();

  if (sets.length === 0) return { exercise, data: [] };

  const data = buildProgressData(exercise, sets, sessionDateMap);
  return { exercise, data };
}

export async function getAllExercisesProgress(userId: string) {
  const userSessions = await Session.find({ owner: userId }).select('_id date').lean();
  if (userSessions.length === 0) return [];

  const sessionIds = userSessions.map((s) => s._id);
  const sessionDateMap = new Map(userSessions.map((s) => [s._id.toString(), s.date]));

  const sets = await WorkoutSet.find({ session: { $in: sessionIds } }).lean<ISet[]>();
  if (sets.length === 0) return [];

  const setsByExercise = new Map<string, ISet[]>();
  for (const set of sets) {
    const key = set.exercise.toString();
    if (!setsByExercise.has(key)) setsByExercise.set(key, []);
    setsByExercise.get(key)!.push(set);
  }

  const exerciseIds = [...setsByExercise.keys()];
  const exercises = await Exercise.find({
    _id: { $in: exerciseIds },
    $or: [{ isCustom: false }, { createdBy: userId }],
  }).lean();
  const exerciseMap = new Map(exercises.map((e) => [e._id.toString(), e]));

  const result: { exercise: typeof exercises[number]; data: ProgressDataPoint[] }[] = [];
  for (const [exerciseId, exerciseSets] of setsByExercise) {
    const exercise = exerciseMap.get(exerciseId);
    if (!exercise) continue;
    const data = buildProgressData(exercise, exerciseSets, sessionDateMap);
    if (data.length > 0) result.push({ exercise, data });
  }

  result.sort((a, b) => a.exercise.name.localeCompare(b.exercise.name));
  return result;
}
