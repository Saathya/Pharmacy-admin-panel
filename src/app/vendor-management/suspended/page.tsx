"use client";

import React, { useState, useEffect } from 'react';
import { 
  PencilIcon, 
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Vendor } from '../types';
import VendorDetailModal from '@/components/ui/VendorDetailModal';

const BASE_URL = 'https://api.oraglan.com';

// Sample vendor data for suspended vendors (fallback)
const initialVendors: Vendor[] = [
  { 
    vendor_id: '3',
    full_name: 'Mike Seller',
    email: 'mike@seller.com',
    phone_number: '+1 (555) 345-6789',
    created_at: '2023-03-10',
    business_name: 'Electronics Hub',
    business_email: 'sales@electronicshub.com',
    business_phone: '+1 (555) 765-4321',
    address: '789 Circuit Lane, Tech Park, TP 34567',
    total_products: 75,
    status: 'rejected',
    is_blocked: true
  },
  { 
    vendor_id: '6',
    full_name: 'Robert Vendor',
    email: 'robert@vendor.com',
    phone_number: '+1 (555) 678-9012',
    created_at: '2023-06-15',
    business_name: 'Gadget World',
    business_email: 'info@gadgetworld.com',
    business_phone: '+1 (555) 321-0987',
    address: '890 Gadget Blvd, Tech Town, TT 12345',
    total_products: 60,
    status: 'rejected',
    is_blocked: true
  }
];

export default function SuspendedVendors() {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  useEffect(() => {
    fetchSuspendedVendors();
  }, []);

  const fetchSuspendedVendors = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await fetch(`${BASE_URL}/api/vendor/all?status=rejected`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch suspended vendors');
      }
      
      const data = await response.json();
      const suspendedVendors = (data.data || data).filter((vendor: Vendor) => 
        vendor.status === 'rejected' || vendor.is_blocked
      );
      setVendors(suspendedVendors);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching suspended vendors:', err);
      // Keep using initial vendors as fallback
    } finally {
      setIsLoading(false);
    }
  };

  // Format date to a more readable format
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading && vendors.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Suspended Vendors</h1>
          <p className="mt-2 text-sm text-gray-500">A list of all suspended vendors in your system.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Vendors Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-visible shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">ID</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Vendor Info</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Business Info</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Address</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Total Products</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {vendors.map((vendor) => (
                    <tr
                      key={vendor.vendor_id}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('.action-cell')) return;
                        setSelectedVendorId(vendor.vendor_id);
                        setIsDetailOpen(true);
                      }}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {vendor.vendor_id}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900 truncate max-w-[200px]">{vendor.full_name}</div>
                          <div className="truncate max-w-[200px]">{vendor.email}</div>
                          <div className="truncate max-w-[200px]">{vendor.phone_number}</div>
                          <div className="text-gray-400 truncate max-w-[200px]">
                            Joined {formatDate(vendor.created_at)}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900 truncate max-w-[200px]">{vendor.business_name}</div>
                          <div className="truncate max-w-[200px]">{vendor.business_email}</div>
                          <div className="truncate max-w-[200px]">{vendor.business_phone}</div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <div className="max-w-[200px] truncate">{vendor.address}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {vendor.total_products}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 action-cell">
                        <div className="flex items-center space-x-4">
                          {/* Status Badge */}
                          <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-sm font-medium ${
                            vendor.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {vendor.status === 'rejected' ? 'Rejected' : 'Suspended'}
                          </span>

                          {/* View/Update Link */}
                          <Link
                            href={`/vendor-management/${vendor.vendor_id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <PencilIcon className="h-5 w-5" aria-hidden="true" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <VendorDetailModal
        isOpen={isDetailOpen}
        vendorId={selectedVendorId}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}
