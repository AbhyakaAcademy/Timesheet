import { getApiBaseUrl } from "@/lib/auth";

function getApiErrorMessage(data, fallbackMessage) {
  return data?.error?.message || data?.detail || fallbackMessage;
}

export async function requestTenantSignup(payload) {
  let response;
  try {
    response = await fetch(`${getApiBaseUrl()}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      `Cannot reach the backend at ${getApiBaseUrl()}. Start the Django server and verify NEXT_PUBLIC_API_BASE_URL if needed.`
    );
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, "Unable to start signup."));
  }

  return data;
}

export async function verifyTenantEmail(token) {
  const response = await fetch(`${getApiBaseUrl()}/auth/verify-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, "Unable to verify email."));
  }

  return data;
}

export async function resendTenantVerificationEmail(email) {
  let response;
  try {
    response = await fetch(`${getApiBaseUrl()}/auth/resend-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new Error(
      `Cannot reach the backend at ${getApiBaseUrl()}. Start the Django server and verify NEXT_PUBLIC_API_BASE_URL if needed.`
    );
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, "Unable to resend verification email."));
  }

  return data;
}

export async function getInvitationStatus(token) {
  const response = await fetch(`${getApiBaseUrl()}/auth/accept-invite?token=${encodeURIComponent(token)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, "Unable to load invitation."));
  }

  return data;
}

export async function acceptInvitation(payload) {
  let response;
  try {
    response = await fetch(`${getApiBaseUrl()}/auth/accept-invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      `Cannot reach the backend at ${getApiBaseUrl()}. Start the Django server and verify NEXT_PUBLIC_API_BASE_URL if needed.`
    );
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, "Unable to accept invitation."));
  }

  return data;
}

export async function requestPasswordReset(email) {
  let response;
  try {
    response = await fetch(`${getApiBaseUrl()}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new Error(
      `Cannot reach the backend at ${getApiBaseUrl()}. Start the Django server and verify NEXT_PUBLIC_API_BASE_URL if needed.`
    );
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, "Unable to send password reset email."));
  }

  return data;
}

export async function getPasswordResetStatus(token) {
  const response = await fetch(`${getApiBaseUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, "Unable to load reset link."));
  }

  return data;
}

export async function resetPassword(payload) {
  let response;
  try {
    response = await fetch(`${getApiBaseUrl()}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      `Cannot reach the backend at ${getApiBaseUrl()}. Start the Django server and verify NEXT_PUBLIC_API_BASE_URL if needed.`
    );
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, "Unable to reset password."));
  }

  return data;
}
