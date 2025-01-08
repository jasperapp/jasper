  // close
  async close(): Promise<void> {
    return this.invoke<void>(ChannelNames.close);
  }

  onClose(handler: () => Promise<void>) {
    this.handle(ChannelNames.close, handler);
  }

  // create table
  async createTable(tableName: string, columns: SQLColumns<any>[]): Promise<void> {
    return this.invoke<void>(ChannelNames.createTable, { tableName, columns });
  }

  onCreateTable(handler: (_ev, tableName: string, columns: SQLColumns<any>[]) => Promise<void>) {
    this.handle(ChannelNames.createTable, handler);
  }

  // drop table
  async// close
  async close(): Promise<void> {
    return this.invoke<void>(ChannelNames.close);
  }

  onClose(handler: () => Promise<void>) {
    this.handle(ChannelNames.close, handler);
  }

  // create table
  async createTable(tableName: string, columns: SQLColumns<any>[]): Promise<void> {
    return this.invoke<void>(ChannelNames.createTable, { tableName, columns });
  }

  onCreateTable(handler: (_ev, tableName: string, columns: SQLColumns<any>[]) => Promise<void>) {
    this.handle(ChannelNames.createTable, handler);
  }

  // drop table
  async