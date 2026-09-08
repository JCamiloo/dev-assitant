import * as fs from 'fs/promises';
import * as path from 'path';
import type { Chunk } from '../types.js';

const MAX_CHUNK_SIZE = 2000;

export function chunkMarkdown(content: string, filePath: string): Chunk[] {
  const fileName = path.basename(filePath);
  const chunks: Chunk[] = [];
  const sections = content.split(/(?=^## )/m);

  let globalPosition = 0;
  let lastParagraph = '';

  for (const section of sections) {
    if (!section.trim()) continue;

    const lines = section.split('\n');
    const firstLine = lines[0] ?? '';
    const isHeading = firstLine.startsWith('## ');
    const heading = isHeading ? firstLine.trim() : '(Introduction)';

    if (section.length <= MAX_CHUNK_SIZE) {
      const chunkContent = lastParagraph
        ? `${lastParagraph}\n\n${section.trim()}`
        : section.trim();

      chunks.push({
        id: `${fileName}-${globalPosition}`,
        content: chunkContent,
        metadata: {
          source: fileName,
          heading,
          position: globalPosition,
          charCount: chunkContent.length,
        },
      });
    }
  }
}
