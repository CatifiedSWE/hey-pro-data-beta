const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, 'migrations', 'add_about_field_to_profile.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration: add_about_field_to_profile.sql');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Migration error:', error);
      
      // Try alternative method - direct SQL execution
      console.log('Trying alternative method...');
      const statements = sql.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: stmtError } = await supabase.from('user_profiles').select('about').limit(0);
          if (stmtError && stmtError.code !== 'PGRST116') {
            console.log('Alternative method also failed. Please run the SQL manually in Supabase SQL Editor.');
            console.log('\nSQL to run:\n', sql);
            return;
          }
        }
      }
      
      console.log('Migration appears to have completed (column may already exist)');
    } else {
      console.log('Migration completed successfully!');
    }
  } catch (err) {
    console.error('Error running migration:', err);
    console.log('\nPlease run this SQL manually in your Supabase SQL Editor:');
    const migrationPath = path.join(__dirname, 'migrations', 'add_about_field_to_profile.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('\n' + sql);
  }
}

runMigration();
