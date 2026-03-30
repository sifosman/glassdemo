'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Quote {
  quoteNumber: string;
  customer: {
    name: string;
    email: string;
    address: string;
    phone?: string;
  };
  total: number;
  depositPaid: number;
  depositAmount: number;
  balancePaid?: number;
  status: string;
}

export default function PayBalancePage() {
  const params = useParams();
  const reference = params.reference as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuote() {
      try {
        const response = await fetch(`/api/quote/${reference}`);
        if (response.ok) {
          const data = await response.json();
          setQuote(data);
        } else {
          setError('Quote not found');
        }
      } catch (err) {
        console.error('Failed to fetch quote:', err);
        setError('Failed to fetch quote');
      } finally {
        setLoading(false);
      }
    }

    if (reference) {
      fetchQuote();
    }
  }, [reference]);

  const handlePayment = async () => {
    if (!quote) return;

    const balanceDue = quote.total - (quote.depositPaid || quote.depositAmount || 0);

    setPaymentLoading(true);
    try {
      const response = await fetch('/api/payfast-initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference_number: quote.quoteNumber,
          amount: balanceDue,
          item_name: `Balance Payment - ${quote.quoteNumber}`,
          return_url: `${window.location.origin}/quote/${quote.quoteNumber}/balance-success`,
          cancel_url: `${window.location.origin}/quote/${quote.quoteNumber}/pay-balance`,
          payment_type: 'balance',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to initiate payment');
      }

      if (result.checkout_url) {
        window.location.href = result.checkout_url;
        return;
      }

      throw new Error('Failed to create payment session');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment initiation failed');
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-900">{error || 'Quote not found'}</p>
          <Link
            href="/"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const depositPaid = quote.depositPaid || quote.depositAmount || 0;
  const balanceDue = quote.total - depositPaid;
  const isFullyPaid = quote.balancePaid && quote.balancePaid >= balanceDue;

  if (isFullyPaid) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Already Paid!</h1>
            <p className="text-gray-600 mb-6">
              The balance for this quote has already been paid in full.
            </p>
            <Link
              href={`/quote/${reference}/success`}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              View Payment Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Pay Balance</h1>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quote Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Quote Number:</span>
                <span className="font-medium">{quote.quoteNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium">{quote.customer.name}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Quote Value:</span>
                  <span className="font-medium">R{quote.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Deposit Paid:</span>
                  <span className="font-medium">-R{depositPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-blue-600 font-semibold border-t border-gray-200 pt-2 mt-2">
                  <span>Balance Due:</span>
                  <span>R{balanceDue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Payment Information</h3>
            <ul className="text-sm text-blue-700 space-y-2 list-disc list-inside">
              <li>This payment covers the remaining balance after your deposit.</li>
              <li>You can pay now or on-site during installation.</li>
              <li>A statement of account will be generated after successful payment.</li>
            </ul>
          </div>

          <button
            onClick={handlePayment}
            disabled={paymentLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {paymentLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                Pay Balance Now
                <span className="text-lg">→</span>
              </>
            )}
          </button>

          <Link
            href={`/quote/${reference}`}
            className="block w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors text-center border border-gray-300"
          >
            Back to Quote
          </Link>
        </div>
      </div>
    </div>
  );
}
