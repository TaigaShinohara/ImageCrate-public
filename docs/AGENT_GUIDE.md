# AGENT_GUIDE — ImageCrate

AI エージェント向けの使い方メモ。このファイルが、このアプリを機械から使うときの正本である。

## アプリの目的（1行）

Web ページの画像を確認し、必要なものだけを選んで一括保存するブラウザ拡張機能（Chrome 116+ / MV3、外部依存ゼロ）。

## 到達レベル

- レベル: **L2（操作可能）** — ただし範囲はパッケージ／リポジトリ表面と CLI 専用状態に限る
- 読み取り: 可（パッケージ、manifest、権限、カタログ、CLI 状態）。ブラウザ内の実データ（候補・選択・保存ジョブ）は不可
- 操作: 可（CLI 専用状態の保存設定プロファイル、検証、計画）。ブラウザ内の実操作は画面案内（B）か人間専用（C）
- 検証: 可（`verify`、既存の `npm test` / `npm run check`）

正直な線引き: 実データは `chrome.storage.session` の中にある。CLI が「ブラウザ内の画像候補を操作できる」とは書かない。操作の全体像と分類は `docs/AGENT_OPERATIONS.md`、監査は `docs/AGENT_AUDIT.md` を参照。

## 最初に読むもの

- 機械可読な目録: `docs/agent-manifest.json`
- 操作カタログ: `docs/AGENT_OPERATIONS.md`
- スキーマ版数: 1
- CLI の入口: `npm run agent -- <command>`（実体は `scripts/agent-cli.mjs`）。CLI の状態は `.agent/`（git 管理外）に置く。場所は `--state-dir` か環境変数 `IMAGECRATE_AGENT_STATE_DIR` で変えられる

## コマンド一覧

| コマンド | 種別 | 説明 | 例 |
|---|---|---|---|
| `status --json` | 読み取り | 版数・権限の有無・到達範囲 | `npm run agent -- status --json` |
| `list operations --json` | 読み取り | 操作カタログの一覧（安定 ID と分類） | `npm run agent -- list operations --json` |
| `list permissions --json` | 読み取り | manifest の権限一覧 | `npm run agent -- list permissions --json` |
| `list profiles --json` | 読み取り | CLI 保存設定プロファイルの一覧 | `npm run agent -- list profiles --json` |
| `get operation <id> --json` | 読み取り | 操作 1 件の詳細 | `npm run agent -- get operation op.plan-settings --json` |
| `get permission <id> --json` | 読み取り | 権限 1 件の詳細 | `npm run agent -- get permission activeTab --json` |
| `get profile <id> --json` | 読み取り | プロファイル 1 件 | `npm run agent -- get profile prof_... --json` |
| `plan settings --settings '<json>' --json` | 読み取り（ドライラン） | GUI と同じ芯で保存設定を正規化し、保存先ラベルと作業ページ要否を返す。何も書き込まない | `npm run agent -- plan settings --settings '{"destination":"zip","format":"png"}' --json` |
| `create profile --name <n> --settings '<json>'` | 書き込み | プロファイル作成（冪等キー対応） | `npm run agent -- create profile --name blog --settings '{"destination":"downloads"}' --idempotency-key k1 --json` |
| `update profile <id> [--name][--settings]` | 書き込み | プロファイル変更（冪等キー対応） | `npm run agent -- update profile prof_... --settings '{"format":"webp"}' --json` |
| `delete profile <id> --yes` | 書き込み（破壊的） | プロファイル削除。`--yes` 必須（`--dry-run` 可） | `npm run agent -- delete profile prof_... --yes --json` |
| `history --json` | 読み取り | CLI 実行履歴（成功・失敗・エラーコード） | `npm run agent -- history --limit 20 --json` |
| `doctor --json` | 読み取り | 前提条件と到達できない表面の一覧 | `npm run agent -- doctor --json` |
| `verify --json` | 読み取り | 静的チェック・目録整合・芯の往復・data-testid 件数の自己点検 | `npm run agent -- verify --json` |

共通フラグ: `--json`（既定）/ `--human` / `--dry-run` / `--yes` / `--idempotency-key <key>` / `--timeout <sec>`（verify の子プロセス用）/ `--state-dir <dir>`。対応しない使い方は黙って無視せずエラーにする。

画面検証用の安定セレクタ: 作業ページの主要要素に `data-testid` を付与済み（`rescan-button`、`image-grid`、`save-button`、`save-settings-open`、`save-settings-apply`、`choose-directory-button` など 14 件）。

## MCP

- MCP 未対応。CLI を使うこと。L2/L3 が安定したら、ツール定義は CLI のスキーマから生成して被せる（二重管理しない）。今回は入れない判断を `docs/AGENT_AUDIT.md` に記録した。

