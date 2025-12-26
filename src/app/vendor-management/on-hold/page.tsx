"use client";

import React, { useState, useEffect } from 'react';
import { PencilIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Vendor } from '../types';
import { API_BASE_URL, getAuthToken } from '@/utils/env';
import VendorDetailModal from '@/components/ui/VendorDetailModal';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import TableSkeleton from '@/components/ui/TableSkeleton';

export default function OnHoldVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Status change controls
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<'approved' | 'pending' | 'on_hold' | 'hold' | 'rejected'>('on_hold');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const statusOptions = [
    { value: 'approved', label: 'Approved' },
    { value: 'pending', label: 'Pending' },
    { value: 'hold', label: 'On Hold' },
    { value: 'rejected', label: 'Rejected' },
  ];

  useEffect(() => {
    fetchVendors();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownOpen !== null) {
        const target = event.target as HTMLElement;
        if (!target.closest('.status-dropdown-container')) {
          setStatusDropdownOpen(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [statusDropdownOpen]);

  const fetchVendors = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication token not found');
      
      const response = await fetch(`${API_BASE_URL}/api/admin/vendors`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        const vendorsArray = data.data?.vendors || data.data || [];
        const allVendors = vendorsArray.map((vendor: any) => ({
          vendor_id: vendor.vendor_id,
          full_name: vendor.full_name || '',
          email: vendor.email || '',
          phone_number: vendor.phone_number || '',
          created_at: vendor.created_at || '',
          business_name: vendor.business_name || '',
          business_email: vendor.business_email || '',
          business_phone: vendor.business_phone || '',
          address: vendor.address || '',
          total_products: vendor.total_products || 0,
          status: vendor.approval_status || vendor.status || 'pending',
          is_blocked: vendor.is_blocked || false
        }));
        
        const onHoldVendors = allVendors.filter((v: Vendor) => v.status === 'on_hold' || v.status === 'hold');
        setVendors(onHoldVendors);
      } else {
        throw new Error(data.message || 'Failed to fetch vendors');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const totalPages = Math.ceil(vendors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVendors = vendors.slice(startIndex, endIndex);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusColorClass = (status: string): string => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'on_hold':
      case 'hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusClick = (vendor: Vendor, status: 'approved' | 'pending' | 'on_hold' | 'hold' | 'rejected'): void => {
    setSelectedVendor(vendor);
    setNewStatus(status);
    setIsStatusModalOpen(true);
  };

  const handleStatusConfirm = async (): Promise<void> => {
    if (selectedVendor) {
      try {
        const token = getAuthToken();
        if (!token) throw new Error('Authentication token not found');
        const response = await fetch(`${API_BASE_URL}/api/admin/vendors/${selectedVendor.vendor_id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ approval_status: newStatus })
        });
        const data = await response.json();
        if (data.success) {
          await fetchVendors();
          setCurrentPage(1);
        } else {
          throw new Error(data.message || 'Failed to update vendor status');
        }
      } catch (err: any) {
        console.error('Error updating vendor status:', err);
        setError(err.message || 'An error occurred');
        alert(err.message || 'An error occurred');
      } finally {
        setIsStatusModalOpen(false);
        setStatusDropdownOpen(null);
        setSelectedVendor(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">On Hold Vendors</h1>
          <p className="mt-2 text-sm text-gray-500">A list of all vendors currently on hold.</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-visible shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">S. No.</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Vendor Info</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Business Info</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Address</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Total Products</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {isLoading ? (
                    <TableSkeleton rows={6} cols={6} />
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-red-500">
                        <div className="flex flex-col items-center">
                          <p className="font-medium">{error}</p>
                          <button onClick={() => fetchVendors()} className="mt-2 text-sm text-primary-600 hover:text-primary-800">
                            Try again
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : vendors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">No on hold vendors found</td>
                    </tr>
                  ) : (
                    paginatedVendors.map((vendor, index) => (
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
                          {startIndex + index + 1}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900 truncate max-w-[200px]">{vendor.full_name}</div>
                            <div className="truncate max-w-[200px]">{vendor.email}</div>
                            <div className="truncate max-w-[200px]">{vendor.phone_number}</div>
                            <div className="text-gray-400 truncate max-w-[200px]">Joined {formatDate(vendor.created_at)}</div>
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
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{vendor.total_products}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 action-cell cursor-default">
                          <div className="flex items-center space-x-4">
                            {/* Status Dropdown */}
                            <div className="relative status-dropdown-container" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setStatusDropdownOpen(statusDropdownOpen === vendor.vendor_id ? null : vendor.vendor_id)}
                                className={`inline-flex items-center rounded-full px-3 py-0.5 text-sm font-medium ${getStatusColorClass(vendor.status)}`}
                              >
                                {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1).replace('_', ' ')}
                                <ChevronDownIcon className="ml-1 h-4 w-4" />
                              </button>
                              {statusDropdownOpen === vendor.vendor_id && (
                                <div className="absolute left-0 top-full z-50 mt-1 w-40 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5" style={{maxHeight: '200px', overflow: 'auto'}}>
                                  <div className="py-1" role="menu">
                                    {statusOptions.map((option) => (
                                      <button
                                        key={option.value}
                                        onClick={() => handleStatusClick(vendor, option.value as any)}
                                        className={`block w-full px-4 py-2 text-left text-sm ${option.value === vendor.status ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                                        role="menuitem"
                                      >
                                        {option.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <Link href={`/vendor-management/${vendor.vendor_id}`} className="text-primary-600 hover:text-primary-900" onClick={(e) => e.stopPropagation()}>
                              <PencilIcon className="h-5 w-5" aria-hidden="true" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Status Change Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isStatusModalOpen}
        title="Confirm Status Change"
        message={
          <p>
            Are you sure you want to change the status of vendor <span className="font-semibold">{selectedVendor?.full_name}</span> to <span className="font-semibold">{newStatus.replace('_', ' ').charAt(0).toUpperCase() + newStatus.replace('_', ' ').slice(1)}</span>?
          </p>
        }
        confirmText="Change Status"
        confirmButtonClass="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
        onConfirm={handleStatusConfirm}
        onCancel={() => setIsStatusModalOpen(false)}
      />

      {/* Vendor Detail Modal */}
      <VendorDetailModal
        isOpen={isDetailOpen}
        vendorId={selectedVendorId}
        onClose={() => setIsDetailOpen(false)}
      />

      {vendors.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(endIndex, vendors.length)}</span> of{' '}
                <span className="font-medium">{vendors.length}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed">
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <button key={page} onClick={() => handlePageChange(page)} className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${page === currentPage ? 'z-10 bg-primary-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}>
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">...</span>;
                  }
                  return null;
                })}
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed">
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


