import { ASTNode } from '../ast/types.ts';
import { isConstantRef } from '../../core/index.ts';

export class ParamFormatter {
  static formatParams(node: ASTNode): string {
    const params = { ...node.params };
    const ref = node.ref;
    const custom = node.custom;

    const paramsObj: Record<string, any> = {};

    Object.entries(params).forEach(([key, value]) => {
      // Skip 'type' for structure (it's in the method name)
      if (node.kind === 'structure' && key === 'type') return;

      // Skip 'kind' for primitives (it's in the method name)
      if (node.kind === 'primitive' && key === 'kind') return;

      paramsObj[key] = value;
    });

    if (ref) {
      paramsObj.ref = ref;
    }

    if (custom) {
      paramsObj.custom = custom;
    }

    if (Object.keys(paramsObj).length === 0) {
      return '{}';
    }

    return this.formatObject(paramsObj, 0);
  }

  private static formatValue(value: any, depth: number): string {
    // Handle ConstantRef - output as unquoted identifier (e.g., Colors.primary)
    if (isConstantRef(value)) {
      return `${value.constantName}.${value.entryKey}`;
    }

    if (value === null) return 'null';
    if (value === undefined) return 'undefined';

    if (typeof value === 'string') {
      // Escape strings properly
      const escaped = value
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      return `'${escaped}'`;
    }

    if (typeof value === 'number') {
      return String(value);
    }

    if (typeof value === 'boolean') {
      return String(value);
    }

    if (Array.isArray(value)) {
      return this.formatArray(value, depth);
    }

    if (typeof value === 'object') {
      return this.formatObject(value, depth);
    }

    return String(value);
  }

  private static formatArray(arr: any[], depth: number): string {
    if (arr.length === 0) return '[]';

    // For arrays of primitives or short arrays, inline
    if (arr.length <= 3 || arr.every(item => typeof item !== 'object' || item === null)) {
      const items = arr.map(item => this.formatValue(item, depth + 1));
      return `[${items.join(', ')}]`;
    }

    // For longer or nested arrays, use multiple lines
    const indent = '  '.repeat(depth + 1);
    const items = arr.map(item => `${indent}${this.formatValue(item, depth + 1)}`);
    return `[\n${items.join(',\n')}\n${'  '.repeat(depth)}]`;
  }

  static formatObject(obj: Record<string, any>, depth: number): string {
    const entries = Object.entries(obj);

    if (entries.length === 0) return '{}';

    // For simple objects, inline
    if (entries.length <= 2 && entries.every(([_, value]) =>
      typeof value !== 'object' || value === null || (Array.isArray(value) && value.length <= 3)
    )) {
      const formatted = entries.map(([key, value]) => {
        const formattedKey = this.formatKey(key);
        const formattedValue = this.formatValue(value, depth + 1);
        return `${formattedKey}: ${formattedValue}`;
      });
      return `{ ${formatted.join(', ')} }`;
    }

    // For complex objects, use multiple lines
    const indent = '  '.repeat(depth + 1);
    const formatted = entries.map(([key, value]) => {
      const formattedKey = this.formatKey(key);
      const formattedValue = this.formatValue(value, depth + 1);
      return `${indent}${formattedKey}: ${formattedValue}`;
    });

    return `{\n${formatted.join(',\n')}\n${'  '.repeat(depth)}}`;
  }

  private static formatKey(key: string): string {
    // Check if key needs quotes
    if (this.isValidIdentifier(key)) {
      return key;
    }
    return `'${key}'`;
  }

  private static isValidIdentifier(str: string): boolean {
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str) && !this.isReservedWord(str);
  }

  // TODO: constant or some build-in way to get keywords for javascript + MVS lib
  private static isReservedWord(str: string): boolean {
    const reserved = new Set([
      'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
      'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
      'for', 'function', 'if', 'import', 'in', 'instanceof', 'new',
      'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof',
      'var', 'void', 'while', 'with', 'yield', 'let', 'static',
      'enum', 'await', 'implements', 'interface', 'package', 'private',
      'protected', 'public',
    ]);
    return reserved.has(str);
  }
}