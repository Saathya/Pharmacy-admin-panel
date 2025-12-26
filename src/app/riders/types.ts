export interface Rider {
  rider_id: string;
  full_name: string;
  phone_number: string;
  email: string;
  vehicle_type: string;
  license_number: string;
  rating: number;
  status: 'available' | 'on_delivery' | 'offline' | 'approved' | 'pending' | 'on_hold' | 'rejected';
  is_blocked: boolean;
  created_at: string;
  total_deliveries: number;
}

export interface RiderFormData {
  full_name: string;
  phone_number: string;
  email: string;
  vehicle_type: string;
  license_number: string;
  status: 'available' | 'on_delivery' | 'offline' | 'approved' | 'pending' | 'on_hold' | 'rejected';
  is_blocked: boolean;
}

// Detailed rider type for the Rider Detail Modal
export interface RiderDetail {
  rider_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  status: 'approved' | 'pending' | 'on_hold' | 'rejected' | 'available' | 'on_delivery' | 'offline';
  working_status?: 'available' | 'on_delivery' | 'offline' | string;
  rating?: number;
  vehicle_type?: string;
  license_number?: string;
  // Media URLs
  profile_photo_url?: string;
  government_id_urls?: string[];
  driving_license_urls?: string[];
  vehicle_photo_urls?: string[];
  passport_photo_urls?: string[];
  full_body_photo_url?: string;
  selfie_with_id_url?: string;
}
