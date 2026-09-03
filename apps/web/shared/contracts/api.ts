/**
 * Bentuk amplop API, disalin dari contract di apps/api.
 *
 * SENGAJA DIDEFINISIKAN ULANG, bukan diimpor dari apps/api. Mengimpor tipe
 * lintas workspace berarti apps/web ikut bergantung pada kode server, dan
 * bundler Next akan mengikuti rantai impor itu sampai ke `@supabase/supabase-js`
 * dan kunci rahasianya. Yang dibagi cukup BENTUKNYA, dan bentuk itu kecil.
 */
export interface ResponseMeta {
  requestId: string;
  timestamp: string;
}

export interface ListMeta extends ResponseMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
}

export interface ApiList<T> {
  success: true;
  data: T[];
  meta: ListMeta;
}

export interface ApiFailure {
  success: false;
  error: { code: string; message: string; details: ApiErrorDetail[] };
  meta: ResponseMeta;
}
