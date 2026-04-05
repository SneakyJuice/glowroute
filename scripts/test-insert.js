#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load env
const keysEnvPath = path.join(process.env.HOME, '.openclaw/workspace/.keys.env');
if (fs.existsSync(keysEnvPath)) {
  fs.readFileSync(keysEnvPath, 'utf8').split('\n').forEach(line => {
    const m = line.trim().match(/^export\s+(\w+)=(.+)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function test() {
  console.log('🧪 Testing Supabase insert...');
  
  // Try with minimal columns
  const testClinic = {
    id: '12345678-1234-1234-1234-123456789abc', // UUID format
    slug: 'test-clinic-test-city',
    name: 'Test Clinic',
    city: 'Test City',
  };
  
  console.log('Inserting:', testClinic);
  
  const { data, error } = await supabase
    .from('clinics')
    .insert([testClinic])
    .select();
  
  if (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
    
    // Try to get table schema via SQL
    console.log('\n🔍 Trying to get table info via SQL...');
    const { data: sqlData, error: sqlError } = await supabase
      .from('clinics')
      .select('*')
      .limit(0);
    
    if (sqlError) {
      console.error('Schema error:', sqlError);
    } else {
      console.log('Empty select works, table exists but columns unknown');
    }
  } else {
    console.log('✅ Insert successful:', data);
    
    // Clean up
    await supabase.from('clinics').delete().eq('id', 'test-001');
  }
}

test().catch(err => {
  console.error('❌', err);
});