'use client';

import { useState } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/layouts/PublicLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { CheckCircle2, Building2, ArrowLeft } from 'lucide-react';

const COUNTRY_CODES = [
  '+1', '+7', '+20', '+27', '+30', '+31', '+32', '+33', '+34', '+36', '+39', '+40', '+41', '+43', '+44', '+45', '+46', '+47', '+48', '+49',
  '+51', '+52', '+53', '+54', '+55', '+56', '+57', '+58', '+60', '+61', '+62', '+63', '+64', '+65', '+66', '+81', '+82', '+84', '+86', '+90',
  '+91', '+92', '+93', '+94', '+95', '+98', '+211', '+212', '+213', '+216', '+218', '+220', '+221', '+222', '+223', '+224', '+225', '+226',
  '+227', '+228', '+229', '+230', '+231', '+232', '+233', '+234', '+235', '+236', '+237', '+238', '+239', '+240', '+241', '+242', '+243',
  '+244', '+245', '+248', '+249', '+250', '+251', '+252', '+253', '+254', '+255', '+256', '+257', '+258', '+260', '+261', '+262', '+263',
  '+264', '+265', '+266', '+267', '+268', '+269', '+290', '+291', '+297', '+298', '+299', '+350', '+351', '+352', '+353', '+354', '+355',
  '+356', '+357', '+358', '+359', '+370', '+371', '+372', '+373', '+374', '+375', '+376', '+377', '+378', '+380', '+381', '+382', '+383',
  '+385', '+386', '+387', '+389', '+420', '+421', '+423', '+500', '+501', '+502', '+503', '+504', '+505', '+506', '+507', '+508', '+509',
  '+590', '+591', '+592', '+593', '+594', '+595', '+596', '+597', '+598', '+599', '+670', '+672', '+673', '+674', '+675', '+676', '+677',
  '+678', '+679', '+680', '+681', '+682', '+683', '+685', '+686', '+687', '+688', '+689', '+691', '+692', '+850', '+852', '+853', '+855',
  '+856', '+880', '+886', '+960', '+961', '+962', '+963', '+964', '+965', '+966', '+967', '+968', '+970', '+971', '+972', '+973', '+974',
  '+975', '+976', '+977', '+992', '+993', '+994', '+995', '+996', '+998'
];

export default function RequestAccessPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    countryCode: '+92',
    contactNumber: '',
    username: '',
    password: '',
    confirmPassword: '',
    contactPerson: '',
    city: '',
    address: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/schools/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit registration request.');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <PublicLayout>
        <section className="mx-auto max-w-2xl px-6 py-20 text-center animate-fade-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">Request Submitted</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">Registration Request Received</h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-gray-600">
            Your registration request has been submitted successfully. You will be notified via email once your request has been reviewed.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-brand-primary px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark focus-visible:outline-none"
            >
              Go to Sign In
            </Link>
          </div>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-lighter text-brand-primary mb-3">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">School Registration Request</h1>
          <p className="mt-2 text-sm text-gray-600 max-w-xl mx-auto">
            Submit your school details to request a Mathlers organization account. Once reviewed and approved by an admin, you can log in to your school workspace.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-card border border-gray-200/90">
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">
                School Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="School Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Saint Patrick's High School"
                  />
                </div>

                <Input
                  label="School Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="admin@school.edu"
                />

                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleChange}
                      className="w-24 shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-xs transition-all duration-150 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 hover:border-gray-300"
                    >
                      {COUNTRY_CODES.map((code) => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      required
                      placeholder="300 1234567"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-xs placeholder:text-gray-400 transition-all duration-150 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 hover:border-gray-300"
                    />
                  </div>
                </div>

                <Input
                  label="Username (for login)"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="e.g. stpatricks_admin"
                />

                <Input
                  label="Principal / Contact Person"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  required
                  placeholder="Dr. Alexander Wright"
                />

                <Input
                  label="Password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">
                Location Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  placeholder="Karachi"
                />

                <div className="md:col-span-2">
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                    School Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    rows={2}
                    placeholder="Full campus address"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-xs placeholder:text-gray-400 transition-all duration-150 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 hover:border-gray-300"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full py-3.5 text-sm font-semibold"
            >
              Submit Registration Request
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link href="/landing" className="inline-block text-sm font-semibold text-brand-primary hover:underline">
            Back to Mathlers
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
