# 更新日志

## 1.4.1

- 扩展 ID 由 `mailtranslate-cn@local` 改为 `mail-translate@shuai-beep`（准备公开发布）
  - ID 一旦发布不应再改，否则等于换了一个扩展，老用户无法升级
  - 从 1.4.0 升级需先卸载旧版再安装，密钥需重新填写一次

## 1.4.0

修复「点翻译按钮只显示感叹号、没有译文」的问题。

- 改用 `messageDisplayScripts.register()` 运行时注册，不再依赖 manifest 的
  `message_display_scripts`（在 Thunderbird 158 上不生效）
- 启动时遍历已打开的标签页，用 `tabs.executeScript()` 补注入
- 点击按钮时若仍无响应，再注入一次并重试
- 补上 `messagesModify` 权限（注入邮件页面的前提）
- 新增降级路径：页面取不到文字时，改用 `messages.getFull()` 读 MIME 正文，
  翻译后在新标签页展示（`result.html`）
- `content.js` 加 `window.__mtcnLoaded__` 标记，避免重复注入导致监听器叠加

## 1.3.0

- 错误写入 `storage.lastError`，选项页顶部常驻显示
- 页面写不进错误时，自动打开选项页，保证用户能看到失败原因
- 选项页新增「诊断邮件页面」按钮，遍历所有标签页回答「注入脚本在不在」
- `content.js` 兼容 `browser` / `messenger` 两种全局对象名

## 1.2.0

- 注入脚本报到机制（`cs-hello`），后台可判断页面脚本是否存活
- 失败时弹系统通知 + 按钮显示 `!`，不再静默
- 正文提取加三级回退：`body.innerText` → `documentElement.innerText` → `body.textContent`

## 1.1.0

- 新增阿里云机器翻译（`TranslateGeneral`，RPC 签名 HMAC-SHA1）
- 新增邮件工具栏「翻译」按钮（`message_display_action`）
- 支持服务商切换，默认阿里云
- 常见错误码译为中文提示

## 1.0.0

- 首个版本：右键菜单翻译整封邮件，腾讯云 TMT 后端
- 译文以独立区块追加在正文末尾，原文保留
- 长邮件按 4500 字符分段串行请求
