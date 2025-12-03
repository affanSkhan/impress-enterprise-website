/**
 * Script to apply public invoice access migration
 * Run with: node scripts/apply-invoice-migration.js
 */

const fs = require('fs');
const path = require('path');

// Note: For RLS policy changes, we need the service role key, not anon key
// The anon key doesn't have permissions to modify policies
console.log('⚠️  WARNING: This script requires Supabase service role key to modify RLS policies.');
console.log('⚠️  Please apply the migration manually through Supabase Dashboard:');
console.log('');
console.log('1. Go to: https://supabase.com/dashboard/project/tjitbybznlpdiqbbgqif/sql/new');
console.log('2. Copy and paste the SQL from: supabase/migrations/004_public_invoice_access.sql');
console.log('3. Click "Run" to apply the migration');
console.log('');

// Read and display the migration SQL
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '004_public_invoice_access.sql');
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

console.log('Migration SQL to apply:');
console.log('═'.repeat(80));
console.log(migrationSql);
console.log('═'.repeat(80));
console.log('');
console.log('✅ After applying, customers will be able to view invoices via public links!');
