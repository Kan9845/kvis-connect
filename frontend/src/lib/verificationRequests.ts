export type VerificationStatus = "pending" | "approved" | "rejected";

export interface VerificationRequest {
  id: string;
  studentId: string;
  cohort: string;
  fullName: string;
  personalEmail: string;
  note: string;
  status: VerificationStatus;
  createdAt: string;
  reviewedAt?: string;
}

const STORAGE_KEY = "kvis-connect.verification-requests.v1";

export function readVerificationRequests(): VerificationRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

export function saveVerificationRequest(request: VerificationRequest) {
  const requests = readVerificationRequests();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([request, ...requests]));
}

export function updateVerificationStatus(id: string, status: VerificationStatus) {
  const requests = readVerificationRequests().map((request) =>
    request.id === id
      ? { ...request, status, reviewedAt: new Date().toISOString() }
      : request,
  );
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  return requests;
}
