"use client";

import React, { useEffect, useState } from 'react';
import { API_BASE_URL, getAuthToken } from '@/utils/env';
import { XMarkIcon, DocumentTextIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface ProductImage {
  image_id: string;
  file_path: string;
  file_format: string;
  image_url: string;
}

interface ProductDetail {
  product_id: string;
  product_name?: string;
  name?: string;
  category_name?: string;
  category?: string;
  status?: string;
  price?: number;
  vendor_id?: string;
  images?: ProductImage[];
  inventories?: any[];
  addons?: any[];
}

interface ProductDetailModalProps {
  isOpen: boolean;
  productId: string | null;
  onClose: () => void;
}

export default function ProductDetailModal({ isOpen, productId, onClose }: ProductDetailModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProductDetail | null>(null);

  useEffect(() => {
    if (!isOpen || !productId) return;
    let isMounted = true;
    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        if (!token) throw new Error('Authentication token not found');
        const res = await fetch(`${API_BASE_URL}/api/admin/products/${productId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to fetch product details');
        const product: ProductDetail = data.data?.product || data.data || null;
        if (isMounted) setDetail(product);
      } catch (e: any) {
        if (isMounted) setError(e.message || 'Failed to load product details');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchDetail();
    return () => { isMounted = false; };
  }, [isOpen, productId]);

  if (!isOpen) return null;

  const displayName = detail?.product_name || detail?.name || 'Product';
  const displayCategory = detail?.category_name || detail?.category || '—';

  const openUrl = (url?: string) => {
    if (!url) return;
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (_) {}
  };

  const formatCurrency = (val: any) => `₵${Number(val ?? 0).toFixed(2)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-[92dvw] max-w-6xl max-h-[85dvh] overflow-y-auto rounded-xl shadow-2xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">Product Details</h3>
            {detail && (
              <p className="mt-1 text-sm text-gray-500">{displayName} • {detail.product_id}</p>
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
                    <div className="text-gray-500 text-sm">Name</div>
                    <div className="text-gray-900">{displayName}</div>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <div className="text-gray-500 text-sm">Category</div>
                    <div className="text-gray-900">{displayCategory}</div>
                  </div>
                  {typeof detail.price !== 'undefined' && (
                    <div className="rounded-lg border bg-white p-4">
                      <div className="text-gray-500 text-sm">Price</div>
                      <div className="text-gray-900">₵{Number(detail.price).toFixed(2)}</div>
                    </div>
                  )}
                  {detail.status && (
                    <div className="rounded-lg border bg-white p-4">
                      <div className="text-gray-500 text-sm">Status</div>
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                        {detail.status.replace('_',' ')}
                      </span>
                    </div>
                  )}
                  {detail.vendor_id && (
                    <div className="rounded-lg border bg-white p-4">
                      <div className="text-gray-500 text-sm">Vendor ID</div>
                      <div className="text-gray-900">{detail.vendor_id}</div>
                    </div>
                  )}
                </div>
              </section>

              {/* Images */}
              <section>
                <h4 className="text-lg font-semibold text-gray-900">Images</h4>
                {detail.images && detail.images.length > 0 ? (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {detail.images.map((img) => (
                      <div key={img.image_id} className="rounded-lg border p-2 flex flex-col items-center">
                        <div className="text-xs text-gray-500 mb-2">{img.file_format.toUpperCase()}</div>
                        <img
                          src={img.image_url}
                          alt={displayName}
                          className="h-32 w-full object-cover rounded cursor-pointer"
                          onClick={() => openUrl(img.image_url)}
                        />
                        <button
                          className="mt-2 text-sm text-primary-600 hover:text-primary-800 cursor-pointer inline-flex items-center"
                          onClick={() => openUrl(img.image_url)}
                        >
                          <PhotoIcon className="h-4 w-4 mr-1" /> View full size
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-gray-500">No images available.</p>
                )}
              </section>

              {/* Inventories */}
              <section>
                <h4 className="text-lg font-semibold text-gray-900">Inventories</h4>
                {detail.inventories && detail.inventories.length > 0 ? (
                  <div className="mt-4 overflow-x-auto rounded-lg border bg-white">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flavor/Color</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pack Size</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fixed Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount %</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white text-sm">
                        {detail.inventories.map((inv: any, idx: number) => (
                          <tr key={inv.inventory_id || idx}>
                            <td className="px-4 py-3 text-gray-900">{inv.size ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-900">{inv.flavor_color ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-900">{inv.pack_size ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-900">{formatCurrency(inv.fixed_price)}</td>
                            <td className="px-4 py-3 text-gray-900">{formatCurrency(inv.selling_price)}</td>
                            <td className="px-4 py-3 text-gray-900">{Number(inv.discount_percentage ?? 0).toFixed(2)}%</td>
                            <td className="px-4 py-3 text-gray-900">{inv.stock ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-2 text-gray-500">No inventories available.</p>
                )}
              </section>

              {/* Addons */}
              <section>
                <h4 className="text-lg font-semibold text-gray-900">Addons</h4>
                {detail.addons && detail.addons.length > 0 ? (
                  <div className="mt-4 space-y-4">
                    {detail.addons.map((addon: any, idx: number) => (
                      <div key={addon.addon_id || idx} className="rounded-lg border bg-white">
                        <div className="px-4 py-3 border-b flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium text-gray-900">{addon.addon_title ?? `Addon #${idx + 1}`}</div>
                            {addon.selection_type && (
                              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                {String(addon.selection_type).toLowerCase()}
                              </span>
                            )}
                            {typeof addon.max_choices !== 'undefined' && (
                              <span className="text-xs text-gray-500">Max choices: {addon.max_choices}</span>
                            )}
                          </div>
                        </div>
                        <div className="px-4 py-3">
                          {addon.items && addon.items.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white text-sm">
                                  {addon.items.map((item: any) => (
                                    <tr key={item.item_id}>
                                      <td className="px-4 py-3 text-gray-900">{item.item_name ?? '—'}</td>
                                      <td className="px-4 py-3 text-gray-900">{formatCurrency(item.item_price)}</td>
                                      <td className="px-4 py-3 text-gray-900">{item.item_stock ?? 0}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No items available for this addon.</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-gray-500">No addons available.</p>
                )}
              </section>
            </div>
          )}

          {/* Fallback when no detail */}
          {!isLoading && !error && !detail && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
              Product detail not available.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
