'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { API_BASE_URL, setAuthToken } from '@/utils/env';

export default function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Invalid email or password');
      }

      const token = data?.data?.token;
      if (token) {
        setAuthToken(token);
        localStorage.setItem('adminAuth', JSON.stringify({ isAuthenticated: true }));
      }

      await router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-white overflow-hidden lg:grid lg:grid-cols-[0.35fr_0.65fr]">
      {/* Left Side - Image Container */}
      <div className="hidden lg:block relative h-full">
        <div className="absolute inset-0 p-5">
          <div className="h-full w-full rounded-3xl overflow-hidden shadow-lg bg-white">
            <img
              src="https://images.unsplash.com/photo-1659019721449-f2e2b10f49b9?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0"
              alt="Medical"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Right Side - Login Form (centered and compact to avoid overflow) */}
      <div className="flex h-full items-center justify-center px-8">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 leading-tight">
              Welcome to
              <br className="hidden lg:block" />
              <span className="font-pacifico text-[#41AFFF]">Oraglan</span> <span className="text-[#41AFFF]">Admin Panel</span>
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 rounded-xl border border-black focus:border-black focus:ring-2 focus:ring-[#41AFFF]/20 outline-none transition-all duration-200 bg-white"
                  placeholder="admin@oraglan.com"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 rounded-xl border border-black focus:border-black focus:ring-2 focus:ring-[#41AFFF]/20 outline-none transition-all duration-200 bg-white pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 bg-[#41AFFF] hover:bg-[#3192db] text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#41AFFF]/30 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed ${isLoading ? 'animate-pulse' : ''}`}
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Logging in...</span>
                </div>
              ) : (
                'Login'
              )}
            </button>

            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
