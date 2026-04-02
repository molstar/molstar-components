import { MVSKind, MVSSubtree } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';
import { ParamsOfKind } from 'molstar/lib/extensions/mvs/tree/generic/tree-schema';

// Type-safe params using MVS schema definitions
export type NodeParams<K extends MVSKind = MVSKind> = K extends MVSKind
  ? ParamsOfKind<MVSSubtree, K>
  : never;

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonArray
  | JsonObject;

export interface JsonObject {
  [key: string]: JsonValue;
}

export interface JsonArray extends Array<JsonValue> {}

export type CustomProps = JsonObject;

// special representation for JSON (debug) as children is private property for actual tree
export interface ASTNodeJSON<K extends MVSKind = MVSKind> {
  kind: K;
  params: NodeParams<K>;
  children: ASTNodeJSON[];
  ref?: string;
  custom?: CustomProps;
}

export interface ASTNode<K extends MVSKind = MVSKind> {
  readonly kind: K;
  readonly params: NodeParams<K>;
  readonly ref?: string;
  readonly custom?: CustomProps;

  getChildren(): Array<ASTNode>;
  getChildren<TKind extends MVSKind>(kind: TKind): Array<ASTNode & { kind: TKind }>;

  getChild<TKind extends MVSKind>(kind: TKind): (ASTNode & { kind: TKind }) | undefined;

  getParam(key: string): any;
  getParam<TDefault>(key: string, defaultValue: TDefault): any | TDefault;

  is<TKind extends MVSKind>(kind: TKind): this is ASTNode & { kind: TKind };

  isOneOf<TKind extends MVSKind>(...kinds: TKind[]): this is ASTNode & { kind: TKind };

  hasChildren(): boolean;

  getChildAt(index: number): ASTNode | undefined;

  getChildrenCount(): number;

  toJSON(): ASTNodeJSON;

  toString(indent?: number): string;
}

export interface AST {
  root: ASTNode<'root'>;
  metadata: {
    // title?: string;
    // description?: string;
    // description_format?: 'markdown' | 'plaintext';
    timestamp: string;
    // version: string;
  };
}

export class ASTError extends Error {
  constructor(
    message: string,
    public readonly node?: unknown,
    public readonly path?: string[]
  ) {
    super(message);
    this.name = 'ASTError';
  }
}