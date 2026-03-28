'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface RepairRequest {
  reference_number: string;
  customer_phone: string;
  status: string;
  calculated_call_out_fee: number;
  paid_at: string | null;
}

export default function RepairCheckoutSuccessPage() {
  const params = useParams();
  const reference = params.reference as string;
  
  const [repairData, setRepairData] = useState<RepairRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRepairData() {
      try {
        const response = await fetch(`/api/repair-request?reference=${reference}`);
        const result = await response.json();
        
        if (response.ok) {
          setRepairData(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch repair data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (reference) {
      fetchRepairData();
    }
  }, [reference]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Card */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your payment. Your repair request has been confirmed.
          </p>

          {repairData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Reference:</span>
                  <p className="font-mono font-medium">{repairData.reference_number}</p>
                </div>
                <div>
                  <span className="text-gray-500">Amount Paid:</span>
                  <p className="font-medium">R{repairData.calculated_call_out_fee?.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <p className="text-green-600 font-medium capitalize">{repairData.status}</p>
                </div>
                <div>
                  <span className="text-gray-500">Paid At:</span>
                  <p className="font-medium">
                    {repairData.paid_at 
                      ? new Date(repairData.paid_at).toLocaleString('en-ZA')
                      : 'Just now'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-6 text-left">
            <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
            <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
              <li>Our team has been notified of your booking</li>
              <li>We&apos;ll contact you within 2 hours to schedule the site visit</li>
              <li>Our technician will arrive to assess and provide an official quote</li>
              <li>We&apos;ll complete the repair with SANS-approved safety glass</li>
            </ol>
          </div>

          <div className="space-y-3">
            <Link 
              href={`/repair-checkout/${reference}`}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              View Booking Details
            </Link>
            
            <a 
              href="https://wa.me/27123456789"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Need assistance? Contact us:</p>
          <p className="mt-1">
            <a href="mailto:info@owdglass.co.za" className="text-blue-600 hover:underline">info@owdglass.co.za</a>
            {' | '}
            <a href="tel:+27123456789" className="text-blue-600 hover:underline">+27 12 345 6789</a>
          </p>
        </div>
      </div>
    </div>
  );
}
