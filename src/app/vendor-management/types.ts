// Define interfaces for vendor management

export interface Vendor {
  vendor_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  created_at: string;
  business_name: string;
  business_email: string;
  business_phone: string;
  address: string;
  total_products: number;
  status: 'approved' | 'pending' | 'on_hold' | 'hold' | 'rejected';
  is_blocked: boolean;
}

export interface StatusOption {
  value: 'approved' | 'pending' | 'on_hold' | 'hold' | 'rejected';
  label: string;
}

// Detailed vendor info used in the vendor detail modal
export interface VendorPaymentDetails {
  account_type: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
}

export interface VendorDocument {
  document_id: string;
  document_type: string;
  file_path: string;
  file_url: string;
}

export interface VendorDetail {
  vendor_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  approval_status: 'approved' | 'pending' | 'on_hold' | 'hold' | 'rejected';
  is_online: boolean;
  business_name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  payment_details?: VendorPaymentDetails;
  documents?: VendorDocument[];
}
