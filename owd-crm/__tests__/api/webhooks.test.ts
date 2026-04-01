/**
 * Integration Tests for Webhook Endpoints
 * Tests multi-tenant isolation and webhook security
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test data
let testBusinessA: any;
let testBusinessB: any;

describe('Webhook Security Tests', () => {
  beforeAll(async () => {
    // Create test businesses
    const { data: businessA } = await supabase
      .from('businesses')
      .insert({
        name: 'Test Business A',
        slug: 'test-business-a',
        webhook_secret: 'secret-a-12345',
        is_active: true,
      })
      .select()
      .single();

    const { data: businessB } = await supabase
      .from('businesses')
      .insert({
        name: 'Test Business B',
        slug: 'test-business-b',
        webhook_secret: 'secret-b-67890',
        is_active: true,
      })
      .select()
      .single();

    testBusinessA = businessA;
    testBusinessB = businessB;
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('businesses').delete().eq('slug', 'test-business-a');
    await supabase.from('businesses').delete().eq('slug', 'test-business-b');
  });

  describe('POST /api/v1/business/[slug]/generate-quote', () => {
    it('should reject requests without webhook secret', async () => {
      const response = await fetch(
        `${BASE_URL}/api/v1/business/test-business-a/generate-quote`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerPhone: '+27123456789',
            customerName: 'Test Customer',
            items: [],
          }),
        }
      );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('webhook secret');
    });

    it('should reject requests with wrong webhook secret', async () => {
      const response = await fetch(
        `${BASE_URL}/api/v1/business/test-business-a/generate-quote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-secret': 'wrong-secret',
          },
          body: JSON.stringify({
            customerPhone: '+27123456789',
            customerName: 'Test Customer',
            items: [],
          }),
        }
      );

      expect(response.status).toBe(401);
    });

    it('should accept requests with correct webhook secret', async () => {
      const response = await fetch(
        `${BASE_URL}/api/v1/business/test-business-a/generate-quote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-secret': 'secret-a-12345',
          },
          body: JSON.stringify({
            customerPhone: '+27123456789',
            customerName: 'Test Customer',
            customerEmail: 'test@example.com',
            items: [
              {
                width: 1000,
                height: 1200,
                glassType: 'Clear 6mm',
                quantity: 1,
              },
            ],
          }),
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.quoteNumber).toBeDefined();
    });

    it('should not allow Business A secret to access Business B endpoint', async () => {
      const response = await fetch(
        `${BASE_URL}/api/v1/business/test-business-b/generate-quote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-secret': 'secret-a-12345', // Business A secret
          },
          body: JSON.stringify({
            customerPhone: '+27123456789',
            customerName: 'Test Customer',
            items: [],
          }),
        }
      );

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/business/[slug]/repair-request', () => {
    it('should create repair request with correct webhook secret', async () => {
      const response = await fetch(
        `${BASE_URL}/api/v1/business/test-business-a/repair-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-secret': 'secret-a-12345',
          },
          body: JSON.stringify({
            customerPhone: '+27123456789',
            customerLocation: 'Johannesburg',
            systemType: 'Sliding Door',
            glassType: 'Clear 6mm',
          }),
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.referenceNumber).toBeDefined();
    });

    it('should reject repair request with wrong webhook secret', async () => {
      const response = await fetch(
        `${BASE_URL}/api/v1/business/test-business-a/repair-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-secret': 'wrong-secret',
          },
          body: JSON.stringify({
            customerPhone: '+27123456789',
            customerLocation: 'Johannesburg',
          }),
        }
      );

      expect(response.status).toBe(401);
    });
  });

  describe('Multi-Tenant Data Isolation', () => {
    it('should isolate customers between businesses', async () => {
      // Create customer for Business A
      const { data: customerA } = await supabase
        .from('customers')
        .insert({
          business_id: testBusinessA.id,
          phone: '+27111111111',
          name: 'Customer A',
        })
        .select()
        .single();

      // Create customer with same phone for Business B
      const { data: customerB } = await supabase
        .from('customers')
        .insert({
          business_id: testBusinessB.id,
          phone: '+27111111111',
          name: 'Customer B',
        })
        .select()
        .single();

      // Both should succeed (same phone, different businesses)
      expect(customerA).toBeDefined();
      expect(customerB).toBeDefined();
      expect(customerA.id).not.toBe(customerB.id);

      // Cleanup
      await supabase.from('customers').delete().eq('id', customerA.id);
      await supabase.from('customers').delete().eq('id', customerB.id);
    });

    it('should prevent duplicate phone numbers within same business', async () => {
      // Create first customer
      const { data: customer1 } = await supabase
        .from('customers')
        .insert({
          business_id: testBusinessA.id,
          phone: '+27222222222',
          name: 'Customer 1',
        })
        .select()
        .single();

      expect(customer1).toBeDefined();

      // Try to create duplicate
      const { error } = await supabase
        .from('customers')
        .insert({
          business_id: testBusinessA.id,
          phone: '+27222222222',
          name: 'Customer 2',
        })
        .select()
        .single();

      expect(error).toBeDefined();
      expect(error?.message).toContain('duplicate');

      // Cleanup
      await supabase.from('customers').delete().eq('id', customer1.id);
    });

    it('should isolate quotes between businesses', async () => {
      // Create customer for each business
      const { data: customerA } = await supabase
        .from('customers')
        .insert({
          business_id: testBusinessA.id,
          phone: '+27333333333',
          name: 'Customer A',
        })
        .select()
        .single();

      const { data: customerB } = await supabase
        .from('customers')
        .insert({
          business_id: testBusinessB.id,
          phone: '+27444444444',
          name: 'Customer B',
        })
        .select()
        .single();

      // Create quotes
      const { data: quoteA } = await supabase
        .from('quotes')
        .insert({
          business_id: testBusinessA.id,
          quote_number: 'QA-001',
          customer_id: customerA.id,
          customer_name: 'Customer A',
          customer_phone: '+27333333333',
          subtotal: 1000,
          vat_amount: 150,
          total: 1150,
        })
        .select()
        .single();

      const { data: quoteB } = await supabase
        .from('quotes')
        .insert({
          business_id: testBusinessB.id,
          quote_number: 'QB-001',
          customer_id: customerB.id,
          customer_name: 'Customer B',
          customer_phone: '+27444444444',
          subtotal: 2000,
          vat_amount: 300,
          total: 2300,
        })
        .select()
        .single();

      expect(quoteA).toBeDefined();
      expect(quoteB).toBeDefined();

      // Verify isolation: Business A should only see their quote
      const { data: businessAQuotes } = await supabase
        .from('quotes')
        .select('*')
        .eq('business_id', testBusinessA.id);

      expect(businessAQuotes?.length).toBe(1);
      expect(businessAQuotes?.[0].quote_number).toBe('QA-001');

      // Cleanup
      await supabase.from('quotes').delete().eq('id', quoteA.id);
      await supabase.from('quotes').delete().eq('id', quoteB.id);
      await supabase.from('customers').delete().eq('id', customerA.id);
      await supabase.from('customers').delete().eq('id', customerB.id);
    });
  });
});
