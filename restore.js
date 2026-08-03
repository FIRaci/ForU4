const fs = require('fs');
const content = fs.readFileSync('d:/Foru4/codebase.txt', 'utf8');
const files = content.split('======================================================\r\nFile: ');
const files2 = content.split('======================================================\nFile: ');

const delimiter = files.length > files2.length ? '======================================================\r\nFile: ' : '======================================================\nFile: ';
const sections = content.split(delimiter);

for (let i = 1; i < sections.length; i++) {
  const parts = sections[i].split(/======================================================\r?\n/);
  const filename = parts[0].trim();
  const fileContent = parts[1]; // Do not trim, just keep exact content
  
  // Make sure directory exists
  const path = require('path');
  const dir = path.dirname('d:/Foru4/' + filename);
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync('d:/Foru4/' + filename, fileContent);
  console.log('Wrote ' + filename);
}
