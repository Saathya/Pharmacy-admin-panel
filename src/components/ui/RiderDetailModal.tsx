"use client";

import React, { useEffect, useState } from 'react';
import { API_BASE_URL, getAuthToken } from '@/utils/env';
import { RiderDetail } from '@/app/riders/types';

interface RiderDetailModalProps {
  isOpen: boolean;
  riderId: string | null;
  onClose: () => void;
}

export default function RiderDetailModal({ isOpen, riderId, onClose }: RiderDetailModalProps) {
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<RiderDetail | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!isOpen || !riderId) return;
      setIsFetching(true);
      setError(null);
      try {
        const token = getAuthToken();
        if (!token) throw new Error('Authentication token not found');
        const res = await fetch(`${API_BASE_URL}/api/admin/riders/${riderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();
        if (data.success) {
          const rd: RiderDetail = data.data?.rider || data.data;
          setDetail(rd);
        } else {
          throw new Error(data.message || 'Failed to fetch rider details');
        }
      } catch (err: any) {
        console.error('Failed to fetch rider details', err);
        setError(err.message || 'An error occurred');
      } finally {
        setIsFetching(false);
      }
    };
    fetchDetail();
  }, [isOpen, riderId]);

  if (!isOpen) return null;

  const openInNewTab = (url?: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderUrlList = (title: string, urls?: string[]) => (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-2">{title}</h4>
      {urls && urls.length ? (
        <div className="flex flex-wrap gap-2">
          {urls.map((u, idx) => (
            <button
              key={`${title}-${idx}`}
              onClick={() => openInNewTab(u)}
              className="text-primary-600 hover:text-primary-800 underline text-sm cursor-pointer"
            >
              {title} {idx + 1}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No {title.toLowerCase()} uploaded</p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-6xl rounded-lg shadow-xl p-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Rider Details</h3>
          <button onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-gray-700 cursor-pointer">✕</button>
        </div>

        <div className="px-6 py-4">
          {isFetching ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : detail ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[80vh] overflow-y-auto">
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Overview</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><span className="text-gray-500">ID:</span> {detail.rider_id}</p>
                    <p><span className="text-gray-500">Name:</span> {detail.full_name}</p>
                    <p><span className="text-gray-500">Email:</span> {detail.email}</p>
                    <p><span className="text-gray-500">Phone:</span> {detail.phone_number}</p>
                    <p><span className="text-gray-500">Status:</span> {detail.status}</p>
                    {typeof detail.working_status !== 'undefined' && (
                      <p><span className="text-gray-500">Working Status:</span> {detail.working_status}</p>
                    )}
                    {typeof detail.rating !== 'undefined' && (
                      <p><span className="text-gray-500">Rating:</span> {Number(detail.rating)?.toFixed(2)}</p>
                    )}
                    {detail.vehicle_type && (
                      <p><span className="text-gray-500">Vehicle:</span> {detail.vehicle_type}</p>
                    )}
                    {detail.license_number && (
                      <p><span className="text-gray-500">License No:</span> {detail.license_number}</p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Profile Photo</h4>
                  {detail.profile_photo_url ? (
                    <div className="space-y-2">
                      <img
                        src={detail.profile_photo_url}
                        alt="Profile photo"
                        className="h-40 w-40 object-cover rounded-md border"
                      />
                      <button
                        onClick={() => openInNewTab(detail.profile_photo_url)}
                        className="text-primary-600 hover:text-primary-800 underline text-sm cursor-pointer"
                      >
                        Open image in new tab
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No profile photo uploaded</p>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                {renderUrlList('Government ID', detail.government_id_urls)}
                {renderUrlList('Driving License', detail.driving_license_urls)}
                {renderUrlList('Vehicle Photo', detail.vehicle_photo_urls)}
                {renderUrlList('Passport Photo', detail.passport_photo_urls)}

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Full Body Photo</h4>
                  {detail.full_body_photo_url ? (
                    <button
                      onClick={() => openInNewTab(detail.full_body_photo_url)}
                      className="text-primary-600 hover:text-primary-800 underline text-sm cursor-pointer"
                    >
                      Open full body photo
                    </button>
                  ) : (
                    <p className="text-sm text-gray-500">No full body photo uploaded</p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Selfie With ID</h4>
                  {detail.selfie_with_id_url ? (
                    <button
                      onClick={() => openInNewTab(detail.selfie_with_id_url)}
                      className="text-primary-600 hover:text-primary-800 underline text-sm cursor-pointer"
                    >
                      Open selfie with ID
                    </button>
                  ) : (
                    <p className="text-sm text-gray-500">No selfie with ID uploaded</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No details available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
