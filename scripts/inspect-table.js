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

async function inspect() {
  console.log('🔍 Inspecting Supabase clinics table...');
  
  // Get count
  const { count } = await supabase
    .from('clinics')
    .select('*', { count: 'exact', head: true });
  console.log(`📊 Current row count: ${count}`);
  
  // Get first row to see structure
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ Error fetching row:', error.message);
    return;
  }
  
  if (data && data.length > 0) {
    const row = data[0];
    console.log('📋 Columns in first row:');
    Object.keys(row).forEach(key => {
      console.log(`  ${key}: ${typeof row[key]} = ${JSON.stringify(row[key]).substring(0, 100)}`);
    });
  } else {
    console.log('📭 Table is empty');
    
    // Try to get column info via raw SQL (if we have permissions)
    // This might not work with service role key, but try
    const { data: sqlData, error: sqlError } = await supabase
      .rpc('get_columns', { table_name: 'clinics' })
      .catch(() => ({ data: null, error: 'RPC not available' }));
    
    if (!sqlError && sqlData) {
      console.log('Column info:', sqlData);
    }
  }
}

inspect().catch(err => {
  console.error('❌', err);
});