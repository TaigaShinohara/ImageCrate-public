# Agent-Friendly 監査 — ImageCrate（2026-11-24）

スキル `agent_friendly_app_design` のチェックリスト様式で記録する。対象はこのリポジトリの ImageCrate v0.1.0（Chrome 116+ / MV3、ビルドなし構成）。

## 判定

- **現在レベル: L0（GUI のみ）**
- **目標レベル: L2（操作可能）** — スキルの既定どおり。ただし到達範囲は正直に区切る（下記「到達範囲の線引き」）。
- 根拠: 監査時点で外部から触れる経路（CLI・API・ファイル受け渡し）が皆無で、状態も結果も作業ページの画面でしか分からなかったため L0。純粋関数として分離された芯（`extension/utils.js` の保存設定正規化、`session-state.js`、`gallery.js` 等）が既にあり、GUI と同じ芯を CLI から共有できる土台はあった。

## 1. 監査（現状把握）

| 項目 | 判定 | 記録 |
|---|---|---|
| データの保存場所と形式 | 済 | ブラウザ内のみ。候補・選択・保存ジョブ・履歴は `chrome.storage.session`（作業タブ単位、ブラウザ終了で消去）。適用済み保存先とフォルダ参照は IndexedDB。オンボーディング状態は `localStorage`。ページ URL・画像 URL を永続設定へ保存しない設計。リポジトリ側にアプリデータのファイルは無い |
| 業務ロジックの UI 分離 | 済 | 保存設定の正規化・保存先ラベル・権限 origin 計算は `extension/utils.js` の純粋関数。候補の絞り込み・統合は `utils.js` / `gallery.js`。状態遷移は `session-state.js`。UI 描画は `workspace.js` / `gallery.js` の表示層。CLI はこの芯（特に `saveSettings` / `destinationLabel` / `requiresWorkspace`）を直接 import して共有する |
| 外部から触れる経路 | 未→済 | 監査時点では無し（`externally_connectable` も無し、`scripts/check.mjs` が保証）。今回、開発・検証用の Node CLI `scripts/agent-cli.mjs`（`npm run agent`）を新設。拡張本体の外部接続は追加していない |
| ID の安定性 | 一部未 | 保存ジョブは session 内で安定した `logicalJobId` を持つ。候補の同一性は URL（再スキャンで統合、並び順では変わらない）。ただしブラウザ session をまたぐ永続 ID は設計上存在しない。CLI 側の保存設定プロファイルには再利用しない UUID を新規発行する |
| 実行履歴と失敗理由 | ブラウザ内のみ | 保存の完了・中断は作業ページと session 記録で確認できるが、外部から読めない。CLI は自らの実行履歴を `.agent/history.jsonl` に残し `history` で読める（CLI の範囲に限る、と明示） |
| テスト基盤 | 済 | `npm test`（node --test、監査時点で 362 件全合格）、`npm run check`（manifest・権限・参照・構文）、隔離 Chrome の browser/ux/security/compat スイート。画面検証は合成ページ＋実 Chrome |
| 安定セレクタ（data-testid） | 未→済 | 監査時点で 0 件。今回、作業ページの主要要素 12 件に `data-testid` を付与 |
| 現在の到達レベル | L0 | 上記のとおり |

## 到達範囲の線引き（正直な切り分け）

拡張の実データ（候補・選択・保存ジョブ）はブラウザの `chrome.storage.session` の中にあり、OS の外からは正直に触れない。したがって今回の L2 は次の範囲で宣言する。

- **機械可（CLI が実際にできる）**: パッケージ／manifest／権限の読み取り、操作カタログと権限の参照、保存設定スキーマの検証と計画（GUI と同じ芯 `utils.js` を使用）、CLI 側の保存設定プロファイルの作成・変更・削除（ブラウザ実設定の「準備物」であり、実設定そのものではない）、CLI 実行履歴、doctor / verify。
- **画面まで案内（B）**: 作業ページで人間が行う操作（スキャン、プレビュー、選択、保存、再試行、実設定の適用、オンボーディング）。CLI は対象と手順をガイドで示すところまで。
- **人間専用（C）**: Chrome の配信元許可ダイアログ、OS のフォルダ選択、OS 共有シート、Chrome 設定での権限取消、ストア提出。理由は `docs/AGENT_OPERATIONS.md` と `docs/AGENT_GUIDE.md` に明記。

