# 全体
Jasperのコアアーキテクチャは`一定間隔でGitHub APIにアクセスし、IssueやPullRequestを取得する。それをローカルのデータベースに蓄積し、そのデータベースを表示したり操作するUIを提供している。`である。


主要なコンポーネントとその関係は以下の通りである。Mainプロセス・Rendererプロセス・IPCについては[Electronのプロセスモデル](https://www.electronjs.org/docs/tutorial/quick-start#learning-the-basics)を参照。

<img src="https://raw.githubusercontent.com/jasperapp/jasper/master/architecture.png"/>

[画像の元ファイル](https://docs.google.com/drawings/d/1t0_N30f3oE0diRzwjY-MQMo2zFmkrTOlbkXIcBdlmso/edit)

- Fragment(UI)
  - Issueの更新通知、DBに保存されているIssueを表示したり、Streamの作成などを行うUIを提供
- Stream
  - Issueの検索クエリを使ってGitHub APIから最新のIssueを取得する
- ポーリング
  - 全Streamの定期実行を行う
- Event
  - コンポーネント間のイベント送受信の機能を提供
- Repository
  - DBを操作する機能を提供
- BrowserView
  - 外部のWebページを表示するための内部ブラウザ
- DB
  - IssueやStreamの情報を保存するストレージ
- 各種IPC
  - Mainプロセス側に存在するコンポーネントをRendererプロセスから制御するための仕組みを提供

# Fragment(UI)
[/Renderer/Fragment](https://github.com/jasperapp/jasper/tree/master/src/Renderer/Fragment)

Issueの更新通知、DBに保存されているIssueを表示したり、Streamの作成などを行うUIを提供

主に以下のようなUIを提供している。
- Issueの更新通知
- Issue一覧の表示
- Issueの未読・既読・アーカイブ
- 組み込みブラウザによるIssueの表示
- Streamの表示・作成・更新・削除

DOM構築・状態管理はReact(Class)、スタイルはstyled-componentsを使用している。
既存のUIライブラリは使用しておらず、ほぼ自前実装となっている。汎用的なUIパーツは`View`としてまとめてある。

`Fragment`の分割はユーザが一つの塊として認識する単位を基本としているが、まだ明確な規約はない。
`Fragment`と`View`の切り分けは汎用的に使い回すものは`View`としているが、こちらもまだ明確な規約はない。

`Fragment`間のイベント送受信は`Event`(後述)によって行われる。いわゆるpub/sub方式である。

# Stream
[/Renderer/Repository/Polling/StreamClient](https://github.com/jasperapp/jasper/tree/master/src/Renderer/Repository/Polling/StreamClient)

Issueの検索クエリを使ってGitHub APIから最新のIssueを取得する。

GitHub APIはv4(GraphQL)を使用している。以前はv3(REST)とv4(GraphQL)の両方を使用していたが、GitHub REST APIが非推奨になったため、2024年5月にGraphQL APIのみを使用するように移行した。

GitHub APIのRate Limitにも対応しているため、通信しすぎるということはない。また、Streamには検索クエリ以外にも最終検索時刻、通知ON/OFF、名前などを保持している。

# ポーリング
[/Renderer/Repository/Polling/StreamPolling.ts](https://github.com/jasperapp/jasper/blob/master/src/Renderer/Repository/Polling/StreamPolling.ts)

全`Stream`の定期実行を行う。

システムで1つの`ポーリング`のみが存在しており、全`Stream`はすべてその`ポーリング`からのみ実行される。
そして`ポーリング`は各`Stream`をキューで管理しているため、`Stream`が増えてもシステム全体からみて`Stream`の実行頻度は一定である。逆にいうと、`Stream`が増えれば増えるほど、`Stream`1つあたりの実行間隔は大きくなる。

例えば`ポーリング`の実行間隔が10秒の場合、`Stream`が2個なら各`Stream`は20秒に1回実行される。`Stream`が6個なら各`Stream`は60秒に1回実行される。
これは`Stream`の数が増えても、GitHub APIへのアクセス頻度が増えないようにし、GitHub側の負荷やRate Limitを考慮してである。

`ポーリング`のキューは優先度付きキューである。新規作成された`Stream`、更新された`Stream`は通常よりも高い優先度でキューに入る。これはユーザに即座にIssueを表示するためである。

# Event
[/Renderer/Event](https://github.com/jasperapp/jasper/tree/master/src/Renderer/Event)

コンポーネント間のイベント送受信の機能を提供

イベントの送受信に関してはすべて`Event`を使用する。これは各コンポーネントが直接他のコンポーネントを参照してイベントの送受信を行うと、イベントの追跡が難しくなり複雑性が増すためである。

主に以下のイベント操作に使われている
- ユーザの操作によりUIやデータの状態が変わったことを他のUIに伝える
- ポーリングによりローカルDBのIssueの状態が変わったことをUIに伝える

また、イベントが実行されている間に、同一のイベントを実行しようとした場合、そのイベントはキャンセルされる。これはイベントの無限ループを回避するためである。

# Repository
[/Renderer/Repository](https://github.com/jasperapp/jasper/tree/master/src/Renderer/Repository)

DBを操作する機能を提供

DBに対する操作は基本的には`Repository`を使用する。これはDBを操作するための具体的なSQLを隠蔽して、外部からは通常の関数のように使えるようにするためである。こうすることで具体的なテーブルやカラムを意識しなくてすみ、変更に強くなる。

DBはMainプロセスにあるため、`Repository`からは`IPC`(後述)を通してDBを操作している。

# BrowserView
[/Main/Bind/BrowserViewBind.ts](https://github.com/jasperapp/jasper/blob/master/src/Main/Bind/BrowserViewBind.ts)

外部のWebページを表示するための内部ブラウザ。

主にIssueのWebページを表示するために使用している。Mainプロセス側に存在するのでRendererプロセス側からは`IPC`(後述)でURLや表示位置の制御を行っている。

# DB
[/Main/Bind/SQLiteBind.ts](https://github.com/jasperapp/jasper/blob/master/src/Main/Bind/SQLiteBind.ts)

IssueやStreamの情報を保存するストレージ。

DBにはIssue、Stream、フィルター履歴などのデータを保持している。実装としてはSQLite(ネイティブモジュール)を使用している。Electronではネイティブモジュールを使用する場合、基本的にはMainプロセスで実行することになる。そのため、DBへのアクセスは`IPC`を通すことになっている。また、JasperではGitHubのアカウント切り替えを行うことができるが、1アカウントに付き1DBを持つ構成となっている。

# 各種IPC
[/IPC](https://github.com/jasperapp/jasper/tree/master/src/IPC)

Mainプロセス側に存在するコンポーネントをRendererプロセスから制御するための仕組みを提供。

コンポーネントごとに`IPC`を個別に実装する。RemoteやRendererプロセスでのインポートはパフォーマンスとセキュリティの観点で使用しない。

# FAQ
- ポーリングをRendererプロセスで実施しているのはどうして？
  - なるべくMainプロセス・Rendererプロセス間の通信をなくすため
  - IPCが多くなるほど複雑になり、パフォーマンスにも影響してくる
  - 参考 https://medium.com/@nornagon/electrons-remote-module-considered-harmful-70d69500f31
- DBをRemoteやRenderer importで使わないのはなぜ？
  - Remoteで使うと便利だがパフォーマンスが極端に悪くなるため（数百ミリ秒の差が出る）
  - ネイティブモジュールのRenderer importはセキュリティの観点でデフォルト無効となるため
- 1アカウント1DBなのはなぜ？
  - Jasperを作り始めたころはマルチアカウントに対応しておらず、その後に追加で実装したため
  - 作り直すなら各テーブルにユーザIDカラムをもうけて1DBで実装すると思う
- 以前はGitHub API v3とv4の両方を使っていたが、現在はv4のみを使用しているのはなぜ？
  - 2024年5月に GitHub REST API(v3)が非推奨となったため、GraphQL API(v4)のみを使用するように移行した
  - v4 APIでは、v3で取得できていた全ての情報に加えて、より詳細な情報も取得できるようになっている
- ○○ライブラリを使っていないのはなぜ？
  - なるべく外部ライブラリに依存したくないという意見を持っているため
  - セキュリティに関わる部分や大幅に実装が楽になる部分は使用する
- React Hooksを使っていないのはなぜ？
  - Jasperを作り始めたころにはまだなかったため
  - 移行する予定は今のところは未定
- テストが無いのはなぜ？
  - 完全に怠けているだけなので将来的にはなんとかしたい
