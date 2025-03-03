// Script to run SQL file using PostgreSQL connection
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const connectionString = 'postgresql://neondb_owner:npg_R1LfZB3PsHdp@ep-shiny-frost-a4fq5jvj.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sqlFile = path.join(__dirname, 'add-units.sql');

// Read the SQL file
const sql = fs.readFileSync(sqlFile, 'utf8');

// Create a temporary file with the SQL commands
const tempFile = path.join(__dirname, 'temp.sql');
fs.writeFileSync(tempFile, sql);

// Run the SQL file using psql
const command = `PGPASSWORD=npg_R1LfZB3PsHdp psql "${connectionString}" -f "${tempFile}"`;

console.log('Running SQL file...');
exec(command, (error, stdout, stderr) => {
  // Clean up the temporary file
  fs.unlinkSync(tempFile);
  
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`stderr: ${stderr}`);
  }
  
  console.log(`stdout: ${stdout}`);
  console.log('SQL file executed successfully');
}); 