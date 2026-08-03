const { execSync } = require('child_process');
const fs = require('fs');

try {
  const result = execSync('git log -n 10 --oneline', { cwd: 'd:/Foru4' });
  fs.writeFileSync('d:/Foru4/git-log.txt', result);
  console.log('Success');
} catch (e) {
  fs.writeFileSync('d:/Foru4/git-log-error.txt', e.message);
  console.log(e);
}
