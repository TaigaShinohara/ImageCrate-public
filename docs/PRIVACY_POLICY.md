# Privacy Policy / プライバシーポリシー

ImageCrate  
2026-11-10

この文書は、Chromeウェブストアに掲載するImageCrateのプライバシーポリシーです。画像の取得や保存の技術的な境界は [プライバシーとデータ保持](PRIVACY.md) にあります。

連絡先: [deeple+imagecratestaff@inkboxmail.com](mailto:deeple+imagecratestaff@inkboxmail.com)

The use of information received from Google APIs will adhere to the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/user-data), including the Limited Use requirements.

---

## 日本語

### この拡張機能がすること

ImageCrateは、利用者が今開いているページにある画像を一覧し、選んだものだけを自分の端末へ保存します。アカウント登録はありません。開発者のサーバーはなく、解析や広告配信のための通信もありません。

### 端末の外へ送らないこと

ページのアドレス、ページ内の画像、選択内容、保存の進み具合は、利用者のブラウザの中だけで扱います。これらを開発者へ送ることはありません。開発者が画像を見たり、閲覧履歴を受け取ったりすることはありません。

### 発生する通信

画像を表示するとき、フォルダやZIPへ保存するとき、またはJPEG・PNG・WebPへ変換するときは、その画像が置かれているサーバーへ、その画像を取りにいきます。取りにいく先は画像の配信元であり、開発者ではありません。

その通信では、ブラウザがすでに持っているその配信元向けのCookieが付くことがあります。拡張機能はCookieの中身を読まず、保存せず、開発者へ転送しません。参照元（Referer）は付けません。別のアドレスへの自動的な転送（リダイレクト）には従いません。

「元の形式」のままChromeのダウンロード先へ保存するときは、元のアドレスをChromeのダウンロード機能へ渡します。Cookieや履歴の扱いはChrome側の動作です。

### 端末内に残るもの

- 作業中のページのアドレスとタイトル、見つかった画像のアドレス、選択、保存の進み具合は、Chromeのセッション領域にあります。作業タブを閉じると、ページのアドレスや候補や選択は取り除きます。保存の結果がまだ確定していない記録は、確定するまで残ることがあります。ブラウザを終了するとセッション領域は消えます。
- 「次の作業でもこの保存先を使う」をオンにしたまま適用すると、保存方法と選んだフォルダの参照を、この端末の中に覚えます。オフにして適用すると、次回用の記憶だけを忘れます。すでに保存したファイルは消しません。
- 保存した画像ファイルと、Chromeのダウンロード履歴は、拡張機能の後片付けとは別に残ります。不要なファイルは、利用者が保存先やChromeのダウンロード画面から削除します。

拡張機能を削除すると、拡張機能が端末内に持っていた作業情報と保存先の記憶は消えます。利用者がすでに保存したファイルは残り、利用者が自分で削除します。

### 画像に元から入っている情報

「元の形式」で保存すると、画像ファイルの中身はそのままです。撮影者や位置情報などが元のファイルに入っていれば、保存したファイルにも残ります。JPEG・PNG・WebPへの変換は端末内で絵を描き直しますが、写っている顔や文字を消す機能ではなく、すべての付属情報を消すことを保証しません。

ページのタイトルやファイル名に私的な文字列がある場合、保存先の名前にそれが使われることがあります。

### 使わないこと

販売、広告、信用判断、貸し付けのためにデータを使うことはありません。第三者へデータを渡すこともありません。遠隔のプログラムを読み込んで実行することもありません。

---

## English

### What the extension does

ImageCrate lists the images on the page you are viewing and saves only the ones you choose onto your device. There is no account. There is no developer server, and there is no analytics or advertising traffic.

### What leaves the device

The page address, the images on that page, your selection, and save progress stay inside your browser. ImageCrate does not send them to the developer. The developer cannot see your images or receive your browsing history.

### Network requests that do happen

Showing an image, saving it into a folder or a ZIP, or converting it to JPEG, PNG, or WebP fetches that image from the server that hosts it. That server is the image host, not the developer.

The browser may include cookies it already has for that host. The extension does not read cookie values, does not store them, and does not forward them to the developer. The request does not include a Referer, and it does not follow redirects.

Saving the original file into Chrome's download folder hands the original address to Chrome's own download feature. Chrome then applies its own cookie and history behavior.

### What stays on the device

- The address and title of the page you opened, the image addresses that were found, your selection, and save progress are kept in Chrome's session storage. Closing the work tab removes the page address, the candidates, and the selection. A save whose result is not finished yet can remain until that result is known. Session storage is cleared when the browser session ends.
- If you leave "use this save location next time" on and apply it, the save method and the chosen folder reference are remembered on this device. Turning that option off and applying it forgets only the memory used for the next session. Files already saved are not deleted.
- Saved image files and Chrome's download history remain after the extension clears its session. Delete files you do not want from the folder you chose or from Chrome's downloads.

Uninstalling the extension removes the work data and the remembered folder reference that the extension stored. Files you already saved remain until you delete them.

### Information already inside an image

An original-format save keeps the file bytes as they were. If the file already contains a photographer name or location, the saved file still contains it. Converting to JPEG, PNG, or WebP redraws the picture on your device. That is not a tool for removing faces or text, and it does not promise to remove every attached field.

If a page title or file name contains private words, those words can appear in the folder or file name used for the save.

### What ImageCrate does not do

It does not use data for sale, advertising, credit decisions, or lending. It does not transfer data to third parties. It does not download and run remote program code.
