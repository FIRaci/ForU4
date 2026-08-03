const fs = require('fs');
const readline = require('readline');

async function extractFiles() {
  const fileStream = fs.createReadStream('C:/Users/TSC/.gemini/antigravity-ide/brain/59ade167-20e3-42e3-a3c4-4e89eef05baa/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let foundScript = false;
  let foundTable = false;

  for await (const line of rl) {
    try {
      const data = JSON.parse(line);
      if (data.tool_calls) {
        for (const call of data.tool_calls) {
          if (call.name === 'write_to_file' || call.name === 'replace_file_content' || call.name === 'multi_replace_file_content') {
            const file = call.args.TargetFile || call.args.AbsolutePath;
            if (file && file.includes('script.json') && !foundScript) {
              fs.writeFileSync('d:/Foru4/src/data/script.json.bak', call.args.CodeContent || call.args.ReplacementContent || JSON.stringify(call.args));
              foundScript = true;
              console.log('Found script.json');
            }
            if (file && file.includes('MagicTable.jsx') && !foundTable) {
              fs.writeFileSync('d:/Foru4/src/components/MagicTable.jsx.bak', call.args.CodeContent || call.args.ReplacementContent || JSON.stringify(call.args));
              foundTable = true;
              console.log('Found MagicTable.jsx');
            }
          }
        }
      }
    } catch(e) {}
    if (foundScript && foundTable) break;
  }
}
extractFiles();
