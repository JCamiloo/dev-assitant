import type { ToolDefinition } from '../types.js';

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'list_files',
    description:
      'Lists files in a project directory. ' +
      'Useful for exploring the codebase structure before reading specific files. ' +
      'Can filter by file extension.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            "Path of the directory to list, relative to the project (e.g.: './src', './src/llm'). " +
            "Use '.' for the project root directory.",
        },
        extension: {
          type: 'string',
          description:
            "File extension to filter results (e.g.: '.ts', '.md', '.json'). " +
            'If omitted, all files are listed.',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'read_file',
    description:
      'Reads the complete content of a project file. ' +
      'Useful for inspecting source code, configuration, or documentation. ' +
      'Limited to files with a maximum of 50,000 characters.',
    input_schema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description:
            "Path of the file to read, relative to the project (e.g.: './src/config.ts', './README.md'). " +
            'Must be the complete path including file name and extension.',
        },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'search_code',
    description:
      'Searches for a text pattern in project files and returns matching lines ' +
      'with context of 2 lines above and below. ' +
      'Useful for finding function usages, variables, or specific patterns in the codebase.',
    input_schema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description:
            'Text to search (exact substring search, case-sensitive). ' +
            "Example: 'askClaude', 'export default', 'import Anthropic'",
        },
        path: {
          type: 'string',
          description:
            "Directory to search in, relative to the project (e.g.: './src', './src/llm'). " +
            'If omitted, searches the entire project.',
        },
        file_extension: {
          type: 'string',
          description:
            "Filter search to files with this extension (e.g.: '.ts', '.md'). " +
            'If omitted, searches all file types.',
        },
      },
      required: ['pattern'],
    },
  },
];
