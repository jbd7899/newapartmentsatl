// Node.js script to update all property rent values to 0
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server/storage.ts');
console.log(`Reading file: ${filePath}`);

try {
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace all rent values with 0
  const updatedContent = content.replace(/rent: \d+(\.\d+)?/g, 'rent: 0');
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, updatedContent);
  
  console.log('All property rent values have been updated to 0');
} catch (error) {
  console.error('Error updating rent values:', error);
}