class _Identifier {
  private _count: number;

  constructor() {
    this._count = 0;
  }

  getId() {
    return this._count++;
  }
}

export const Identifier = new _Identifier();
