"use client";

import React, { useEffect, useState } from 'react';
import { API_BASE_URL, getAuthToken } from '@/utils/env';
import { VendorDetail } from '@/app/vendor-management/types';
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface VendorDetailModalProps {
  isOpen: boolean;
  vendorId: string | null;
  onClose: () => void;
}

export default function VendorDetailModal({ isOpen, vendorId, onClose }: VendorDetailModalProps) {
  const [detail, setDetail] = useState<VendorDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!isOpen || !vendorId) return;
      setIsLoading(true);
      setError(null);
      setDetail(null);
      try {
        const token = getAuthToken();
        if (!token) throw new Error('Authentication token not found');
        const res = await fetch(`${API_BASE_URL}/api/admin/vendors/${vendorId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();
        if (!res.ok || data.success === false) {
          throw new Error(data.message || 'Failed to fetch vendor details');
        }
        const vendor: VendorDetail = data.data?.vendor || data.vendor || data.data || null;
        setDetail(vendor);
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching vendor details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [isOpen, vendorId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-[92dvw] max-w-5xl max-h-[85dvh] overflow-y-auto rounded-xl shadow-2xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">Vendor Details</h3>
            {detail?.full_name && (
              <p className="mt-1 text-sm text-gray-500">{detail.full_name} • {detail.vendor_id}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {!isLoading && !error && detail && (
            <div className="space-y-8 max-h-[80vh] overflow-y-auto">
              {/* Overview */}
              <section>
                <h4 className="text-lg font-semibold text-gray-900">Overview</h4>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="rounded-lg border bg-white p-4">
                    <div className="text-gray-500 text-sm">Email</div>
                    <div className="text-gray-900">{detail.email}</div>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <div className="text-gray-500 text-sm">Phone</div>
                    <div className="text-gray-900">{detail.phone_number}</div>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <div className="text-gray-500 text-sm">Approval Status</div>
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                      {detail.approval_status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <div className="text-gray-500 text-sm">Online Status</div>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${detail.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      <span className="text-gray-900">{detail.is_online ? 'Online' : 'Offline'}</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Business Info */}
              <section>
                <h4 className="text-lg font-semibold text-gray-900">Business Info</h4>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="rounded-lg border bg-white p-4">
                    <div className="text-gray-500 text-sm">Business Name</div>
                    <div className="text-gray-900">{detail.business_name}</div>
                  </div>
                  <div className="rounded-lg border bg-white p-4 sm:col-span-2 lg:col-span-3">
                    <div className="text-gray-500 text-sm">Address</div>
                    <div className="text-gray-900">{detail.address}</div>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <div className="text-gray-500 text-sm">City</div>
                    <div className="text-gray-900">{detail.city}</div>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <div className="text-gray-500 text-sm">State</div>
                    <div className="text-gray-900">{detail.state}</div>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <div className="text-gray-500 text-sm">Country</div>
                    <div className="text-gray-900">{detail.country}</div>
                  </div>
                </div>
              </section>

              {/* Payment Details */}
              <section>
                <h4 className="text-lg font-semibold text-gray-900">Payment Details</h4>
                {detail.payment_details ? (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="rounded-lg border bg-white p-4">
                      <div className="text-gray-500 text-sm">Account Type</div>
                      <div className="text-gray-900">{detail.payment_details.account_type}</div>
                    </div>
                    <div className="rounded-lg border bg-white p-4">
                      <div className="text-gray-500 text-sm">Bank Name</div>
                      <div className="text-gray-900">{detail.payment_details.bank_name}</div>
                    </div>
                    <div className="rounded-lg border bg-white p-4">
                      <div className="text-gray-500 text-sm">Account Number</div>
                      <div className="text-gray-900">{detail.payment_details.account_number}</div>
                    </div>
                    <div className="rounded-lg border bg-white p-4">
                      <div className="text-gray-500 text-sm">Account Holder</div>
                      <div className="text-gray-900">{detail.payment_details.account_holder_name}</div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-500">No payment details available.</p>
                )}
              </section>

              {/* Documents */}
              <section>
                <h4 className="text-lg font-semibold text-gray-900">Documents</h4>
                {detail.documents && detail.documents.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {detail.documents.map((doc) => (
                      <li key={doc.document_id} className="flex items-center justify-between rounded-lg border bg-white p-4">
                        <div className="flex items-center gap-3">
                          <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{doc.document_type}</div>
                            <div className="text-xs text-gray-500">{doc.file_path}</div>
                          </div>
                        </div>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer"
                        >
                          View
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-gray-500">No documents uploaded.</p>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
