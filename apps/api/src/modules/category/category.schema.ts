import { z } from "zod";

const Translation = z.object({
  name: z.string().trim().min(1, "name.required").max(120, "name.tooLong"),
  description: z.string().trim().max(1000, "description.tooLong").nullable().optional(),
});

export const CategoryInput = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, "slug.invalid").max(80, "slug.tooLong"),
  sortOrder: z.number().int().min(0).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  /* Dua bahasa wajib, sama seperti produk. */
  translations: z.object({ id: Translation, en: Translation }),
});
export type CategoryInput = z.infer<typeof CategoryInput>;

export const CategoryPatch = CategoryInput.partial();
export type CategoryPatch = z.infer<typeof CategoryPatch>;
