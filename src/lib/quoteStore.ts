import { Quote } from '@/services/glassQuoteService';

// Simple in-memory storage (in production, use a database like Supabase, MongoDB, etc.)
const quoteStore = new Map<string, Quote>();

export const saveQuote = (quote: Quote): void => {
  quoteStore.set(quote.quoteNumber, quote);
};

export const getQuote = (quoteNumber: string): Quote | null => {
  return quoteStore.get(quoteNumber) || null;
};

export const getAllQuotes = (): Quote[] => {
  return Array.from(quoteStore.values());
};

export const deleteQuote = (quoteNumber: string): boolean => {
  return quoteStore.delete(quoteNumber);
};
