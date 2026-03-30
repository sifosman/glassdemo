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
  pdfUrl?: string;
  invoicePdfUrl?: string;
  statementPdfUrl?: string;
  total: number;
  depositAmount: number;
  depositPaid: number;
  balancePaid?: number;
  status: string;
  balancePaidAt?: string;
}

export default function BalanceSuccessPage() {
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

  const downloadStatement = () => {
    try {
      if (quote?.statementPdfUrl) {
        window.open(quote.statementPdfUrl, '_blank');
        return;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        window.open(
          `${supabaseUrl}/storage/v1/object/public/documents/statements/${quote?.quoteNumber}-statement.pdf`,
          '_blank'
        );
        return;
      }

      alert('Statement is not available yet. Please try again shortly.');
    } catch (error) {
      console.error('Error opening statement:', error);
      alert('Error opening statement. Please try again.');
    }
  };

  const downloadInvoice = () => {
    try {
      if (quote?.invoicePdfUrl) {
        window.open(quote.invoicePdfUrl, '_blank');
        return;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        window.open(
          `${supabaseUrl}/storage/v1/object/public/documents/invoices/${quote?.quoteNumber}-invoice.pdf`,
          '_blank'
        );
        return;
      }

      alert('Invoice is not available yet. Please try again shortly.');
    } catch (error) {
      console.error('Error opening invoice:', error);
      alert('Error opening invoice. Please try again.');
    }
  };

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

  const balancePaid = quote.balancePaid || (quote.total - (quote.depositPaid || quote.depositAmount));
  const totalPaid = (quote.depositPaid || quote.depositAmount) + balancePaid;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Complete!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your final payment. Your account is now fully settled.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4 border-b pb-2">Final Payment Summary</h3>
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
                <span className="text-gray-500">Deposit Paid:</span>
                <p className="font-medium text-blue-600">R{(quote.depositPaid || quote.depositAmount).toFixed(2)}</p>
              </div>
              <div>
                <span className="text-gray-500">Balance Paid:</span>
                <p className="font-medium text-green-600">R{balancePaid.toFixed(2)}</p>
              </div>
              <div className="col-span-2 border-t pt-2 mt-2">
                <span className="text-gray-500">Total Paid:</span>
                <p className="font-bold text-green-600 text-lg">R{totalPaid.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded mb-6 text-left">
            <h3 className="font-semibold text-green-800 mb-2">Account Settled</h3>
            <ul className="text-sm text-green-700 space-y-2 list-disc list-inside">
              <li>Your account is now fully paid and settled.</li>
              <li>A statement of account has been generated for your records.</li>
              <li>Our team will contact you to schedule installation.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={downloadStatement}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Download Statement of Account
            </button>

            <button
              onClick={downloadInvoice}
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors text-center border border-gray-300"
            >
              Download Invoice
            </button>

            <Link
              href={`/quote/${reference}`}
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors text-center border border-gray-300"
            >
              View Quote
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
