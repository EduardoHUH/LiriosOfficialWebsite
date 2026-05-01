export interface Technique {
  id: number;
  name: string;
  description: string;
  base_price: number;
}

export interface LengthOption {
  id: number;
  name: string;
  extra_price: number;
}

export interface ServiceExtra {
  id: number;
  name: string;
  type: string;
  price: number;
}

export interface Decoration {
  id: number;
  name: string;
  price: number;
}

export interface ClientPayload {
  name: string;
  phone: string;
  email: string;
}

export interface ClientResponse {
  id: number;
  message: string;
}

export interface QuoteItemPayload {
  technique_id: number | null;
  length_id: number | null;
  technique_name: string;
  length_name: string;
  base_price: number;
  quantity: number;
  price: number;
}

export interface QuoteExtraPayload {
  extra_id: number | null;
  extra_name: string;
  quantity: number;
  price: number;
}

export interface QuoteDecorationPayload {
  decoration_id: number | null;
  decoration_name: string;
  quantity: number;
  price: number;
}

export interface QuoteCreatePayload {
  client_id: number | null;
  appointment_date: string | null;
  notes: string;
  source: 'web' | 'admin';
  contact_phone: string;
  reference_image_path?: string | null;
  items: QuoteItemPayload[];
  extras: QuoteExtraPayload[];
  decorations: QuoteDecorationPayload[];
}

export interface QuoteCreateResponse {
  message: string;
  quote_id: number;
  total: number;
}

export interface QuoteSummary {
  id: number;
  client_id: number | null;
  appointment_date: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  total: number;
  notes: string | null;
  source: 'web' | 'admin';
  contact_phone: string | null;
  reference_image_path?: string | null;
  created_at: string;
  name?: string;
  phone?: string;
  email?: string;
}

export interface QuoteItem {
  id: number;
  quote_id: number;
  technique_id: number | null;
  length_id: number | null;
  technique_name: string | null;
  length_name: string | null;
  technique_label?: string | null;
  length_label?: string | null;
  base_price: number;
  quantity: number;
  price: number;
}

export interface QuoteExtra {
  id: number;
  quote_id: number;
  extra_id: number | null;
  extra_name: string | null;
  extra_label?: string | null;
  quantity: number;
  price: number;
}

export interface QuoteDecoration {
  id: number;
  quote_id: number;
  decoration_id: number | null;
  decoration_name: string | null;
  decoration_label?: string | null;
  quantity: number;
  price: number;
}

export interface QuoteDetailResponse {
  quote: QuoteSummary;
  items: QuoteItem[];
  extras: QuoteExtra[];
  decorations: QuoteDecoration[];
}

export interface ReferenceImageUploadResponse {
  message: string;
  imagePath: string;
  imageUrl: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: AuthUser;
}
