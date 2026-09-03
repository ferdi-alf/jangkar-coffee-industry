import { z } from "zod";

const Translation = z.object({
  label: z.string().trim().min(1, "label.required").max(120, "label.tooLong"),
  hours: z.string().trim().max(160, "hours.tooLong").nullable().optional(),
  summary: z.string().trim().max(1000, "summary.tooLong").nullable().optional(),
});

export const OutletInput = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, "slug.invalid").max(80, "slug.tooLong"),
  name: z.string().trim().min(1, "name.required").max(120, "name.tooLong"),
  address: z.string().trim().min(1, "address.required").max(300, "address.tooLong"),
  phone: z.string().trim().max(40).nullable().optional(),
  phoneHref: z.string().trim().max(60).nullable().optional(),
  whatsapp: z.string().trim().max(200).nullable().optional(),
  mapsQuery: z.string().trim().min(1, "mapsQuery.required").max(300),
  lat: z.number().min(-90, "lat.range").max(90, "lat.range").nullable().optional(),
  lng: z.number().min(-180, "lng.range").max(180, "lng.range").nullable().optional(),
  /* Default TRUE, dan itu disengaja. Koordinat baru harus dianggap perkiraan
     sampai ada yang menyatakan sebaliknya, bukan sebaliknya. Salah arah lebih
     mahal daripada satu centang tambahan. */
  coordsApproximate: z.boolean().optional(),
  isHeadquarters: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  translations: z.object({ id: Translation, en: Translation }),
});
export type OutletInput = z.infer<typeof OutletInput>;

export const OutletPatch = OutletInput.partial();
export type OutletPatch = z.infer<typeof OutletPatch>;
