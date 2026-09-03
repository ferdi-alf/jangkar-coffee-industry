import type { SupabaseClient } from "@supabase/supabase-js";

import type { StatsOverview } from "./stats.contract.js";
import * as repo from "./stats.repository.js";

export const getOverview = (supabase: SupabaseClient): Promise<StatsOverview> =>
  repo.overview(supabase);
