"use client";

import React, { useState, useEffect } from 'react';
import { API_BASE_URL, getAuthToken } from '@/utils/env';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import ProductDetailModal from '@/components/ui/ProductDetailModal';

interface Product {
  product_id: string;
  name: string;
  price: number;
  vendor_id: string;
  category?: string;
  stock_quantity?: number;
  status?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState<boolean>(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Detail modal state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<{ name: string; price: number } | null>(null);
  const [initialEditForm, setInitialEditForm] = useState<{ name: string; price: number } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Delete dialog state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/admin/products`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        const productsArray = data.data?.products || data.data || [];
        setProducts(productsArray);
      } else {
        throw new Error(data.message || 'Failed to fetch products');
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    setIsCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication token not found');

      const response = await fetch(`${API_BASE_URL}/api/products/categories`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        const cats = data.data?.categories || data.data || [];
        const names = cats.map((c: any) => c.category_name).filter(Boolean);
        setCategoryOptions(['All Categories', ...names]);
      } else {
        throw new Error(data.message || 'Failed to fetch categories');
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setCategoriesError(err.message || 'An error occurred');
      setCategoryOptions(['All Categories']);
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = products.slice(startIndex, endIndex);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatus = (stock?: number): string => {
    if (!stock) return 'Active';
    return stock < 20 ? 'Low Stock' : 'Active';
  };

  const openProductDetail = (productId: string) => {
    setSelectedProductId(productId);
    setIsDetailOpen(true);
  };

  const openEditProduct = async (productId: string) => {
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
      const fallback = products.find(p => p.product_id === productId);
      const p = data.success ? (data.data?.product || data.data) : fallback;
      const form = { name: p?.name || fallback?.name || '', price: Number(p?.price ?? fallback?.price ?? 0) };
      setEditingProductId(productId);
      setEditForm(form);
      setInitialEditForm(form);
      setIsEditOpen(true);
    } catch (e) {
      console.error('Failed to fetch product for edit', e);
      const fallback = products.find(p => p.product_id === productId);
      const form = { name: fallback?.name || '', price: Number(fallback?.price ?? 0) };
      setEditingProductId(productId);
      setEditForm(form);
      setInitialEditForm(form);
      setIsEditOpen(true);
    }
  };

  const saveEditProduct = async () => {
    if (!editingProductId || !editForm) return;
    setIsSavingEdit(true);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication token not found');
      const res = await fetch(`${API_BASE_URL}/api/admin/products/${editingProductId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editForm.name,
          price: editForm.price
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to update product');
      setIsEditOpen(false);
      setEditingProductId(null);
      setEditForm(null);
      setInitialEditForm(null);
      // Refresh list
      fetchProducts();
    } catch (e: any) {
      console.error('Product update failed', e);
      alert(e.message || 'Failed to update product');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const openDeleteProduct = (productId: string) => {
    setDeletingProductId(productId);
    setIsDeleteOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!deletingProductId) return;
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication token not found');
      const res = await fetch(`${API_BASE_URL}/api/admin/products/${deletingProductId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to delete product');
      setIsDeleteOpen(false);
      setDeletingProductId(null);
      // Refresh
      fetchProducts();
    } catch (e: any) {
      console.error('Delete product failed', e);
      alert(e.message || 'Failed to delete product');
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#41AFFF] hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Product
          </button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative max-w-xs w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm"
            placeholder="Search products..."
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <select className="rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm">
            {isCategoriesLoading && <option>Loading categories...</option>}
            {!isCategoriesLoading && categoriesError && <option>Error loading categories</option>}
            {!isCategoriesLoading && !categoriesError && categoryOptions.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
          <select className="rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm">
            <option>Sort by: Newest</option>
            <option>Sort by: Price (Low to High)</option>
            <option>Sort by: Price (High to Low)</option>
            <option>Sort by: Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Products table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Product</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Price</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Stock</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <span className="ml-3 text-gray-500">Loading products...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-red-500">
                  <div className="flex flex-col items-center">
                    <p className="font-medium">{error}</p>
                    <button onClick={() => fetchProducts()} className="mt-2 text-sm text-primary-600 hover:text-primary-800">
                      Try again
                    </button>
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">No products found</td>
              </tr>
            ) : (
              paginatedProducts.map((product) => {
                const status = getStatus(product.stock_quantity);
                return (
                  <tr
                    key={product.product_id}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('.action-cell')) return;
                      openProductDetail(product.product_id);
                    }}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{product.name}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.category || 'N/A'}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">₵{product.price?.toFixed(2) || '0.00'}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.stock_quantity || 0}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {status}
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 action-cell">
                      <button
                        type="button"
                        className="text-primary-600 hover:text-primary-900 mr-4"
                        onClick={(e) => { e.stopPropagation(); openEditProduct(product.product_id); }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-900"
                        onClick={(e) => { e.stopPropagation(); openDeleteProduct(product.product_id); }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {products.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(endIndex, products.length)}</span> of{' '}
                <span className="font-medium">{products.length}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          page === currentPage
                            ? 'z-10 bg-primary-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
      {/* Product Detail Modal */}
      <ProductDetailModal
        isOpen={isDetailOpen}
        productId={selectedProductId}
        onClose={() => setIsDetailOpen(false)}
      />

      {/* Edit Product Modal */}
      {isEditOpen && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm" onClick={() => setIsEditOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Edit Product</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...(editForm as any), name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...(editForm as any), price: Number(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setIsEditOpen(false)} className="px-4 py-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200">Cancel</button>
              <button
                onClick={saveEditProduct}
                disabled={isSavingEdit || JSON.stringify(editForm) === JSON.stringify(initialEditForm)}
                className={`px-4 py-2 rounded-md text-white ${isSavingEdit || JSON.stringify(editForm) === JSON.stringify(initialEditForm) ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
              >
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={isDeleteOpen}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={confirmDeleteProduct}
      />

    </div>
  );
}
