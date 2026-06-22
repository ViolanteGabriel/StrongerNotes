import { api } from '../services/requests/api';

describe('api client', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sets Authorization header when auth token exists', async () => {
    localStorage.setItem('auth_token', 'token-123');

    const config = await api.interceptors.request.handlers[0].fulfilled({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer token-123');
  });

  it('leaves headers unchanged when auth token is missing', async () => {
    const config = await api.interceptors.request.handlers[0].fulfilled({ headers: {} });

    expect(config.headers.Authorization).toBeUndefined();
  });
});
