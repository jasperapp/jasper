# 1.0.4 (2021/05/16)
- **Fix**
  - Unexpectation moving stream and/or issue when select an issue [@778bf90](https://github.com/jasperapp/jasper/commit/778bf9097789cb20d4b3fba8d8683dbb4b9fb3c3)
  - Move to other issue with anchor link [@68c51c9](https://github.com/jasperapp/jasper/commit/68c51c9ce745c06a9f70a9175a2a5e2d4f94a1f7)

# 1.0.3 (2021/05/07)
- **Fix**
  - Mark updates by myself as read by default [#198](https://github.com/jasperapp/jasper/pull/198) Thanks [@Monchi](https://github.com/Monchi)
  - Workaround involves value on no participants issues [#199](https://github.com/jasperapp/jasper/pull/199)
  - Unexpectation moving stream when select an issue [#200](https://github.com/jasperapp/jasper/pull/200), [#201](https://github.com/jasperapp/jasper/pull/201)
  - update personal access token format [#204](https://github.com/jasperapp/jasper/pull/204) Thanks [@mt-yohei-koyama](https://github.com/mt-yohei-koyama)

# 1.0.2 (2020/10/07)
- **Fix**
  - Rate limit(v4) is null when GHE has no rate limit settings [@5ca0405](https://github.com/jasperapp/jasper/commit/5ca0405135a0b24798d91480d285487a3da5f5d7)
 
# 1.0.1 (2020/10/05)
- **Fix**
  - Migration database when filter has double-quotes.
 
# 1.0.0 (2020/10/05)
- **Feat**
  - Add Jump Navigation [#157](https://github.com/jasperapp/jasper/pull/157)
  - New Design [#158](https://github.com/jasperapp/jasper/pull/158)
  - Support draft PR, merged PR [#160](https://github.com/jasperapp/jasper/pull/160)
  - Support involves, review-requested filter [#160](https://github.com/jasperapp/jasper/pull/160)
  - Support suppress self update [#161](https://github.com/jasperapp/jasper/pull/161)
  - Support GitHub Projects [#162](https://github.com/jasperapp/jasper/pull/162), [#165](https://github.com/jasperapp/jasper/pull/165)
  - Support reviewers [#163](https://github.com/jasperapp/jasper/pull/163)
  - Support changing stream icon [#164](https://github.com/jasperapp/jasper/pull/164)
  - Support GitHub Notification Sync [#166](https://github.com/jasperapp/jasper/pull/166)
  - Support Dark Mode [#167](https://github.com/jasperapp/jasper/pull/167)
  - Auto expand API polling interval [#169](https://github.com/jasperapp/jasper/pull/169)
  - Support conflict PR [#175](https://github.com/jasperapp/jasper/pull/175)
- **Break**
  - Remove import CSS theme feature.
- **Internal**
  - Change architecture what use stream in renderer process. [#146](https://github.com/jasperapp/jasper/pull/146)
  - Refactor repositories. [#149](https://github.com/jasperapp/jasper/pull/149)
  - Refactor fragment. [#150](https://github.com/jasperapp/jasper/pull/150)
  - Refactor pref and db. [#153](https://github.com/jasperapp/jasper/pull/153)
  - Refactor stream. [#154](https://github.com/jasperapp/jasper/pull/154)
  - Update to Electron v10

# 0.9.3 (2020/07/12)
- **Feat**
  - Support to automatically load cookie from BrowserWindow. [#140](https://github.com/jasperapp/jasper/pull/140)
- **Fix**
  - Fix scroll position indicator. [@7ef530a](https://github.com/jasperapp/jasper/commit/7ef530a520ef0d2e5488b067cc999707893998cd)
  - Fix edited comments highlight. [@f36a4ba](https://github.com/jasperapp/jasper/commit/f36a4baf0c0786c222718d419aff9f5afa4121ec)
- **Break**
  - Remove `experimental cookie support`. [#140](https://github.com/jasperapp/jasper/pull/140)

# 0.9.2 (2020/07/08)
- **Feat**
  - Support `Domain` directive of cookie. [@cf70140](https://github.com/jasperapp/jasper/commit/cf7014094e75908c6a6cd08135320f5638d2b89d)
- **Fix**
  - Fix the crash bug if window state file doesn't exist yet. [@d279742](https://github.com/jasperapp/jasper/commit/d2797421445c73a97f74cb1a896085b7031db7fa)

# 0.9.1 (2020/07/05)
- **Feat**
  - Auto select URL when click address bar. [#135](https://github.com/jasperapp/jasper/pull/135) Thanks [mtgto](https://github.com/mtgto)
  - Display scroll position at comment-minimap [@82abc66](https://github.com/jasperapp/jasper/commit/82abc669b9e6e29482274673e5801a9ae57955ff)
  - [Experimental] Support cookie [#138](https://github.com/jasperapp/jasper/pull/138)
- **Fix**
  - Fix broken searching with team name. [#134](https://github.com/jasperapp/jasper/pull/134) Thanks [mtgto](https://github.com/mtgto)
  - Fix handling outdated comments and editing comments on GHE [@c9b0ef0](https://github.com/jasperapp/jasper/commit/c9b0ef0917579be293176b5c1c8e9f1104124f05)

# 0.9.0 (2020/06/27)
- **Feat**
  - Resizeable streams pane and issues pane [#126](https://github.com/jasperapp/jasper/pull/126) Thanks [knzm](https://github.com/knzm)
  - Display minimap for new comments [#131](https://github.com/jasperapp/jasper/pull/131)
  - Restore the previous window state(size/pos) [#121](https://github.com/jasperapp/jasper/pull/121) Thanks [ticky](https://github.com/ticky)
  - Run sqlite vacuum [@699fc94](https://github.com/jasperapp/jasper/commit/699fc94d7a3ac55510791a33ab686b66414f1fe9)
- **Fix**
  - Display diff body comment [@b23ea2b](https://github.com/jasperapp/jasper/commit/b23ea2b0b7988a2af0611c13761addcede105320)
  - Suppress notification when add/update comment on Jasper [@211bf7f](https://github.com/jasperapp/jasper/commit/211bf7fd5fc36e58ccfa2c9d3f700b7a52484e5a)
- **Remove**
  - Remove `always open outdated` [#132](https://github.com/jasperapp/jasper/pull/132)
- **Internal**
  - Update to Electron v9 [#130](https://github.com/jasperapp/jasper/pull/130)
  - Update to Sqlite v4.1.1 [#127](https://github.com/jasperapp/jasper/pull/127) Thanks [mtgto](https://github.com/mtgto)
  - Support CSP [#124](https://github.com/jasperapp/jasper/pull/124)

# 0.8.0 (2019/9/15)
- **Fix**
  - Fix broken layout on github.com [@b3d0f9f](https://github.com/jasperapp/jasper/commit/b3d0f9ffe119f214e23b5aa6a85548beba85d9ae)
- **Feat**
  - Always enable dev menu [#116](https://github.com/jasperapp/jasper/pull/116)

# 0.8.0-beta.5 (2019/09/08)
- **Internal**
  - Introduce TypeScript [#114](https://github.com/jasperapp/jasper/pull/114)
  - Remove ESDoc [#115](https://github.com/jasperapp/jasper/pull/115)

# 0.8.0-beta.4 (2019/09/04)
- **Internal**
  - Notarize and hardened on Mac [#111](https://github.com/jasperapp/jasper/pull/111)

# 0.8.0-beta.3 (2019/09/02)
- **Fix**
  - Regression: broken to load themes [#104](https://github.com/jasperapp/jasper/pull/104)

# 0.8.0-beta.2 (2019/09/01)
- **Fix**
  - Prevent enable keyboard shortcut when typing comments [#94](https://github.com/jasperapp/jasper/pull/94)
  - Broken unread issues count of streams [#08bcf5c](https://github.com/jasperapp/jasper/commit/08bcf5c9971a094c34d97ae593898fa1ea04029e)
- **Internal**
  - Update Electron to v6 [#98](https://github.com/jasperapp/jasper/pull/98)
  - Not use app-sandbox on Mac [#101](https://github.com/jasperapp/jasper/pull/101)

# 0.7.2 (2019/03/21)
- **Fix**
  - Fix broken layout at GHE. [@76a68f2](https://github.com/jasperapp/jasper/commit/76a68f2750ecdd8459f74dccc44085d94ad32c3b)
  - Fix broken team mention name. [@1b2c4c2](https://github.com/jasperapp/jasper/commit/1b2c4c2e23c913185df8efd55dcbf626574b1b93)

# 0.7.1 (2019/03/21)
- **Fix**
  - Fix broken layout. [#85](https://github.com/jasperapp/jasper/pull/85)
  
# 0.7.0 (2019/02/12)
- **Internal**
  - Update Electron ([#71](https://github.com/jasperapp/jasper/pull/71) Thanks [Watson1978](https://github.com/Watson1978))

# 0.6.1-beta.1 (2018/09/02)
- **Fix**
  - Fix WatchingStream if we have many watching repositories ([#65](https://github.com/jasperapp/jasper/pull/65) Thanks [@pocke](https://github.com/pocke))
  - Fix not open outdated comment ([@a86f0f9](https://github.com/jasperapp/jasper/commit/a86f0f99433433176808a3dd7f694d3b5475fd03))
  - Fix display description diff ([@2cb49e6](https://github.com/jasperapp/jasper/commit/2cb49e6400ca381b2cc6dc4181a4fe295ed67846))
  - Fix copy/cut/paste text in browser ([@4e7388e](https://github.com/jasperapp/jasper/commit/4e7388e9e35c065183a806608eb33508a97c3cdd))
- **Internal**
  - Update Electron ([#67](https://github.com/jasperapp/jasper/pull/67) Thanks [Watson1978](https://github.com/Watson1978))
  - Update packages ([@78159f7](https://github.com/jasperapp/jasper/commit/78159f783736bf4a64556272e6f0ee58e6dc431c))

# 0.6.0 (2018/07/14)
- **Feat**
  - Jasper is now free
- **Fix**
  - Fix that stream stopped at unexpected timing
  - Change initial loading issue count (1000 to 100)
- **Internal**
  - Update Electron to v1.8.7
  - Use BrowserView instead of WebView

# 0.5.0 (2018/01/27)
- **Fix**
  - A version number in user-agent
  - A default path prefix of GitHub API
  - Toggle buttons clickable region [#48](https://github.com/jasperapp/jasper/issues/48)
- **Internal**
  - Update Electron to v1.7.11 from v1.6.11(includes security fix [CVE-2018-1000006](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2018-1000006))

# 0.4.0 (2017/08/20)
- **Feat**
  - Support multi account
  - Support multi query at a stream
  - Display a difference of issue body
  - Preference for always open external URL in external browser
  - Save and load streams
  - Support custom UI themes with CSS
  - Improve a performance of displaying un-read count
- **Fix**
  - Using GitHub Enterprise with HTTP
  - Accented letter input
- **Internal**
  - Update Electron to v1.6.11

# 0.3.1 (2017/05/08)
- **Fix**
  - Notify review comment of pull-requests on GHE

# 0.3.0 (2017/04/22)
- **Feature**
  - Create filter for any streams (like as a view of SQL)
  - Filter text in body, repo, author, etc
- **Fix**
  - Broken streams list when right click it ([#14](https://github.com/jasperapp/jasper/issues/14))
  - Suppress notification of self updating
  - Search word in issue on Linux ([#36](https://github.com/jasperapp/jasper/issues/36))

# 0.2.5 (2017/03/13)
- **Fix**
  - Fix a input delaying when post a comment
  - Suppress notification from self posting.
  - Broken J/K moving ([#28](https://github.com/jasperapp/jasper/issues/28))
- **Internal**
  - Update Electron to v1.6.1

# 0.2.4 (2017/01/28)
- **Feat**
  - Support some keyboard shortcuts.
  - Support to read filtered all issues.
  - \[experimental\] Notify review comment of pull-requests.
  - Show a issue number.
- **Fix**
  - Broken handling uppercase/lowercase of label, assignee and milestone. ([#25](https://github.com/jasperapp/jasper/issues/25))
  - Can restart all streams that is workaround of stopping streams. ([#21](https://github.com/jasperapp/jasper/issues/21))
  - Broken zoom
  - Limited width of page when watching split-diff.
- **Internal**
  - Update Electron to v1.4.13

# 0.2.3 (2016/11/21)
- **Fix**
  - Can not load the issue via clicking notification

# 0.2.2 (2016/11/19)
- **Feat**
  - Immediately respond to clicking a issue
- **Fix**
  - Crash when read old issues that does not have multi assignee
  - Display `generate token` link at setup view
  - Handle 404 if we click issues without signed-in
  - Crash when clear all data on Windows
  - Crash when open selecting dialog
- **Internal**
  - Update Electron to v1.4.6

# 0.2.1 (2016/11/13)
- **Feat**
  - Support open external browser with cmd + click
  - Display labels, milestone and comment counts in issues pane ([#5](https://github.com/h13i32maru/jasper/issues/5))
  - Filter issues when click attributes of a issue
    - Clickable attributes are label, milestone, org, repo, author, assignee, opened/closed, and comment
  - Add clear-filter-button
  - Support exclusion filter ([#6](https://github.com/h13i32maru/jasper/issues/6))
  - Support preferences of always open outdated comments
  - Support new review style comment
- **Fix**
  - Broken stream labels when sort those ([#14](https://github.com/jasperapp/jasper/issues/14))
  - Reset the filter when click a stream
  - A stream including `is:open` does not update closed issues

# 0.2.0 (2016/10/22)

🙏 Important notice for paid users (English)

The Jasper requires a license key. The users need to migrate to new app from old app.

- A) Paid at Gumroad
  - 1. Confirm received email from h13i32maru@gmail.com that reference to the license.
  - 2. Please gets license key with written the way in the email.
  - 3. Download new Jasper and register the license key.
- B) Paid at Mac App Store
  - 1. Please send the screen-shot of Mac App Store Purchased tab(including Jasper icon) to [h13i32maru+jasper_license@gmail.com](mailto:h13i32maru+jasper_license@gmail.com)
  - 2. Please gets license key with written the way on reply.
  - 3. Download new Jasper and register the license key.

If you have any questions, please contact h13i32maru@gmail.com.  
Thanks using Jasper.


🙏 購入済みユーザ様への重要なお知らせ(日本語)

Jasperを使用するためにはライセンスキーが必要となりました。 古いアプリを購入済みのユーザ様は新しいアプリへの移行が必要となります。

- A) Gumroadで購入した場合
  - 1. ライセンスに関するメールがh13i32maru@gmail.comから届いていることをご確認ください
  - 2. そのメールに書かれた手順でライセンスキーの取得を行ってください
  - 3. 新しいJasperをダウンロードし、ライセンスキーをJasperに登録してください
- B) Mac App Storeで購入した場合
  - 1. Mac App Storeの購入済みタブのスクリーンショット(Jasperのアイコンを含む)を[h13i32maru+jasper_license@gmail.com](mailto:h13i32maru+jasper_license@gmail.com)まで送信してください
  - 2. 返信されたメールに書かれた手順でライセンスキーの取得を行ってください
  - 3. 新しいJasperをダウンロードし、ライセンスキーを登録してください

ご不明な点がればh13i32maru@gmail.comまでご連絡ください。  
Jasperをご利用いただきありがとうございます。

- **Feat**
  - Support Linux
  - Support screen zoom +/- ([#8](https://github.com/jasperapp/jasper/issues/8))
  - Create a PR stream when initialize
- **Fix**
  - Can not immediately quit
  - Freeze when selecting item link clicked ([#19](https://github.com/jasperapp/jasper/issues/19))
  - Crash if you try to open a file ([#17](https://github.com/jasperapp/jasper/issues/17))
  - Broken style of built-in browser
- **Internal**
  - Update Electron to v1.4.2

# 0.1.2 (2016/06/19)
- **Feat**
  - Support HTTP for GitHub Enterprise
  - Display unread count in Dock's badge (Mac only) ([#6](https://github.com/jasperapp/jasper/issues/6))
- **Fix**
  - Text input is little frozen at issue text area
  - Prevent loading external web page ([#4](https://github.com/jasperapp/jasper/issues/4))
  - Disable notification of archived issues
- **Internal**
  - Update Electron to v1.2.2

# 0.1.1 (2016/06/07)
First Release!
