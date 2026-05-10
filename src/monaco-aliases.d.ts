// These specifiers are resolved by Deno's import map at build time and
// are marked external in the dist bundle. Ambient declarations prevent
// TS2307 errors when type-checking the package from outside Deno.
declare module "monaco-editor/typescript-contribution";
declare module "monaco-editor/javascript-language";