「ブラウザ内の実データを CLI で操作できる」とは書かない。L3（決定的な検証の自動化）・L4（冪等な自律運用）はブラウザ実データ側が対象になるため今回は目指さず、CLI 表面については冪等キーと履歴で L4 の部品だけ先行実装した。

## 2. 操作カタログ

- 済: `docs/AGENT_OPERATIONS.md` に 29 操作を棚卸し（機械可 15 / 画面案内 9 / 人間専用 5）。破壊的操作と副作用を明記。

## 3. CLI / API 契約

| 項目 | 判定 | 記録 |
|---|---|---|
| 主要操作にサブコマンド | 済 | `status / list / get / plan / create / update / delete / history / doctor / verify` の 10 コマンド |
| 全コマンドに `--help` | 済 | 使い方・必須引数・例を返す。テストで全コマンド分を検証 |
| 共通フラグ | 済 | `--json`（既定）/ `--human` / `--dry-run` / `--yes` / `--idempotency-key` / `--timeout` / `--state-dir`。未対応の組み合わせは黙って無視せずエラーにする（例: `delete` の `--yes` なし実行は終了コード 1） |
| 終了コード統一 | 済 | 0 成功 / 1 入力誤り / 2 アプリ側失敗 / 3 権限不足 / 4 対象なし |
| 破壊的操作の `--yes` 必須 | 済 | `delete profile` は `--yes` か `--dry-run` が無いと実行しない |
| 冪等キー | 済 | `create/update/delete profile` が対応。同じキーの再実行は最初の結果を返す。同じキーで異なる内容は `idempotency_conflict`（終了コード 1） |
| 長い処理の進捗 | 対象外 | CLI の処理はすべて短時間で完了する同期処理のみ。ブラウザ側の保存ジョブは CLI から追えない（B 分類） |

## 4. 入出力

- 済: 成功 `{"ok":true,"data":...,"meta":{"schema_version":1,"request_id":...}}`、失敗 `{"ok":false,"error":{"code","message","retryable","details"}}` で統一。エラーコードは文字列定数。
- 済: スキーマ版数 1（`docs/agent-manifest.json` の `schema_version`）。
- 済: 日時は ISO 8601（UTC、`Z` 付き）で出力。
- 済: 秘密情報は扱わない。`status` は権限の有無だけを返し、値のある秘密はそもそも存在しない。候補 URL（認証用 query を含み得る）は CLI の対象外。

## 5. 読み取りと検証

- 済: `status`（版数・権限・前提条件）、`list/get`（操作・権限・プロファイル）、`history`（CLI 実行の成功・失敗理由）、`doctor`（前提条件と到達不可範囲の一覧）。
- 済: 書き込み系に `--dry-run`。
- 済: `verify`（`scripts/check.mjs` の実行、manifest とガイド／目録の整合、芯の往復確認、data-testid 件数）を合格／不合格で返す。
- 対象外: `seed` / `reset --test-data`。CLI が触るのは `.agent/` 配下の CLI 専用状態だけで、本番（ブラウザ実データ）に相当するものが無い。プロファイル削除が代替の整理手段。
- 未: 決定的モード。ブラウザ実データ側の検証は既存の合成ページ＋隔離 Chrome スイートが担い、CLI 側に時刻・乱数の不定要素は無い（request_id と profile id の UUID 発行を除く）。

## 6. ドキュメント

- 済: `docs/AGENT_GUIDE.md`、`docs/agent-manifest.json`。コマンド一覧は実装とテストで一致を検証。

## 7. MCP / SDK 層

- MCP: **入れない**。理由: MCP は L2/L3 が動いてから被せる層であり、今回の機械経路はリポジトリ内の開発・検証用 CLI が主用途で、AI が日常的に自律運用する段階に無い。`agent-manifest.json` に `available: false` と検討条件（L2/L3 が安定したら CLI スキーマから生成）を記録。
- SDK: **作らない**（スキルの既定）。理由: 他の自作アプリからの再利用需要も外部公開方針も無い。代わりに JSON スキーマ（ガイドと目録）と CLI を整えた。

## 未確認の範囲

- 実 Chrome の作業ページで data-testid を使った自動操作（この VM には直接使える Chromium が無く、既存の隔離 Chrome スイートの範囲外）。
- Safari 側の機械経路（対象外。Safari は Xcode プロジェクト経由で、今回の CLI はリポジトリ／パッケージ単位の経路のみ）。
- 人間の体験（許可ダイアログ、OS picker、共有シート）は従来どおり未確認として扱い、自動テストで確認済みにしない。
