/**
 * RLS Policy Tests
 * Verifies Row-Level Security policies enforce multi-tenant isolation
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client (bypasses RLS for setup)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test users and businesses
let businessA: any;
let businessB: any;
let userA: any;
let userB: any;
let userAClient: any;
let userBClient: any;

describe('RLS Policy Tests', () => {
  beforeAll(async () => {
    // Create test businesses
    const { data: bA } = await supabaseAdmin
      .from('businesses')
      .insert({
        name: 'RLS Test Business A',
        slug: 'rls-test-a',
        is_active: true,
      })
      .select()
      .single();

    const { data: bB } = await supabaseAdmin
      .from('businesses')
      .insert({
        name: 'RLS Test Business B',
        slug: 'rls-test-b',
        is_active: true,
      })
      .select()
      .single();

    businessA = bA;
    businessB = bB;

    // Create test users via Supabase Auth
    const { data: authUserA } = await supabaseAdmin.auth.admin.createUser({
      email: 'rls-user-a@test.com',
      password: 'password123',
      email_confirm: true,
    });

    const { data: authUserB } = await supabaseAdmin.auth.admin.createUser({
      email: 'rls-user-b@test.com',
      password: 'password123',
      email_confirm: true,
    });

    userA = authUserA.user;
    userB = authUserB.user;

    // Link users to businesses
    await supabaseAdmin.from('business_users').insert({
      business_id: businessA.id,
      email: 'rls-user-a@test.com',
      role: 'admin',
    });

    await supabaseAdmin.from('business_users').insert({
      business_id: businessB.id,
      email: 'rls-user-b@test.com',
      role: 'admin',
    });

    // Create authenticated clients for each user
    const { data: sessionA } = await supabaseAdmin.auth.signInWithPassword({
      email: 'rls-user-a@test.com',
      password: 'password123',
    });

    const { data: sessionB } = await supabaseAdmin.auth.signInWithPassword({
      email: 'rls-user-b@test.com',
      password: 'password123',
    });

    userAClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${sessionA.session?.access_token}`,
        },
      },
    });

    userBClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${sessionB.session?.access_token}`,
        },
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await supabaseAdmin.from('business_users').delete().eq('business_id', businessA.id);
    await supabaseAdmin.from('business_users').delete().eq('business_id', businessB.id);
    await supabaseAdmin.from('businesses').delete().eq('id', businessA.id);
    await supabaseAdmin.from('businesses').delete().eq('id', businessB.id);
    await supabaseAdmin.auth.admin.deleteUser(userA.id);
    await supabaseAdmin.auth.admin.deleteUser(userB.id);
  });

  describe('Customers Table RLS', () => {
    it('should allow user to see only their business customers', async () => {
      // Create customers for both businesses (as admin)
      const { data: customerA } = await supabaseAdmin
        .from('customers')
        .insert({
          business_id: businessA.id,
          phone: '+27555555555',
          name: 'Customer A',
        })
        .select()
        .single();

      const { data: customerB } = await supabaseAdmin
        .from('customers')
        .insert({
          business_id: businessB.id,
          phone: '+27666666666',
          name: 'Customer B',
        })
        .select()
        .single();

      // User A should only see Customer A
      const { data: userACustomers } = await userAClient
        .from('customers')
        .select('*');

      expect(userACustomers?.length).toBe(1);
      expect(userACustomers?.[0].id).toBe(customerA.id);

      // User B should only see Customer B
      const { data: userBCustomers } = await userBClient
        .from('customers')
        .select('*');

      expect(userBCustomers?.length).toBe(1);
      expect(userBCustomers?.[0].id).toBe(customerB.id);

      // Cleanup
      await supabaseAdmin.from('customers').delete().eq('id', customerA.id);
      await supabaseAdmin.from('customers').delete().eq('id', customerB.id);
    });

    it('should prevent user from accessing another business customer by ID', async () => {
      // Create customer for Business B
      const { data: customerB } = await supabaseAdmin
        .from('customers')
        .insert({
          business_id: businessB.id,
          phone: '+27777777777',
          name: 'Customer B Secret',
        })
        .select()
        .single();

      // User A tries to access Customer B by ID
      const { data, error } = await userAClient
        .from('customers')
        .select('*')
        .eq('id', customerB.id)
        .single();

      // Should return no data or error
      expect(data).toBeNull();

      // Cleanup
      await supabaseAdmin.from('customers').delete().eq('id', customerB.id);
    });
  });

  describe('Quotes Table RLS', () => {
    it('should isolate quotes between businesses', async () => {
      // Create customers
      const { data: customerA } = await supabaseAdmin
        .from('customers')
        .insert({
          business_id: businessA.id,
          phone: '+27888888888',
          name: 'Quote Customer A',
        })
        .select()
        .single();

      const { data: customerB } = await supabaseAdmin
        .from('customers')
        .insert({
          business_id: businessB.id,
          phone: '+27999999999',
          name: 'Quote Customer B',
        })
        .select()
        .single();

      // Create quotes
      const { data: quoteA } = await supabaseAdmin
        .from('quotes')
        .insert({
          business_id: businessA.id,
          quote_number: 'RLS-QA-001',
          customer_id: customerA.id,
          customer_name: 'Quote Customer A',
          customer_phone: '+27888888888',
          subtotal: 5000,
          vat_amount: 750,
          total: 5750,
        })
        .select()
        .single();

      const { data: quoteB } = await supabaseAdmin
        .from('quotes')
        .insert({
          business_id: businessB.id,
          quote_number: 'RLS-QB-001',
          customer_id: customerB.id,
          customer_name: 'Quote Customer B',
          customer_phone: '+27999999999',
          subtotal: 10000,
          vat_amount: 1500,
          total: 11500,
        })
        .select()
        .single();

      // User A should only see Quote A
      const { data: userAQuotes } = await userAClient
        .from('quotes')
        .select('*');

      expect(userAQuotes?.length).toBe(1);
      expect(userAQuotes?.[0].quote_number).toBe('RLS-QA-001');

      // User B should only see Quote B
      const { data: userBQuotes } = await userBClient
        .from('quotes')
        .select('*');

      expect(userBQuotes?.length).toBe(1);
      expect(userBQuotes?.[0].quote_number).toBe('RLS-QB-001');

      // Cleanup
      await supabaseAdmin.from('quotes').delete().eq('id', quoteA.id);
      await supabaseAdmin.from('quotes').delete().eq('id', quoteB.id);
      await supabaseAdmin.from('customers').delete().eq('id', customerA.id);
      await supabaseAdmin.from('customers').delete().eq('id', customerB.id);
    });
  });

  describe('Products Table RLS', () => {
    it('should isolate product catalogs between businesses', async () => {
      // Create products
      const { data: productA } = await supabaseAdmin
        .from('products')
        .insert({
          business_id: businessA.id,
          product_code: 'GLASS-A-001',
          name: 'Clear Glass 6mm - Business A',
          category: 'glass',
          thickness_mm: 6,
          price_per_sqm: 450,
        })
        .select()
        .single();

      const { data: productB } = await supabaseAdmin
        .from('products')
        .insert({
          business_id: businessB.id,
          product_code: 'GLASS-B-001',
          name: 'Clear Glass 6mm - Business B',
          category: 'glass',
          thickness_mm: 6,
          price_per_sqm: 550, // Different pricing
        })
        .select()
        .single();

      // User A should only see Product A
      const { data: userAProducts } = await userAClient
        .from('products')
        .select('*');

      expect(userAProducts?.length).toBe(1);
      expect(userAProducts?.[0].product_code).toBe('GLASS-A-001');
      expect(userAProducts?.[0].price_per_sqm).toBe(450);

      // User B should only see Product B
      const { data: userBProducts } = await userBClient
        .from('products')
        .select('*');

      expect(userBProducts?.length).toBe(1);
      expect(userBProducts?.[0].product_code).toBe('GLASS-B-001');
      expect(userBProducts?.[0].price_per_sqm).toBe(550);

      // Cleanup
      await supabaseAdmin.from('products').delete().eq('id', productA.id);
      await supabaseAdmin.from('products').delete().eq('id', productB.id);
    });
  });

  describe('Repair Requests Table RLS', () => {
    it('should isolate repair requests between businesses', async () => {
      // Create repair requests
      const { data: repairA } = await supabaseAdmin
        .from('repair_requests')
        .insert({
          business_id: businessA.id,
          reference_number: 'REP-A-001',
          customer_phone: '+27111222333',
          system_type: 'Sliding Door',
          total_price: 2500,
        })
        .select()
        .single();

      const { data: repairB } = await supabaseAdmin
        .from('repair_requests')
        .insert({
          business_id: businessB.id,
          reference_number: 'REP-B-001',
          customer_phone: '+27444555666',
          system_type: 'Window',
          total_price: 1800,
        })
        .select()
        .single();

      // User A should only see Repair A
      const { data: userARepairs } = await userAClient
        .from('repair_requests')
        .select('*');

      expect(userARepairs?.length).toBe(1);
      expect(userARepairs?.[0].reference_number).toBe('REP-A-001');

      // User B should only see Repair B
      const { data: userBRepairs } = await userBClient
        .from('repair_requests')
        .select('*');

      expect(userBRepairs?.length).toBe(1);
      expect(userBRepairs?.[0].reference_number).toBe('REP-B-001');

      // Cleanup
      await supabaseAdmin.from('repair_requests').delete().eq('id', repairA.id);
      await supabaseAdmin.from('repair_requests').delete().eq('id', repairB.id);
    });
  });
});
