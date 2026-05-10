/**
 * Context for code generation
 * Tracks variable names, references, and generation state
 */
export class CodeGenContext {
  private typeCounters = new Map<string, number>(); // Per-type counters
  private varMap = new Map<string, string>(); // ref → varName
  private usedVars = new Set<string>(); // Track all used variable names

  /**
   * Generate a unique variable name for a node kind
   */
  nextVar(kind: string, ref?: string): string {
    if (ref) {
      // If node has a ref, use it as variable name
      const existing = this.varMap.get(ref);
      if (existing) return existing;

      // Sanitize ref to valid JS identifier, then ensure uniqueness
      let varName = this.sanitizeVarName(ref);
      let counter = 1;
      const baseVarName = varName;
      while (this.usedVars.has(varName)) {
        varName = `${baseVarName}_${counter++}`;
      }

      this.varMap.set(ref, varName);
      this.usedVars.add(varName);
      return varName;
    }

    // Get or initialize counter for this type
    const sanitizedKind = this.sanitizeVarName(kind);
    const currentCount = this.typeCounters.get(sanitizedKind) ?? 0;

    // Generate name with per-type counter
    let varName = `${sanitizedKind}_${currentCount}`;
    let attempt = currentCount;

    // Ensure uniqueness (in case of ref conflicts)
    while (this.usedVars.has(varName)) {
      attempt++;
      varName = `${sanitizedKind}_${attempt}`;
    }

    // Update counter for this type
    this.typeCounters.set(sanitizedKind, attempt + 1);
    this.usedVars.add(varName);

    return varName;
  }

  /**
   * Sanitize a string to a valid JavaScript identifier.
   * Converts kebab-case, snake_case, and spaces to camelCase,
   * strips remaining invalid characters, and ensures it starts with a letter.
   */
  private sanitizeVarName(name: string): string {
    // Convert separators (hyphens, underscores, spaces) followed by a letter to camelCase
    let result = name.replace(/[-_\s]+([a-zA-Z])/g, (_, char) => char.toUpperCase());
    // Remove any remaining invalid identifier characters
    result = result.replace(/[^a-zA-Z0-9$_]/g, '');
    // Ensure it starts with a letter (prefix with underscore if not)
    if (!result || !/^[a-zA-Z$_]/.test(result)) {
      result = '_' + result;
    }
    return result;
  }

  /**
   * Get variable name for a ref
   */
  getVarByRef(ref: string): string | undefined {
    return this.varMap.get(ref);
  }

  /**
   * Reset context (for testing or reuse)
   */
  reset(): void {
    this.typeCounters.clear();
    this.varMap.clear();
    this.usedVars.clear();
  }
}