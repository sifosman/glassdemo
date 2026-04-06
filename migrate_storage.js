const fs = require('fs');

const OLD_URL = 'https://klazqmnlgzclidjcuabr.supabase.co';
const OLD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsYXpxbW5sZ3pjbGlkamN1YWJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTAyMDM1NiwiZXhwIjoyMDg0NTk2MzU2fQ.BCmZCRaPC8j8pqLfI75NXrT2zLz1cgQhCBOqoC10b-A';

const NEW_URL = 'https://uhwfbogkcjvvizswjsoh.supabase.co';
const NEW_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVod2Zib2drY2p2dml6c3dqc29oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ1MTU5OSwiZXhwIjoyMDkwMDI3NTk5fQ.ax7SqpGal0-7VNhnNbpPhl5xq8VzF3X-ufViuQbtXYQ';

// Helper to interact with REST APIs
async function fetchSupabase(url, endpoint, key, options = {}) {
    const res = await fetch(`${url}${endpoint}`, {
        ...options,
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            ...options.headers
        }
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed on ${endpoint}: ${res.status} ${err}`);
    }
    return res;
}

async function listBuckets(url, key) {
    const res = await fetchSupabase(url, '/storage/v1/bucket', key);
    return await res.json();
}

async function listFiles(url, key, bucketId, prefix = '') {
    const res = await fetchSupabase(url, `/storage/v1/object/list/${bucketId}`, key, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix, limit: 100, offset: 0 })
    });
    return await res.json();
}

async function downloadFile(url, key, bucketId, path) {
    const res = await fetchSupabase(url, `/storage/v1/object/authenticated/${bucketId}/${path}`, key);
    return await res.arrayBuffer();
}

async function uploadFile(url, key, bucketId, path, fileBuffer, contentType) {
    await fetchSupabase(url, `/storage/v1/object/${bucketId}/${path}`, key, {
        method: 'POST',
        headers: {
            'Content-Type': contentType,
            'x-upsert': 'true' // Overwrite if exists
        },
        body: fileBuffer
    });
}

async function updateDBRecord(table, id, updateData) {
    await fetchSupabase(NEW_URL, `/rest/v1/${table}?id=eq.${id}`, NEW_SERVICE_KEY, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(updateData)
    });
}

// Function to replace old URL with new URL in strings
function replaceUrl(oldStr) {
    if (!oldStr) return null;
    return oldStr.replace('klazqmnlgzclidjcuabr', 'uhwfbogkcjvvizswjsoh');
}

async function migrateStorage() {
    try {
        console.log('Fetching old buckets...');
        const oldBuckets = await listBuckets(OLD_URL, OLD_SERVICE_KEY);
        console.log(`Found ${oldBuckets.length} buckets: ${oldBuckets.map(b => b.name).join(', ')}`);

        // Create buckets in new project if they don't exist
        for (const bucket of oldBuckets) {
            console.log(`Creating bucket ${bucket.name} in new project...`);
            try {
                await fetchSupabase(NEW_URL, `/storage/v1/bucket`, NEW_SERVICE_KEY, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: bucket.id, name: bucket.name, public: bucket.public })
                });
            } catch(e) {
                console.log(`Bucket ${bucket.name} might already exist (${e.message})`);
            }
        }

        // We only care about the 'documents' bucket for quotes and invoices based on DB data
        const targetBucket = 'documents';
        const targetBucketObj = oldBuckets.find(b => b.name === targetBucket);
        
        if (targetBucketObj) {
            console.log(`\nExploring ${targetBucket} bucket...`);
            
            // List folders in 'documents'
            const rootItems = await listFiles(OLD_URL, OLD_SERVICE_KEY, targetBucket);
            
            for (const item of rootItems) {
                if (!item.id && item.name) { // It's a folder (like 'quotes', 'invoices')
                    const folderName = item.name;
                    console.log(`Found folder: ${folderName}`);
                    
                    const files = await listFiles(OLD_URL, OLD_SERVICE_KEY, targetBucket, folderName);
                    console.log(`Found ${files.length} files in ${folderName}`);
                    
                    for (const file of files) {
                        if (file.name === '.emptyFolderPlaceholder') continue;
                        
                        const filePath = `${folderName}/${file.name}`;
                        console.log(`Downloading ${filePath}...`);
                        
                        try {
                            const fileBuffer = await downloadFile(OLD_URL, OLD_SERVICE_KEY, targetBucket, filePath);
                            const contentType = file.metadata?.mimetype || 'application/pdf';
                            
                            console.log(`Uploading ${filePath} to new project...`);
                            await uploadFile(NEW_URL, NEW_SERVICE_KEY, targetBucket, filePath, fileBuffer, contentType);
                            console.log(`✅ Migrated ${filePath}`);
                        } catch(e) {
                            console.error(`❌ Failed to migrate ${filePath}:`, e.message);
                        }
                    }
                }
            }
        }

        console.log('\nUpdating Database URLs in NEW project...');
        // Need to update the pdf_url in the quotes table to point to the new project
        const resQuotes = await fetchSupabase(NEW_URL, '/rest/v1/quotes?select=id,pdf_url', NEW_SERVICE_KEY);
        const quotes = await resQuotes.json();
        
        let updateCount = 0;
        for (const q of quotes) {
            if (q.pdf_url && q.pdf_url.includes('klazqmnlgzclidjcuabr')) {
                const newUrl = replaceUrl(q.pdf_url);
                await updateDBRecord('quotes', q.id, { pdf_url: newUrl });
                updateCount++;
            }
        }
        console.log(`Updated ${updateCount} quote records with new PDF URLs.`);

        const resInvoices = await fetchSupabase(NEW_URL, '/rest/v1/invoices?select=id,pdf_url', NEW_SERVICE_KEY);
        const invoices = await resInvoices.json();
        
        let invUpdateCount = 0;
        for (const inv of invoices) {
            if (inv.pdf_url && inv.pdf_url.includes('klazqmnlgzclidjcuabr')) {
                const newUrl = replaceUrl(inv.pdf_url);
                await updateDBRecord('invoices', inv.id, { pdf_url: newUrl });
                invUpdateCount++;
            }
        }
        console.log(`Updated ${invUpdateCount} invoice records with new PDF URLs.`);
        
        console.log('\n🎉 Storage migration completed!');
        
    } catch(e) {
        console.error('Storage migration failed:', e);
    }
}

migrateStorage();
