import * as fs from 'fs/promises';
import * as path from 'path';

const PROJECT_ROOT = process.cwd();
const MAX_FILE_SIZE = 50_000; // Maximum file size to read (in characters)
const MAX_SEARCH_RESULTS = 20;
const CONTEXT_LINES = 2;

function resolveSecurePath(targetPath: string): string | null {
  const absolutePath = path.resolve(PROJECT_ROOT, targetPath);
  const projectWithSep = PROJECT_ROOT + path.sep;

  // avoid false positives where PROJECT_ROOT is a prefix of the absolutePath but not an actual parent directory
  if (
    !absolutePath.startsWith(projectWithSep) &&
    absolutePath !== PROJECT_ROOT
  ) {
    return null;
  }
  return absolutePath;
}

async function collectFiles(
  dirpath: string,
  extension?: string,
): Promise<string[]> {
  const results: string[] = [];
  let entries;
  try {
    entries = await fs.readdir(dirpath, { withFileTypes: true });
  } catch (err) {
    return results;
  }

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
      continue; // skip node_modules and hidden directories
    }

    const fullPath = path.join(dirpath, entry.name);

    if (entry.isDirectory()) {
      const subFiles = await collectFiles(fullPath, extension);
      results.push(...subFiles);
    } else if (entry.isFile()) {
      if (!extension || entry.name.endsWith(extension)) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

async function executeListFiles(params: {
  path: string;
  extension?: string;
}): Promise<string> {
  const securePath = resolveSecurePath(params.path);

  if (!securePath) {
    return 'Error: Invalid path. Access outside of project directory is not allowed.';
  }

  try {
    const stat = await fs.stat(securePath);
    if (!stat.isDirectory()) {
      return `Error: The path "${params.path}" is not a directory.`;
    }
  } catch {
    return `The directory "${params.path}" does not exist.`;
  }

  const files = await collectFiles(securePath, params.extension);

  if (files.length === 0) {
    return 'No files found.';
  }

  const relativePaths = files.map((file) => path.relative(PROJECT_ROOT, file));
  return relativePaths.join('\\n');
}

async function executeReadFile(params: { path: string }): Promise<string> {
  const securePath = resolveSecurePath(params.path);

  if (!securePath) {
    return 'Error: Invalid path. Access outside of project directory is not allowed.';
  }

  try {
    const stat = await fs.stat(securePath);
    if (stat.isDirectory()) {
      return `Error:  "${params.path}" is a directory. Not a file.`;
    }

    if (stat.size > MAX_FILE_SIZE) {
      return `Error: The file "${params.path}" exceeds the maximum allowed size of ${MAX_FILE_SIZE} characters.`;
    }

    const content = await fs.readFile(securePath, 'utf-8');

    if (content.length > MAX_FILE_SIZE) {
      return content.slice(0, MAX_FILE_SIZE) + '\\n\\n... [Content truncated ]';
    }

    return content;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;

    if (err.code === 'ENOENT') {
      return `The file "${params.path}" does not exist.`;
    }

    return `Error reading the file "${params.path}" .`;
  }
}
