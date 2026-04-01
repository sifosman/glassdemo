'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/utils/supabase-browser'

// Define the validation schema
const itemSchema = z.object({
  id: z.string().optional(),
  width_mm: z.number().min(100, 'Width must be at least 100mm'),
  height_mm: z.number().min(100, 'Height must be at least 100mm'),
  type: z.enum(['window', 'door']),
  glassType: z.string().min(1, 'Glass type is required'),
  frameColor: z.string().min(1, 'Frame color is required'),
  thickness: z.number().optional()
})

const quoteSchema = z.object({
  customer_name: z.string().min(1, 'Name is required'),
  customer_phone: z.string().min(1, 'Phone is required'),
  customer_email: z.string().email('Valid email is required').optional().or(z.literal('')),
  installation_address: z.string().optional(),
  project_description: z.string().optional(),
  installation_type: z.string().optional(),
  discount_percent: z.number().min(0).max(100).default(0),
  items: z.array(itemSchema).min(1, 'At least one item is required')
})

export type QuoteFormValues = z.infer<typeof quoteSchema>

export default function EditQuotePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const form = useForm<QuoteFormValues>({
    // @ts-expect-error - Workaround for hookform/zod version mismatch typing
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      installation_address: '',
      project_description: '',
      installation_type: '',
      discount_percent: 0,
      items: []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  })

  useEffect(() => {
    async function fetchQuote() {
      try {
        const { data: quote, error: quoteError } = await supabase
          .from('quotes')
          .select(`
            *,
            customer:customers(*),
            quote_items(*)
          `)
          .eq('id', params.id)
          .single()

        if (quoteError) throw quoteError
        if (!quote) throw new Error('Quote not found')

        // Map quote items to form structure
        const mappedItems = (quote.quote_items || []).map((item: Record<string, unknown>) => ({
          id: String(item.id),
          width_mm: Number(item.width_mm),
          height_mm: Number(item.height_mm),
          type: item.type === 'door' ? 'door' : 'window',
          glassType: String(item.glass_type),
          frameColor: String(item.frame_color),
          thickness: item.thickness_mm ? Number(item.thickness_mm) : undefined
        }))

        // Ensure at least one item
        if (mappedItems.length === 0) {
          mappedItems.push({
            width_mm: 1000,
            height_mm: 1000,
            type: 'window',
            glassType: 'clear',
            frameColor: 'charcoal'
          })
        }

        form.reset({
          customer_name: quote.customer_name || quote.customer?.name || '',
          customer_phone: quote.customer_phone || quote.customer?.phone || '',
          customer_email: quote.customer_email || quote.customer?.email || '',
          installation_address: quote.installation_address || '',
          project_description: quote.project_description || '',
          installation_type: quote.installation_type || '',
          discount_percent: quote.discount_percent || 0,
          items: mappedItems
        })
      } catch (err) {
        console.error('Error fetching quote:', err)
        setError(err instanceof Error ? err.message : 'Failed to load quote details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuote()
  }, [params.id, supabase, form])

  const onSubmit = async (data: QuoteFormValues) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/v1/quotes/${params.id}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to update quote')
      }

      router.push('/dashboard/quotes')
      router.refresh()
    } catch (err) {
      console.error('Error saving quote:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while saving')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-black text-primary tracking-tight">Edit Quote</h2>
        <p className="text-sm text-on-surface-variant mt-1">Update customer and glass items details</p>
      </div>

      {error && (
        <div className="bg-error/10 text-error p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* @ts-expect-error - Workaround for React Hook Form types */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Customer Details */}
        <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
          <h3 className="text-lg font-semibold mb-4">Customer Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Name</label>
              <input
                {...form.register('customer_name')}
                className="w-full bg-surface-container-low border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
              {form.formState.errors.customer_name && (
                <p className="text-error text-xs mt-1">{form.formState.errors.customer_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Phone</label>
              <input
                {...form.register('customer_phone')}
                className="w-full bg-surface-container-low border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
              {form.formState.errors.customer_phone && (
                <p className="text-error text-xs mt-1">{form.formState.errors.customer_phone.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Email</label>
              <input
                {...form.register('customer_email')}
                className="w-full bg-surface-container-low border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Installation Address</label>
              <input
                {...form.register('installation_address')}
                className="w-full bg-surface-container-low border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Quote Items */}
        <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Glass Items</h3>
            <button
              type="button"
              onClick={() => append({ width_mm: 1000, height_mm: 1000, type: 'window', glassType: 'clear', frameColor: 'charcoal' })}
              className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-md font-medium hover:bg-primary/20 transition-colors"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 bg-surface-container-low rounded-lg relative">
                <div className="absolute right-2 top-2">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-error hover:bg-error/10 p-1.5 rounded-md transition-colors"
                    disabled={fields.length === 1}
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pr-8">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Width (mm)</label>
                    <input
                      type="number"
                      {...form.register(`items.${index}.width_mm`, { valueAsNumber: true })}
                      className="w-full bg-white dark:bg-slate-900 border-none rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Height (mm)</label>
                    <input
                      type="number"
                      {...form.register(`items.${index}.height_mm`, { valueAsNumber: true })}
                      className="w-full bg-white dark:bg-slate-900 border-none rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Type</label>
                    <select
                      {...form.register(`items.${index}.type`)}
                      className="w-full bg-white dark:bg-slate-900 border-none rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      <option value="window">Window</option>
                      <option value="door">Door</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Glass Type</label>
                    <select
                      {...form.register(`items.${index}.glassType`)}
                      className="w-full bg-white dark:bg-slate-900 border-none rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      <option value="clear">Clear</option>
                      <option value="tinted">Tinted</option>
                      <option value="frosted">Frosted</option>
                      <option value="low-e">Low-E</option>
                      <option value="mirror">Mirror</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Frame Color</label>
                    <select
                      {...form.register(`items.${index}.frameColor`)}
                      className="w-full bg-white dark:bg-slate-900 border-none rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      <option value="charcoal">Charcoal</option>
                      <option value="black">Black</option>
                      <option value="white">White</option>
                      <option value="bronze">Bronze</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/quotes')}
            className="px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-surface-container-high transition-colors text-on-surface"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
          >
            {isSubmitting && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
            Save & Update Quote
          </button>
        </div>
      </form>
    </div>
  )
}
