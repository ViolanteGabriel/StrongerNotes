import { api } from '../../services/requests/api';
import { login } from '../../services/requests/auth/login';
import { createExercise } from '../../services/requests/exercises/createExercise';
import { getAllExercisesProgress } from '../../services/requests/exercises/getAllExercisesProgress';
import { getExerciseProgress } from '../../services/requests/exercises/getExerciseProgress';
import { getExercises } from '../../services/requests/exercises/getExercises';
import { createSession } from '../../services/requests/sessions/createSession';
import { createSet } from '../../services/requests/sessions/createSet';
import { deleteSession } from '../../services/requests/sessions/deleteSession';
import { deleteSet } from '../../services/requests/sessions/deleteSet';
import { getSessionById } from '../../services/requests/sessions/getSessionById';
import { getSessions } from '../../services/requests/sessions/getSessions';
import { updateSet } from '../../services/requests/sessions/updateSet';
import { createUser } from '../../services/requests/users/createUser';
import { deleteUser } from '../../services/requests/users/deleteUser';
import { updateUser } from '../../services/requests/users/updateUser';
import { createWorkout } from '../../services/requests/workouts/createWorkout';
import { deleteWorkout } from '../../services/requests/workouts/deleteWorkout';
import { getWorkoutById } from '../../services/requests/workouts/getWorkoutById';
import { getWorkouts } from '../../services/requests/workouts/getWorkouts';
import { updateWorkout } from '../../services/requests/workouts/updateWorkout';

jest.mock('../../services/requests/api');
const mockApi = api as jest.Mocked<typeof api>;

describe('API Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('login', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { token: 't', user: { _id: '1', name: 'N', email: 'E', createdAt: '', updatedAt: '' } } });
    await login({ email: 'E', password: 'P' });
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/auth/login', { email: 'E', password: 'P' });
  });

  it('createExercise', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { data: { _id: '1' } } });
    await createExercise({ name: 'N', category: 'strength', muscleGroup: 'M' });
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/exercises', { name: 'N', category: 'strength', muscleGroup: 'M' });
  });

  it('getAllExercisesProgress', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { data: [] } });
    await getAllExercisesProgress();
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/exercises/progress');
  });

  it('getExerciseProgress', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { data: {} } });
    await getExerciseProgress('1');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/exercises/1/progress');
  });

  it('getExercises', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { data: [] } });
    await getExercises();
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/exercises');
  });

  it('createSession', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { data: {} } });
    await createSession({ workoutId: 'w' });
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/sessions', { workoutId: 'w' });
  });

  it('createSet', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { data: {} } });
    await createSet('s', { exerciseId: 'e', order: 0 });
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/sessions/s/sets', { exerciseId: 'e', order: 0 });
  });

  it('deleteSession', async () => {
    mockApi.delete.mockResolvedValueOnce({ data: {} });
    await deleteSession('1');
    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/sessions/1');
  });

  it('deleteSet', async () => {
    mockApi.delete.mockResolvedValueOnce({ data: {} });
    await deleteSet('1', '2');
    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/sessions/1/sets/2');
  });

  it('getSessionById', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { data: {} } });
    await getSessionById('1');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/sessions/1');
  });

  it('getSessions', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { data: [] } });
    await getSessions();
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/sessions');
  });

  it('updateSet', async () => {
    mockApi.put.mockResolvedValueOnce({ data: { data: {} } });
    await updateSet('1', '2', { reps: 10 });
    expect(mockApi.put).toHaveBeenCalledWith('/api/v1/sessions/1/sets/2', { reps: 10 });
  });

  it('createUser', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { data: {} } });
    await createUser({ name: 'N', email: 'E', password: 'P' });
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/users', { name: 'N', email: 'E', password: 'P' });
  });

  it('createUser logs and rethrows API failures', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('create failed');
    mockApi.post.mockRejectedValueOnce(error);

    await expect(createUser({ name: 'N', email: 'E', password: 'P' })).rejects.toThrow('create failed');

    expect(consoleError).toHaveBeenCalledWith('Error creating user:', error);
    consoleError.mockRestore();
  });

  it('deleteUser', async () => {
    mockApi.delete.mockResolvedValueOnce({ data: {} });
    await deleteUser('1');
    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/users/1');
  });

  it('updateUser', async () => {
    mockApi.put.mockResolvedValueOnce({ data: {} });
    await updateUser('1', { name: 'M' });
    expect(mockApi.put).toHaveBeenCalledWith('/api/v1/users/1', { name: 'M' });
  });

  it('createWorkout', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { data: {} } });
    await createWorkout({ name: 'N' });
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/workouts', { name: 'N' });
  });

  it('deleteWorkout', async () => {
    mockApi.delete.mockResolvedValueOnce({ data: {} });
    await deleteWorkout('1');
    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/workouts/1');
  });

  it('getWorkoutById', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { data: {} } });
    await getWorkoutById('1');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/workouts/1');
  });

  it('getWorkouts', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { data: [] } });
    await getWorkouts();
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/workouts');
  });

  it('updateWorkout', async () => {
    mockApi.put.mockResolvedValueOnce({ data: { data: {} } });
    await updateWorkout('1', { name: 'M' });
    expect(mockApi.put).toHaveBeenCalledWith('/api/v1/workouts/1', { name: 'M' });
  });
});
