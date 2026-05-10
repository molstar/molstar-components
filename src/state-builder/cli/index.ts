#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { ASTFactory } from '../compiler/ast/factory.ts';
import { CodeGenerator } from '../compiler/codegen/generator.ts';

interface CliOptions {
  includeSectionMarkers?: boolean;
  builderVar?: string;
  includeComments?: boolean;
}

function printUsage() {
  console.log(`
Usage: mvs-codegen [options] <json-file>

Generate code from MVS JSON file.

Arguments:
  <json-file>              Path to the MVS JSON file

Options:
  --no-markers            Exclude section markers from output
  --builder-var <name>    Name of the builder variable (default: 'builder')
  --comments              Include structural comments in output
  -h, --help              Show this help message

Examples:
  mvs-codegen input.json
  mvs-codegen --no-markers input.json
  mvs-codegen --builder-var myBuilder --comments input.json
`);
}

function parseArgs(args: string[]): { options: CliOptions; filePath: string | null } {
  const options: CliOptions = {
    includeSectionMarkers: true,
    builderVar: 'builder',
    includeComments: false,
  };

  let filePath: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '-h':
      case '--help':
        printUsage();
        process.exit(0);
        break;

      case '--no-markers':
        options.includeSectionMarkers = false;
        break;

      case '--builder-var':
        if (i + 1 >= args.length) {
          console.error('Error: --builder-var requires a value');
          process.exit(1);
        }
        options.builderVar = args[++i];
        break;

      case '--comments':
        options.includeComments = true;
        break;

      default:
        if (arg.startsWith('-')) {
          console.error(`Error: Unknown option '${arg}'`);
          printUsage();
          process.exit(1);
        }
        if (filePath !== null) {
          console.error('Error: Multiple file paths provided');
          process.exit(1);
        }
        filePath = arg;
    }
  }

  return { options, filePath };
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Error: No input file specified');
    printUsage();
    process.exit(1);
  }

  const { options, filePath } = parseArgs(args);

  if (!filePath) {
    console.error('Error: No input file specified');
    printUsage();
    process.exit(1);
  }

  // Resolve the file path
  const resolvedPath = path.resolve(process.cwd(), filePath);

  // Check if file exists
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: File not found: ${resolvedPath}`);
    process.exit(1);
  }

  try {
    // Read the JSON file
    const jsonContent = fs.readFileSync(resolvedPath, 'utf-8');

    // Parse the JSON and create AST
    const ast = ASTFactory.fromJSON(jsonContent);

    // Generate code
    const generator = new CodeGenerator(options);
    const code = generator.generate(ast);

    // Print the generated code
    console.log(code);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(`Error: ${String(error)}`);
    }
    process.exit(1);
  }
}

main();
