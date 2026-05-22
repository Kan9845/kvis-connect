import MockAdapter from "axios-mock-adapter";
import api from "./api";

const REGISTERED_EMAILS = new Set(["00123@kvis.ac.th"]);

const mock = new MockAdapter(api, { delayResponse: 400 });

// POST /api/auth/register
mock.onPost("/api/auth/register").reply((config) => {
  const body = JSON.parse(config.data);
  const email: string = body.email ?? "";

  if (!email.endsWith("@kvis.ac.th")) {
    return [400, { detail: "Only @kvis.ac.th emails are allowed" }];
  }
  if (REGISTERED_EMAILS.has(email)) {
    return [400, { detail: "Email already registered" }];
  }

  REGISTERED_EMAILS.add(email);
  return [200, { message: "Registered successfully", user_id: 999 }];
});

// POST /api/auth/login
mock.onPost("/api/auth/login").reply((config) => {
  const body = JSON.parse(config.data);
  if (body.email === "00123@kvis.ac.th" && body.password === "password") {
    return [200, { message: "Logged in", user_id: 1 }];
  }
  return [401, { detail: "Invalid credentials" }];
});

// POST /api/auth/logout
mock.onPost("/api/auth/logout").reply(200, { message: "Logged out" });

// POST /api/auth/refresh - always succeeds in mock (no real cookie TTL)
mock.onPost("/api/auth/refresh").reply(200, { message: "Token refreshed" });

// POST /api/auth/password-reset/request
const VALID_RESET_TOKEN = "mock-reset-token-abc123";
mock.onPost("/api/auth/password-reset/request").reply((config) => {
  const body = JSON.parse(config.data);
  const email: string = body.email ?? "";

  if (!email.endsWith("@kvis.ac.th")) {
    return [400, { detail: "Only @kvis.ac.th emails are allowed" }];
  }
  if (!REGISTERED_EMAILS.has(email)) {
    // Return 200 regardless (don't leak whether email exists)
    return [200, { message: "If that email is registered, a reset link has been sent." }];
  }

  // In a real app an email would be sent. Log the token to console for testing.
  console.info(`[mock] Password reset token for ${email}: /auth/reset-password?token=${VALID_RESET_TOKEN}`);
  return [200, { message: "If that email is registered, a reset link has been sent." }];
});

// POST /api/auth/password-reset/confirm
mock.onPost("/api/auth/password-reset/confirm").reply((config) => {
  const body = JSON.parse(config.data);
  const { token, new_password } = body;

  if (token !== VALID_RESET_TOKEN) {
    return [400, { detail: "Invalid or expired reset token." }];
  }
  if (!new_password || new_password.length < 6) {
    return [400, { detail: "Password must be at least 6 characters." }];
  }

  // Update the mock password (in real life this would update the DB)
  console.info("[mock] Password reset successful. New password accepted.");
  return [200, { message: "Password reset successfully." }];
});

// GET /api/users/me - return 401 (not logged in by default in mock)
mock.onGet("/api/users/me").reply(401, { detail: "Not authenticated" });

// Pass through everything else
mock.onAny().passThrough();
