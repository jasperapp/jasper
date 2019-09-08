export class Identifier {
  private _count: number;

  constructor() {
    this._count = 0;
  }

  getId() {
    return this._count++;
  }
}

export default new Identifier();
