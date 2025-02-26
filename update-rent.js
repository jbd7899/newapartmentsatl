// Script to update all rent values to 0
const fs = require('fs');

const filePath = 'server/storage.ts';
const fileContent = fs.readFileSync(filePath, 'utf8');

// Use regex to replace all rent values
const updatedContent = fileContent.replace(/rent: \d+,/g, 'rent: 0,');

fs.writeFileSync(filePath, updatedContent);

console.log('All property rent values have been updated to 0.');