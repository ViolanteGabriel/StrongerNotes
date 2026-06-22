import { describe, expect, it } from 'vitest';
import { setupIntegrationApp } from './setup.js';
import {
  authHeaders,
  createAuthenticatedUser,
  expectJsonData,
  expectJsonError,
  uniqueTestEmail,
  type AuthUser,
} from '../test/helpers.js';

const getApp = setupIntegrationApp();

describe('backend integration: account lifecycle', () => {
  it('registers, authenticates, updates, rejects email conflicts, and deletes an account', async () => {
    const app = getApp();
    const auth = await createAuthenticatedUser(app, { name: 'Lifecycle User' });

    const meRes = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me',
      headers: authHeaders(auth.token),
    });
    const me = expectJsonData<AuthUser>(meRes, 200);
    expect(me._id).toBe(auth.user._id);
    expect(me.email).toBe(auth.email);

    const updatedEmail = uniqueTestEmail('lifecycle-updated');
    const updateRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/users/${auth.user._id}`,
      headers: authHeaders(auth.token),
      payload: { name: 'Lifecycle Updated', email: updatedEmail },
    });
    const updated = expectJsonData<AuthUser & { passwordHash?: string }>(updateRes, 200);
    expect(updated.name).toBe('Lifecycle Updated');
    expect(updated.email).toBe(updatedEmail);
    expect(updated.passwordHash).toBeUndefined();

    const refreshedLoginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: updatedEmail, password: auth.password },
    });
    const refreshed = expectJsonData<{ token: string; user: AuthUser }>(refreshedLoginRes, 200);
    expect(refreshed.user.name).toBe('Lifecycle Updated');

    const taken = await createAuthenticatedUser(app);
    const conflictRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/users/${auth.user._id}`,
      headers: authHeaders(refreshed.token),
      payload: { email: taken.email },
    });
    expectJsonError(conflictRes, 409);

    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/users/${auth.user._id}`,
      headers: authHeaders(refreshed.token),
    });
    expect(deleteRes.statusCode).toBe(204);

    const deletedLoginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: updatedEmail, password: auth.password },
    });
    expectJsonError(deletedLoginRes, 401);
  });
});
