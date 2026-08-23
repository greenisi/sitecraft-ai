export type SubmissionStatus = 'new' | 'read' | 'replied' | 'archived';

export interface Submission {
  id: string;
  form_type: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  service_needed: string | null;
  preferred_date: string | null;
  form_data: Record<string, unknown> | null;
  status: SubmissionStatus | string;
  source_page: string | null;
  created_at: string;
}
