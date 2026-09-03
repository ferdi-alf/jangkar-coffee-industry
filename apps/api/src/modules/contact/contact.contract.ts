export type ContactStatus = "new" | "read" | "replied" | "spam";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: ContactStatus;
  createdAt: string;
}
