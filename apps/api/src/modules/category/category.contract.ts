export type CategoryStatus = "draft" | "published" | "archived";

export interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  status: CategoryStatus;
  translations?: Record<"id" | "en", { name: string; description: string | null }>;
}