## SDK

- SDK 未対応。JSON スキーマ（本ガイドと目録）と CLI を使うこと。作らないのが既定で、再利用需要も外部公開方針も無いため。

## 典型フロー

### 1. 状態を確認してから使う

```
npm run agent -- status --json
npm run agent -- list operations --json
npm run agent -- get operation op.plan-settings --json
```

### 2. 変更する（必ずドライラン first）

```
npm run agent -- plan settings --settings '{"destination":"zip","format":"png"}' --json
npm run agent -- create profile --name blog --settings '{"destination":"zip","format":"png"}' --dry-run --json
npm run agent -- create profile --name blog --settings '{"destination":"zip","format":"png"}' --idempotency-key blog-1 --json
npm run agent -- verify --json
```

注意: プロファイルは実設定の「準備物」である。ブラウザの実保存設定へ反映するのは人間の GUI 操作（保存設定ダイアログで「設定を適用」）だけ。

### 3. 失敗したときに調べる

```
npm run agent -- history --limit 20 --json
npm run agent -- doctor --json
```

## 入出力スキーマ

- 成功: `{"ok": true, "data": ..., "meta": {"schema_version": 1, "request_id": "..."}}`
- 失敗: `{"ok": false, "error": {"code": "...", "message": "...", "retryable": false, "details": {...}}}`
- 終了コード: 0 成功 / 1 入力誤り / 2 アプリ側失敗 / 3 権限不足 / 4 対象なし
- ID: プロファイルは `prof_<UUID>`（再利用しない）。操作 ID は `op.*` の安定文字列。権限 ID は manifest の権限名そのもの
- 日時: ISO 8601（UTC）
- 秘密情報: このアプリは API キー等を持たない。`status` は権限の有無だけを返し、値は返さない。候補 URL（認証用 query を含み得る）は CLI では扱わない

## エラーコード表

| コード | 意味 | 再試行 | 対処 |
|---|---|---|---|
| `unknown_command` | コマンドが無い | 不可 | `agent --help` で一覧を見る |
| `invalid_arguments` | 引数・フラグの誤り | 不可 | `agent <command> --help` で使い方を見る |
| `invalid_settings_json` | 設定 JSON が不正 | 不可 | JSON オブジェクトで渡す |
| `confirmation_required` | 破壊的操作に `--yes` が無い | 不可 | `--yes` を付けるか `--dry-run` で確認する |
| `idempotency_conflict` | 同じ冪等キーを異なる内容で再利用 | 不可 | 新しいキーを発行する |
| `not_found` | 対象が無い（終了コード 4） | 不可 | ID を確認する |
| `verify_failed` | 自己点検が不合格（終了コード 2） | 不可 | `details.checks` の不合格項目を直す |
| `app_failure` | アプリ側の失敗（終了コード 2） | 可の場合あり | `history` と `doctor` で切り分ける |

## 人間専用操作

| 操作 | 理由 | 人間が行う手順 |
|---|---|---|
| 配信元へのアクセス許可（op.grant-origin） | Chrome の権限ダイアログは利用者の実操作が必須。権限モデルは都度許可型で確定済み | 作業ページで配信元ごとの表示ボタンを押し、Chrome のダイアログで許可する |
| 保存フォルダの選択（op.pick-folder） | OS のピッカーは保存先に対する本人の選択そのもの | 保存設定の「フォルダを選ぶ」から OS のピッカーで選ぶ |
| OS 共有シート（op.share-sheet） | 端末の利用者の対話領域 | ZIP 保存後に共有シートで送り先を選ぶ |
| 権限の取消（op.revoke-permission） | 拡張 API に自分の権限を取り消す経路が無い | Chrome の拡張機能設定でサイトアクセスを取り消す |
| ストア提出（op.store-submit） | 提出・支払い・規約同意は本人の明示承認事項 | Developer Dashboard で本人が行う |

画面まで案内する操作（スキャン、プレビュー、選択、保存、再試行、実設定の適用、オンボーディング）は `docs/AGENT_OPERATIONS.md` の B 分類を参照。作業ページの対象要素は `data-testid` で特定できる。

## やってはいけない操作

- ブラウザ内の実データ（候補 URL、選択、保存ジョブ）を CLI や外部経路で読み書きしようとしない。存在しない経路を偽装しない。
- 権限モデルを変えない。広い host 権限・Cookie・debugger・webRequest を追加しない（本人決定で都度許可型が確定済み）。
- `.agent/` の状態を本番データと呼ばない。プロファイルは実設定の準備物である。
- 実設定の適用、許可ダイアログ、OS ピッカーを自動化したことにしない。人間の体験は自動テストで確認済みにしない。
- ストア提出・公開をこのガイドの手順として実行しない。
