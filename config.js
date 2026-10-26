// ホームページの設定。値を書き換えて保存すれば、ページに反映されます。
window.B100_SITE = {
  version: "0.2.0",   // 配っている体験版のバージョン（project.godot の config/version と合わせる）
  sizeMB: 72,         // 体験版 ZIP のおおよそのサイズ（MB）
  downloadUrl: "https://github.com/tairaita/b100/releases/download/v0.2.0/B100Demo_v0.2.0.zip", // 体験版 ZIP の URL。空ならボタンが「準備中」になる
  steamUrl: "",       // Steam のストアページ。空のあいだは「Steam 近日登場」と表示
  developer: "",      // フッターの「© 2026 ○○」に出す名前。空なら B100
  contactUrl: "",     // 感想・不具合の受付先（X、Google フォームなど）。空なら FAQ に出さない
};
