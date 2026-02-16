/**
 * Generate zh-TW.ts tool content from zh.ts using OpenCC (Simplified → Traditional)
 *
 * Usage: node scripts/gen-zh-tw-tool-content.cjs
 */

const fs = require('fs');
const path = require('path');
const OpenCC = require('opencc-js');

const converter = OpenCC.Converter({ from: 'cn', to: 'twp' });

const srcDir = path.join(__dirname, '..', 'src', 'config', 'tool-content');
const zhPath = path.join(srcDir, 'zh.ts');
const zhTWPath = path.join(srcDir, 'zh-TW.ts');

const zhContent = fs.readFileSync(zhPath, 'utf8');

// Convert all Chinese text (OpenCC only converts Chinese characters, leaves code intact)
let zhTWContent = converter(zhContent);

// Fix the export name: toolContentZh → toolContentZhTW
zhTWContent = zhTWContent.replace(/toolContentZh\b/g, 'toolContentZhTW');

// Update the file header comment
zhTWContent = zhTWContent.replace(
  /Chinese Tool Content/,
  'Traditional Chinese (zh-TW) Tool Content'
);
zhTWContent = zhTWContent.replace(
  /中文工具內容/,
  '繁體中文工具內容'
);

fs.writeFileSync(zhTWPath, zhTWContent, 'utf8');

const lineCount = zhTWContent.split('\n').length;
console.log(`Generated ${zhTWPath} (${lineCount} lines)`);
