import { existsSync, readFileSync } from 'fs';

function printJsonErrorAndExit(message) {
  console.error(JSON.stringify({ error: message }, null, 2));
  process.exit(1);
}

export function requireTextFile(filePath, missingMessage) {
  if (!existsSync(filePath)) {
    printJsonErrorAndExit(missingMessage);
  }
  return readFileSync(filePath, 'utf8');
}

export function parseJsonOrExit(raw, parseMessage) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    printJsonErrorAndExit(`${parseMessage}: ${error.message}`);
  }
}

export function requireJsonFile(filePath, missingMessage, parseMessage) {
  return parseJsonOrExit(requireTextFile(filePath, missingMessage), parseMessage);
}
