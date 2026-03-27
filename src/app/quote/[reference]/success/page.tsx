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
  depositAmount: number;
  depositPaid: number;
  status: string;
  depositPaidAt?: string;
}

export default function QuoteSuccessPage() {
  const params = useParams();
  const reference = params.reference as string;
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuote() {
      try {
        const response = await fetch(`/api/quote/${reference}`);
        if (response.ok) {
          const data = await response.json();
          setQuote(data);
        }
      } catch (err) {
        console.error('Failed to fetch quote:', err);
      } finally {
        setLoading(false);
      }
    }

    if (reference) {
      fetchQuote();
    }
  }, [reference]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-900">Quote not found</p>
        </div>
      </div>
    );
  }

  const remainingBalance = quote.total - (quote.depositPaid || quote.depositAmount);

  const downloadInvoice = () => {
    try {
      const origin = window.location.origin;
      const invoiceUrl = `${origin}/quotes/${quote.quoteNumber}-invoice.pdf`;
      window.open(invoiceUrl, '_blank');
    } catch (error) {
      console.error('Error opening invoice:', error);
      alert('Error opening invoice. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your payment. Your deposit has been successfully received.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4 border-b pb-2">Payment Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Quote Reference:</span>
                <p className="font-mono font-medium">{quote.quoteNumber}</p>
              </div>
              <div>
                <span className="text-gray-500">Total Quote Value:</span>
                <p className="font-medium">R{quote.total.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-gray-500">Deposit Received (50%):</span>
                <p className="font-medium text-green-600">R{(quote.depositPaid || quote.depositAmount).toFixed(2)}</p>
              </div>
              <div>
                <span className="text-gray-500">Remaining Balance:</span>
                <p className="font-medium text-blue-600">R{remainingBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-6 text-left">
            <h3 className="font-semibold text-blue-800 mb-2">Important Information</h3>
            <ul className="text-sm text-blue-700 space-y-2 list-disc list-inside">
              <li>Your remaining balance of <strong>R{remainingBalance.toFixed(2)}</strong> is due strictly upon completion of the installation.</li>
              <li>Final payment can be made via EFT or card on-site.</li>
              <li>Our scheduling team will contact you shortly to arrange an installation date.</li>
              <li>An official invoice has been sent to your WhatsApp and email.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button 
              onClick={downloadInvoice}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Download PDF Invoice
            </button>
            
            <Link 
              href={`/quote/${reference}`}
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors text-center border border-gray-300"
            >
              View Original Quote
            </Link>
            
            <a 
              href="https://wa.me/27123456789"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Contact Support on WhatsApp
            </a>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>OWD Glass | Professional Glazing Services</p>
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
