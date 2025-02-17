const fs = require('fs');
const path = require('path');

function addDynamicExport(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes("export const dynamic = 'force-dynamic'")) {
    const lines = content.split('\n');
    const importIndex = lines.findIndex(line => line.startsWith('import'));
    lines.splice(importIndex + 1, 0, "export const dynamic = 'force-dynamic';");
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log(`Added dynamic export to ${filePath}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file === 'route.ts') {
      addDynamicExport(filePath);
    }
  });
}

// Start processing from the api directory
processDirectory('src/app/api');
