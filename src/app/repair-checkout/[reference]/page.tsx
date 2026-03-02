'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface RepairRequest {
  id: string;
  reference_number: string;
  customer_phone: string;
  customer_location: string | null;
  system_type: string;
  glass_type: string;
  frame_finish: string | null;
  hardware_damage: string | null;
  expert_advice: string | null;
  safety_upgrade_required: boolean;
  safety_note: string | null;
  distance_km: number;
  duration: string | null;
  calculated_call_out_fee: number;
  materials_fitting: number;
  total_price: number;
  status: string;
  created_at: string;
}

export default function RepairCheckoutPage() {
  const params = useParams();
  const reference = params.reference as string;
  
  const [repairData, setRepairData] = useState<RepairRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    async function fetchRepairData() {
      try {
        const response = await fetch(`/api/repair-request?reference=${reference}`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch repair request');
        }
        
        setRepairData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (reference) {
      fetchRepairData();
    }
  }, [reference]);

  async function handlePayFastPayment() {
    setPaymentLoading(true);
    try {
      // Create PayFast payment session
      const response = await fetch('/api/payfast-initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference_number: reference,
          amount: repairData?.calculated_call_out_fee,
          item_name: `Call-out Fee - Repair ${reference}`,
          return_url: `${window.location.origin}/repair-checkout/${reference}/success`,
          cancel_url: `${window.location.origin}/repair-checkout/${reference}`,
        }),
      });

      const result = await response.json();
      
      if (result.checkout_url) {
        // Redirect to PayFast
        window.location.href = result.checkout_url;
      } else {
        throw new Error('Failed to create payment session');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment initiation failed');
      setPaymentLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !repairData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600">{error || 'Repair request not found'}</p>
        </div>
      </div>
    );
  }

  const isPaid = repairData.status === 'paid' || repairData.status === 'completed';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Glass Repair Quote</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isPaid 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isPaid ? 'Paid' : 'Pending Payment'}
            </span>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>Reference: <span className="font-mono font-medium">{repairData.reference_number}</span></p>
            <p>Date: {new Date(repairData.created_at).toLocaleDateString('en-ZA')}</p>
          </div>
        </div>

        {/* Glass Analysis Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">🔍</span> Analysis Summary
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Type</span>
              <span className="font-medium capitalize">{repairData.system_type}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Glass Type</span>
              <span className="font-medium">{repairData.glass_type}</span>
            </div>
            
            {repairData.frame_finish && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Frame Finish</span>
                <span className="font-medium">{repairData.frame_finish}</span>
              </div>
            )}
            
            {repairData.distance_km && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Distance</span>
                <span className="font-medium">{repairData.distance_km} km</span>
              </div>
            )}
          </div>

          {repairData.expert_advice && (
            <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <h3 className="text-sm font-semibold text-blue-800 mb-1">💡 Expert Assessment</h3>
              <p className="text-sm text-blue-700">{repairData.expert_advice}</p>
            </div>
          )}

          {repairData.safety_note && (
            <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="text-sm text-yellow-800">{repairData.safety_note}</p>
            </div>
          )}
        </div>

        {/* Cost Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📋</span> Cost Breakdown
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Materials & Installation</span>
              <span className="font-medium">R{repairData.materials_fitting.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Travel & Call-out ({repairData.distance_km}km)</span>
              <span className="font-medium">R{repairData.calculated_call_out_fee.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between py-3 border-t-2 border-gray-200 mt-2">
              <span className="text-lg font-semibold text-gray-800">Total Estimated Cost</span>
              <span className="text-lg font-bold text-blue-600">R{repairData.total_price.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500 italic">
            This is a rough estimate based on the photo. An official, final quote will be provided on-site by our expert staff.
          </div>
        </div>

        {/* Payment Section */}
        {!isPaid && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">💳</span> Secure Payment
            </h2>
            
            <p className="text-gray-600 mb-6">
              Pay the call-out fee of <strong>R{repairData.calculated_call_out_fee.toFixed(2)}</strong> to schedule your repair. 
              This covers our technician's travel to your location for the official assessment.
            </p>

            <div className="space-y-3">
              <button
                onClick={handlePayFastPayment}
                disabled={paymentLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {paymentLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Pay with PayFast
                    <span className="ml-2">→</span>
                  </>
                )}
              </button>

              <div className="text-center text-sm text-gray-500">
                Secure payment processed by PayFast
              </div>
            </div>
          </div>
        )}

        {isPaid && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">✅</div>
            <h2 className="text-lg font-semibold text-green-800 mb-2">Payment Received!</h2>
            <p className="text-green-700">
              Thank you for your payment. Our team has been notified and will contact you shortly to schedule the repair.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>OWD Glass | Professional Glazing Services</p>
          <p className="mt-1">Questions? Contact us at info@owdglass.co.za</p>
        </div>
      </div>
    </div>
  );
}
