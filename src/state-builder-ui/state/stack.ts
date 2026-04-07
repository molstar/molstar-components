const STACK_SIZE_LIMIT = 50;

export class Stack<T> {
  private _internal: T[];

  constructor(initial: T[] = []) {
    this._internal = [...initial];
  }

  public push(item: T) {
    if (this.length >= STACK_SIZE_LIMIT) {
      this._internal.shift();
    }
    this._internal.push(item);
  }

  public pop(): T | undefined {
    return this._internal.pop();
  }

  public clear() {
    this._internal = [];
  }

  public get length(): number {
    return this._internal.length;
  }

  public get isEmpty(): boolean {
    return this._internal.length === 0;
  }

  public get top(): T | undefined {
    return this._internal[this.length - 1];
  }

  /** Returns a shallow copy of the internal items (bottom → top order). */
  public get items(): T[] {
    return [...this._internal];
  }
}
