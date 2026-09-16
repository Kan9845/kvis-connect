import api from "./api";

export type VerificationStatus = "pending" | "approved" | "rejected" | "activated";

export interface VerificationRequest {
  id: string;
  studentId: string;
  cohort: string;
  fullName: string;
  nickname: string;
  classroom: string;
  applicantType: "alumni" | "student";
  currentGrade: number | null;
  homeroomTeacher: string;
  projectName: string;
  advisor: string;
  personalEmail: string;
  note: string;
  status: VerificationStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewNote?: string;
  tokenExpiresAt?: string;
}

interface ServerRequest {
  applicant_type: "alumni" | "student"; current_grade: number | null; homeroom_teacher: string;
  id: string; student_id: string | null; cohort: string; full_name: string;
  nickname: string; classroom: string; project_name: string; advisor: string;
  personal_email: string; note: string; status: VerificationStatus; created_at: string;
  reviewed_at?: string; review_note: string; token_expires_at?: string;
}

function fromServer(item: ServerRequest): VerificationRequest {
  return { id: item.id, studentId: item.student_id ?? "", cohort: item.cohort,
    applicantType: item.applicant_type, currentGrade: item.current_grade, homeroomTeacher: item.homeroom_teacher,
    fullName: item.full_name, nickname: item.nickname, classroom: item.classroom,
    projectName: item.project_name, advisor: item.advisor, personalEmail: item.personal_email,
    note: item.note, status: item.status, createdAt: item.created_at, reviewedAt: item.reviewed_at,
    reviewNote: item.review_note, tokenExpiresAt: item.token_expires_at };
}

const mutation = { headers: { "X-Verification-Action": "v1" } };
export async function readVerificationRequests(page = 1) {
  const { data } = await api.get<{ items: ServerRequest[]; total: number; pending: number }>("/api/admin/verification-requests", { params: { page, page_size: 25 } });
  return { ...data, items: data.items.map(fromServer) };
}

export async function saveVerificationRequest(request: Omit<VerificationRequest, "id" | "status" | "createdAt">) {
  await api.post("/api/verification/requests", {
    applicant_type: request.applicantType, current_grade: request.currentGrade, homeroom_teacher: request.homeroomTeacher,
    student_id: request.studentId || null, cohort: request.cohort, full_name: request.fullName,
    nickname: request.nickname, classroom: request.classroom, project_name: request.projectName,
    advisor: request.advisor, personal_email: request.personalEmail, note: request.note,
  }, mutation);
}

export async function updateVerificationStatus(id: string, status: "approved" | "rejected", reviewNote: string, studentId: string) {
  const { data } = await api.post<ServerRequest>(`/api/admin/verification-requests/${id}/review`, { status, review_note: reviewNote, student_id: studentId || null }, mutation);
  return fromServer(data);
}

export interface ActivationLink { activation_url: string; email_message: string; recipient: string; expires_at: string }
export async function generateActivationLink(id: string) {
  return (await api.post<ActivationLink>(`/api/admin/verification-requests/${id}/activation-link`, {}, mutation)).data;
}

export async function activateAccount(token: string, password: string) {
  await api.post("/api/auth/activate", { token, password }, mutation);
}

export function verificationError(error: unknown) {
  const response = (error as { response?: { data?: { detail?: unknown }; status?: number } })?.response;
  if (response?.status === 422) return "Please check the required fields and their format.";
  return typeof response?.data?.detail === "string" ? response.data.detail : "The service is unavailable. Please try again.";
}
