import { Session } from './sessions.model.js';
import { WorkoutSet } from './sets.model.js';
import type { CreateSessionBody, CreateSetBody, UpdateSetBody } from './sessions.schema.js';

export async function listSessions(userId: string) {
  return Session.find({ owner: userId })
    .populate('workout', 'name')
    .sort({ date: -1 })
    .lean();
}

export async function createSession(payload: CreateSessionBody, userId: string) {
  const session = await Session.create({
    workout: payload.workoutId,
    owner: userId,
    date: payload.date ?? new Date(),
    notes: payload.notes ?? null,
  });
  return session.toObject();
}

export async function findSessionById(id: string) {
  return Session.findById(id)
    .populate({
      path: 'workout',
      select: 'name exercises',
      populate: { path: 'exercises', select: 'name category muscleGroup' },
    })
    .lean();
}

export async function deleteSession(id: string) {
  await WorkoutSet.deleteMany({ session: id });
  return Session.findByIdAndDelete(id).lean();
}

export async function listSetsBySession(sessionId: string) {
  return WorkoutSet.find({ session: sessionId })
    .populate('exercise', 'name category muscleGroup')
    .sort({ order: 1, createdAt: 1 })
    .lean();
}

export async function createSet(sessionId: string, payload: CreateSetBody) {
  const set = await WorkoutSet.create({
    session: sessionId,
    exercise: payload.exerciseId,
    order: payload.order ?? 0,
    reps: payload.reps ?? null,
    weightKg: payload.weightKg ?? null,
    durationSecs: payload.durationSecs ?? null,
    restSecs: payload.restSecs ?? null,
    notes: payload.notes ?? null,
  });
  return WorkoutSet.findById(set._id).populate('exercise', 'name category muscleGroup').lean();
}

export async function updateSet(sessionId: string, setId: string, payload: UpdateSetBody) {
  return WorkoutSet.findOneAndUpdate({ _id: setId, session: sessionId }, { $set: payload }, { new: true })
    .populate('exercise', 'name category muscleGroup')
    .lean();
}

export async function deleteSet(sessionId: string, setId: string) {
  return WorkoutSet.findOneAndDelete({ _id: setId, session: sessionId }).lean();
}
