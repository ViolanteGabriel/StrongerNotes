import type { APIRequestContext, Page } from "@playwright/test";
import { createAuthenticatedUser, type TestAuth } from "./api";

export async function seedAuthStorage(page: Page, auth: TestAuth) {
  await page.addInitScript(({ token, user }) => {
    window.localStorage.setItem("auth_token", token);
    window.localStorage.setItem("auth_user", JSON.stringify(user));
  }, {
    token: auth.token,
    user: auth.user,
  });
}

export async function loginViaApi(page: Page, request: APIRequestContext) {
  const auth = await createAuthenticatedUser(request);
  await seedAuthStorage(page, auth);
  return auth;
}
