#!/usr/bin/env node
/**
 * Inspect clinics table schema
 */

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

async function main() {
  console.log('🔍 Inspecting clinics table schema...');
  
  // Fetch a single row with all columns
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  if (data && data.length > 0) {
    const row = data[0];
    console.log('📋 Columns and sample values:');
    Object.keys(row).sort().forEach(key => {
      console.log(`  ${key}: ${JSON.stringify(row[key])}`);
    });
  } else {
    console.log('No clinics found');
  }
  
  // Try to get column types via SQL (if we can run raw SQL)
  console.log('\n🔍 Trying to get column types via information_schema...');
  const { data: schemaData, error: schemaError } = await supabase
    .from('clinics')
    .select('*')
    .limit(0);
    
  if (schemaError) {
    console.error('❌ Schema error:', schemaError.message);
  } else {
    console.log('✅ Table exists and accessible');
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});