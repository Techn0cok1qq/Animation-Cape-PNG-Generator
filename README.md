# Cape Motion Lab

GIFまたは短いMP4を、マントアニメーション用の連番PNGへ変換するブラウザーアプリケーションです。

入力された動画をブラウザー内でフレーム分割し、`TemplateCapes.png`へ合成します。生成された画像は`cape0.png`から連番でZIP化してダウンロードできます。

## Features

- GIFのフレーム分割
- MP4のフレーム抽出（12 fps）
- テンプレート画像への自動合成
- 合成領域 `x: 7 / y: 7 / width: 60 / height: 96`
- PNG 1枚あたり35KB以下を目標に自動縮小
- `cape0.png`形式の連番ファイル生成
- ZIPダウンロード
- フレームスライダーとプレビュー再生
- 日本語 / 英語UI
- ブラウザー内処理によるローカルファイルの非送信

## Requirements

- Google Chrome、Microsoft Edge、Firefoxなどのモダンブラウザー
- Python 3、またはVS CodeのLive Server
- インターネット接続（CDNライブラリ読み込み用）

## Project Structure

```text
AnimationCapeTool/
├── index.html              # アプリケーションの画面構造
├── style.css               # UIとプレビュー領域のスタイル
├── script.js               # フレーム抽出、合成、再生、ZIP生成
├── start-server.bat        # Windows用ローカルサーバー起動スクリプト
└── image/
    └── TemplateCapes.png   # 合成元テンプレート
```

## Local Development

### Option 1: Windowsで起動する

`start-server.bat`をダブルクリックしてください。

このスクリプトはプロジェクト直下でHTTPサーバーを起動し、次のURLをブラウザーで開きます。

```text
http://localhost:8000/index.html
```

### Option 2: Pythonから起動する

プロジェクトフォルダーで次を実行します。

```powershell
py -m http.server 8000
```

その後、ブラウザーで`http://localhost:8000/index.html`を開きます。

### Option 3: VS Code Live Server

VS Codeで`index.html`を開き、Live Server拡張機能の「Go Live」を実行します。

## Important: Do Not Open with `file://`

`index.html`をChromeへ直接ドラッグしたり、ダブルクリックして`file://`で開くと、ES Moduleの読み込みがブラウザーのセキュリティ制限により失敗する場合があります。

必ず`http://localhost`または公開済みの`https://`から起動してください。

## Processing Flow

```text
GIF / MP4を選択
        ↓
フレームをブラウザー内で抽出
        ↓
各フレームをTemplateCapes.pngへ合成
        ↓
PNGサイズを確認し、必要に応じて縮小
        ↓
cape0.png, cape1.png, ... を生成
        ↓
ZIPとしてダウンロード
```

## External Libraries

外部ライブラリはCDNから読み込みます。

- [JSZip](https://stuk.github.io/jszip/)：PNGフレームのZIP生成
- [gifuct-js](https://github.com/matt-way/gifuct-js)：GIFの解析とフレーム分割

依存関係は`package.json`で管理していないため、現状はビルド処理なしの静的サイトとして動作します。

## Deployment

静的ホスティングサービスへプロジェクトフォルダー全体をアップロードしてください。

対応例：

- Netlify Drop
- GitHub Pages
- Cloudflare Pages
- Vercel Static Deployment

公開時に必要なファイルは次のとおりです。

```text
index.html
style.css
script.js
image/TemplateCapes.png
```

`start-server.bat`はローカル開発用なので、公開サイトには必須ではありません。

## Template Specification

現在のテンプレートは次の仕様で使用しています。

- ファイル名：`image/TemplateCapes.png`
- 実画像サイズ：384 × 192 px
- 合成位置：`x=7, y=7`
- 合成領域：60 × 96 px

テンプレートを変更する場合は、ファイル名を`TemplateCapes.png`に合わせてください。画像サイズを変更する場合は、`script.js`の`TARGET`設定と表示仕様も確認してください。

## Notes

- 変換処理はサーバーへファイルをアップロードせず、ブラウザー上で実行します。
- 長時間のMP4や高フレームレートのGIFは、多数のPNGを生成するためメモリを多く使用します。
- PNGは可逆形式のため、画像内容によっては35KB以下に収めるために合成画像内の素材表示サイズが縮小されます。
- CDNが利用できない環境ではGIF変換機能とZIP生成機能が動作しません。
