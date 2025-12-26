"use client";
import React, { useState, useEffect } from 'react';
import TableSkeleton from '@/components/ui/TableSkeleton';
import RiderDetailModal from '@/components/ui/RiderDetailModal';
import { Rider, RiderFormData } from './types';
import { API_BASE_URL, getAuthToken } from '@/utils/env';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function RidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [filteredRiders, setFilteredRiders] = useState<Rider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'approved' | 'pending' | 'on_hold' | 'rejected'>('all');
  const [sortBy, setSortBy] = useState('name');
  
  // Status change controls
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<'approved' | 'pending' | 'on_hold' | 'rejected'>('approved');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const statusOptions = [
    { value: 'approved', label: 'Approved' },
    { value: 'pending', label: 'Pending' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'rejected', label: 'Rejected' }
  ];

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  // Detail modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<RiderFormData>({
    full_name: '',
    phone_number: '',
    email: '',
    vehicle_type: '',
    license_number: '',
    status: 'approved',
    is_blocked: false
  });
  const [initialFormData, setInitialFormData] = useState<RiderFormData | null>(null);

  useEffect(() => {
    fetchRiders();
  }, []);

  useEffect(() => {
    filterAndSortRiders();
  }, [riders, searchTerm, activeTab, sortBy]);

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

  const fetchRiders = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/riders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch riders');
      }
      
      const data = await response.json();
      
      if (data.success) {
        const ridersArray = data.data?.riders || data.data || [];
        const normalized = ridersArray.map((r: any) => ({
          rider_id: r.rider_id,
          full_name: r.full_name || '',
          phone_number: String(r.phone_number ?? ''),
          email: r.email || '',
          vehicle_type: r.vehicle_type || '',
          license_number: r.license_number || '',
          rating: typeof r.rating === 'number' ? r.rating : (parseFloat(r.rating) || 0),
          status: r.status || 'offline',
          is_blocked: Boolean(r.is_blocked),
          created_at: r.created_at || '',
          total_deliveries: Number(r.total_deliveries ?? 0),
        }));
        setRiders(normalized);
      } else {
        throw new Error(data.message || 'Failed to fetch riders');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching riders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortRiders = () => {
    const searchLower = searchTerm.toLowerCase();
    let filtered = riders.filter(rider => {
      const matchesSearch = (rider.full_name || '').toLowerCase().includes(searchLower) ||
                           String(rider.phone_number || '').includes(searchTerm) ||
                           (rider.email || '').toLowerCase().includes(searchLower);
      
      let matchesStatus = true;
      if (activeTab === 'approved') matchesStatus = rider.status === 'approved';
      else if (activeTab === 'pending') matchesStatus = rider.status === 'pending';
      else if (activeTab === 'on_hold') matchesStatus = rider.status === 'on_hold';
      else if (activeTab === 'rejected') matchesStatus = rider.status === 'rejected';
      
      return matchesSearch && matchesStatus;
    });

    // Sort riders
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.full_name.localeCompare(b.full_name);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'experience':
          return (b.total_deliveries || 0) - (a.total_deliveries || 0);
        default:
          return 0;
      }
    });

    setFilteredRiders(filtered);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getStatusColorClass = (status: string): string => {
    switch (status) {
      case 'approved':
      case 'available': // map legacy/operational to green
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'on_hold':
      case 'on_delivery':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
      case 'offline':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusClick = (rider: Rider, status: 'approved' | 'pending' | 'on_hold' | 'rejected'): void => {
    setSelectedRider(rider);
    setNewStatus(status);
    setIsStatusModalOpen(true);
  };

  const handleStatusConfirm = async (): Promise<void> => {
    if (selectedRider) {
      try {
        const token = getAuthToken();
        if (!token) throw new Error('Authentication token not found');
        const response = await fetch(`${API_BASE_URL}/api/admin/riders/${selectedRider.rider_id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus })
        });
        const data = await response.json();
        if (data.success) {
          await fetchRiders();
          setSuccessMessage('Status updated successfully');
        } else {
          throw new Error(data.message || 'Failed to update rider status');
        }
      } catch (err: any) {
        console.error('Error updating rider status:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setIsStatusModalOpen(false);
        setStatusDropdownOpen(null);
        setSelectedRider(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const url = isEditing ? `${API_BASE_URL}/api/admin/riders/${selectedRider?.rider_id}` : `${API_BASE_URL}/api/rider/create`;
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} rider`);
      }
      
      await fetchRiders();
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (rider: Rider) => {
    setSelectedRider(rider);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/riders/${rider.rider_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        const rd = data.data?.rider || data.data || rider;
        const filled: RiderFormData = {
          full_name: rd.full_name || '',
          phone_number: String(rd.phone || rd.phone_number || ''),
          email: rd.email || '',
          vehicle_type: rd.vehicle_type || '',
          license_number: rd.license_number || '',
          status: rd.status || rider.status || 'available',
          is_blocked: Boolean(rd.is_blocked)
        };
        setFormData(filled);
        setInitialFormData(filled);
        setIsEditing(true);
        setShowModal(true);
        return;
      }
    } catch (e) {
      console.error('Failed to fetch rider details', e);
    }
    // Fallback to existing rider data
    const fallback: RiderFormData = {
      full_name: rider.full_name,
      phone_number: rider.phone_number,
      email: rider.email,
      vehicle_type: rider.vehicle_type,
      license_number: rider.license_number,
      status: rider.status,
      is_blocked: rider.is_blocked
    };
    setFormData(fallback);
    setInitialFormData(fallback);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteClick = (rider: Rider) => {
    setSelectedRider(rider);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedRider) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/rider/${selectedRider.rider_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete rider');
      }
      
      await fetchRiders();
      setShowDeleteDialog(false);
      setSelectedRider(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockClick = (rider: Rider) => {
    setSelectedRider(rider);
    setShowBlockDialog(true);
  };

  const handleBlock = async () => {
    if (!selectedRider) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/rider/${selectedRider.rider_id}/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          is_blocked: !selectedRider.is_blocked
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${selectedRider.is_blocked ? 'unblock' : 'block'} rider`);
      }
      
      await fetchRiders();
      setShowBlockDialog(false);
      setSelectedRider(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone_number: '',
      email: '',
      vehicle_type: '',
      license_number: '',
      status: 'available',
      is_blocked: false
    });
    setIsEditing(false);
    setSelectedRider(null);
  };

  const handleAddRider = () => {
    resetForm();
    setShowModal(true);
  };

  // Remove early spinner; show skeleton in table instead

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Riders</h1>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={handleAddRider}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#41AFFF] hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Rider
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-start justify-between bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          <p className="text-sm">{successMessage}</p>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="ml-4 text-green-700 hover:text-green-900"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {['all', 'approved', 'pending', 'on_hold', 'rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium capitalize`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </nav>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
        <div className="relative max-w-xs w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm"
            placeholder="Search riders..."
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm"
          >
            <option value="name">Sort by: Name (A-Z)</option>
            <option value="rating">Sort by: Rating (High to Low)</option>
            <option value="experience">Sort by: Experience</option>
          </select>
        </div>
      </div>

      {/* Riders table */}
      <div className="overflow-visible shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg mt-4">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Phone</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Vehicle</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Rating</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              <TableSkeleton rows={6} cols={6} />
            ) : filteredRiders.map((rider) => (
              <tr
                key={rider.rider_id}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('.action-cell')) return;
                  setSelectedRiderId(rider.rider_id);
                  setIsDetailOpen(true);
                }}
                className="cursor-pointer hover:bg-gray-50"
              >
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{rider.full_name}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{rider.phone_number}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{rider.vehicle_type}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{Number.isFinite(rider.rating) ? rider.rating.toFixed(1) : 'N/A'}</td>
                <td className="relative whitespace-nowrap px-3 py-4 text-sm status-dropdown-container">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatusDropdownOpen(statusDropdownOpen === rider.rider_id ? null : rider.rider_id);
                    }}
                    className={`inline-flex items-center rounded-full px-3 py-0.5 text-sm font-medium ${getStatusColorClass(rider.status)}`}
                  >
                    {rider.status.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    <ChevronDownIcon className="ml-1 h-4 w-4" />
                  </button>
                  {statusDropdownOpen === rider.rider_id && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-40 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="py-1" role="menu">
                        {statusOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusClick(rider, option.value as any);
                            }}
                            className={`block w-full px-4 py-2 text-left text-sm ${option.value === rider.status ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                            role="menuitem"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 action-cell">
                  <div className="flex items-center justify-end gap-2">
                    {/* Status change now handled via Status pill dropdown in Status column */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEdit(rider); }} 
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleBlockClick(rider); }} 
                      className={`${rider.is_blocked ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}`}
                    >
                      {rider.is_blocked ? 'Unblock' : 'Block'}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(rider); }} 
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status Change Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isStatusModalOpen}
        title="Confirm Status Change"
        message={
          <p>
            Are you sure you want to change the status of rider <span className="font-semibold">{selectedRider?.full_name}</span> to <span className="font-semibold">{newStatus.replace(/-/g, ' ').replace('_', ' ').charAt(0).toUpperCase() + newStatus.replace(/-/g, ' ').replace('_', ' ').slice(1)}</span>?
          </p>
        }
        confirmText="Change Status"
        confirmButtonClass="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
        onConfirm={handleStatusConfirm}
        onCancel={() => setIsStatusModalOpen(false)}
      />

      {/* Add/Edit Rider Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isEditing ? 'Edit Rider' : 'Add New Rider'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                  <select
                    name="vehicle_type"
                    value={formData.vehicle_type}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Vehicle Type</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="bicycle">Bicycle</option>
                    <option value="car">Car</option>
                    <option value="van">Van</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">License Number</label>
                  <input
                    type="text"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="available">Available</option>
                    <option value="on_delivery">On Delivery</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || (isEditing && initialFormData !== null && JSON.stringify(initialFormData) === JSON.stringify(formData))}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Rider Detail Modal */}
      <RiderDetailModal
        isOpen={isDetailOpen}
        riderId={selectedRiderId}
        onClose={() => setIsDetailOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Delete Rider</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete {selectedRider?.full_name}? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-3 pt-4">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block/Unblock Confirmation Dialog */}
      {showBlockDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedRider?.is_blocked ? 'Unblock' : 'Block'} Rider
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to {selectedRider?.is_blocked ? 'unblock' : 'block'} {selectedRider?.full_name}?
                </p>
              </div>
              <div className="flex justify-center space-x-3 pt-4">
                <button
                  onClick={() => setShowBlockDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBlock}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-md text-white disabled:opacity-50 ${
                    selectedRider?.is_blocked 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isLoading ? 'Processing...' : (selectedRider?.is_blocked ? 'Unblock' : 'Block')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
