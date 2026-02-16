/**
 * Sync zh-TW.json from zh.json using OpenCC (Simplified → Traditional Chinese)
 *
 * Usage: node scripts/sync-zh-tw.cjs [--full]
 *   --full: Regenerate entire zh-TW.json from zh.json (overwrite all values)
 *   (default): Only fill in missing keys
 */

const fs = require('fs');
const path = require('path');
const OpenCC = require('opencc-js');

const converter = OpenCC.Converter({ from: 'cn', to: 'twp' });

const messagesDir = path.join(__dirname, '..', 'messages');
const zhPath = path.join(messagesDir, 'zh.json');
const zhTWPath = path.join(messagesDir, 'zh-TW.json');

const fullMode = process.argv.includes('--full');

function getAllKeyPaths(obj, prefix = '') {
  const paths = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      paths.push(...getAllKeyPaths(obj[key], fullKey));
    } else {
      paths.push(fullKey);
    }
  }
  return paths;
}

function getNestedValue(obj, keyPath) {
  return keyPath.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

function setNestedValue(obj, keyPath, value) {
  const keys = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current) || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

function convertValue(value) {
  if (typeof value === 'string') {
    return converter(value);
  }
  if (Array.isArray(value)) {
    return value.map(convertValue);
  }
  if (typeof value === 'object' && value !== null) {
    const result = {};
    for (const key in value) {
      result[key] = convertValue(value[key]);
    }
    return result;
  }
  return value;
}

// Deep clone and convert entire object
function convertObject(obj) {
  return convertValue(obj);
}

// Merge source into target, preserving target's existing structure order
function deepMergePreserveOrder(target, source) {
  const result = {};

  // First, add all keys from target in order
  for (const key of Object.keys(target)) {
    if (key in source) {
      if (typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])
        && typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = deepMergePreserveOrder(target[key], source[key]);
      } else {
        result[key] = target[key]; // Keep existing
      }
    } else {
      result[key] = target[key]; // Keep target-only keys
    }
  }

  // Then, add keys from source that aren't in target
  for (const key of Object.keys(source)) {
    if (!(key in target)) {
      result[key] = source[key];
    }
  }

  return result;
}

function main() {
  const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

  if (fullMode) {
    console.log('Full mode: Regenerating entire zh-TW.json from zh.json...');
    const zhTW = convertObject(zh);
    fs.writeFileSync(zhTWPath, JSON.stringify(zhTW, null, 2) + '\n', 'utf8');
    const keyCount = getAllKeyPaths(zhTW).length;
    console.log(`Done! Converted ${keyCount} keys. Written to ${zhTWPath}`);
    return;
  }

  // Incremental mode: only fill missing keys
  let zhTW;
  try {
    zhTW = JSON.parse(fs.readFileSync(zhTWPath, 'utf8'));
  } catch {
    zhTW = {};
  }

  const zhKeys = getAllKeyPaths(zh);
  const zhTWKeys = getAllKeyPaths(zhTW);
  const missingKeys = zhKeys.filter(k => !zhTWKeys.includes(k));

  if (missingKeys.length === 0) {
    console.log('zh-TW.json is already in sync with zh.json. No missing keys.');
    return;
  }

  console.log(`Found ${missingKeys.length} missing keys in zh-TW.json:`);

  let addedCount = 0;
  for (const keyPath of missingKeys) {
    const zhValue = getNestedValue(zh, keyPath);
    const convertedValue = convertValue(zhValue);
    setNestedValue(zhTW, keyPath, convertedValue);
    console.log(`  + ${keyPath}`);
    addedCount++;
  }

  // Reorder zh-TW to match zh structure
  const convertedZh = convertObject(zh);
  const merged = deepMergePreserveOrder(zhTW, convertedZh);

  fs.writeFileSync(zhTWPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  console.log(`\nDone! Added ${addedCount} missing keys. Written to ${zhTWPath}`);
}

main();
