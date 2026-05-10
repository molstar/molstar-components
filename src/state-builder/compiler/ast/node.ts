import type { ASTNode, ASTNodeJSON, NodeParams, CustomProps } from './types.ts';
import { MVSKind } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';


export class MVSNode<K extends MVSKind = MVSKind> implements ASTNode<K> {
  constructor(
    public readonly kind: K,
    public readonly params: NodeParams<K>,
    private readonly children: readonly MVSNode<any>[],
    public readonly ref?: string,
    public readonly custom?: CustomProps
  ) {}


  getChildren(): Array<MVSNode<any>>;
  getChildren<TKind extends MVSKind>(kind: TKind): Array<MVSNode<TKind>>;
  getChildren<TKind extends MVSKind>(
    kind?: TKind
  ): Array<MVSNode<any>> | Array<MVSNode<TKind>> {
    if (!kind) return [...this.children];
    return this.children.filter(c => c.kind === kind) as Array<MVSNode<TKind>>;
  }

  getChild<TKind extends MVSKind>(kind: TKind): MVSNode<TKind> | undefined {
    const child = this.children.find(c => c.kind === kind);
    return child as MVSNode<TKind> | undefined;
  }

  getParam(key: string): any;
  getParam<TDefault>(key: string, defaultValue: TDefault): any | TDefault;
  getParam<TDefault = undefined>(key: string, defaultValue?: TDefault): any | TDefault | undefined {
    const value = (this.params as any)[key];
    return value !== undefined ? value : defaultValue;
  }

  is<TKind extends MVSKind>(kind: TKind): this is MVSNode & { kind: TKind } {
    return this.kind === (kind as string);
  }

  isOneOf<TKind extends MVSKind>(
    ...kinds: TKind[]
  ): this is MVSNode & { kind: TKind } {
    return kinds.some(k => k === (this.kind as string));
  }

  hasChildren(): boolean {
    return this.children.length > 0;
  }

  getChildAt(index: number): MVSNode<any> | undefined {
    return this.children[index];
  }

  getChildrenCount(): number {
    return this.children.length;
  }

  toJSON(): ASTNodeJSON {
    const result: ASTNodeJSON = {
      kind: this.kind,
      params: this.params,
      children: this.children.map(c => c.toJSON()),
    };

    if (this.ref !== undefined) result.ref = this.ref;
    if (this.custom !== undefined) result.custom = this.custom;

    return result;
  }

  // Pretty print for debugging
  toString(indent: number = 0): string {
    const spaces = '  '.repeat(indent);
    const paramKeys = Object.keys(this.params as object);
    const paramStr = paramKeys.length > 0
      ? ` ${JSON.stringify(this.params)}`
      : '';
    const refStr = this.ref ? ` [ref=${this.ref}]` : '';

    let result = `${spaces}${this.kind}${paramStr}${refStr}\n`;

    for (const child of this.children) {
      result += child.toString(indent + 1);
    }

    return result;
  }
}