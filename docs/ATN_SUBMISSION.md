# 提交到 addons.thunderbird.net（ATN）

这份文档是上架 checklist + 可以直接复制粘贴的表单文案。

## 提交前确认

- [x] 代码为明文 JavaScript，未压缩、未混淆、未打包（`build.py` 只做复制 + zip）
      → 符合 [Source Code Submission](https://webextension-api.thunderbird.net/en/mv3/guides/sourceCodeSubmission.html)
      的豁免条件，**不需要**单独上传源码包
- [x] 无远程代码加载（不 `eval`、不动态 import 外部脚本）
- [x] 权限最小化：`messagesRead`、`messagesModify`、`menus`、`storage`、`tabs`、`notifications`
      + 两个 API 域名。没有 `<all_urls>`
- [x] 隐私政策全文已写好：`docs/PRIVACY_POLICY.md`
- [x] 许可证 MIT
- [ ] 截图（见下文）

## 提交流程

1. 构建：`python build.py` → `dist/mail-translate-<version>.xpi`
2. 登录 <https://addons.thunderbird.net/developers/>
3. 右上角 → Submit a New Add-on → **选择「On this site」**（上架托管、自动更新、自动签名）
   - 不要选 "On your own"，那是自托管，GitHub Releases 已经覆盖了
4. 上传 `dist/mail-translate-<version>.xpi`，等待自动校验通过
5. 填写下表各字段
6. 提交，等待审核

> ATN 会为通过审核的版本自动签名，用户从 ATN 安装时是正常签名扩展，
> 不需要像 GitHub Releases 那样手动允许未签名扩展。

## 表单文案（可直接复制）

### Name

```
邮件翻译 (Mail Translate)
```

### Summary（英文，250 字符内）

```
Translate the whole message body with Alibaba Cloud or Tencent Cloud machine translation. The translation is appended below the original text so you can compare, and nothing is sent unless you click Translate.
```

### Description

```markdown
Translate an entire email message into Chinese in one click, using Alibaba Cloud or Tencent Cloud machine translation.

## What it does

Thunderbird has no built-in message translation. This add-on fills that gap:

- **Translates the whole body**, not just a selection
- **Keeps the original** — the translation is appended below the message in a separate block, so you can compare side by side
- **Two backends** — Alibaba Cloud Machine Translation (1M characters/month free) or Tencent Cloud TMT
- **Long messages are split automatically** into segments of 4500 characters and sent sequentially to stay under rate limits
- **Two entry points** — a Translate button in the message toolbar, or the right-click menu
- **Failures are visible** — errors are written into the message pane; if that is not possible, you get a notification and the options page opens

## Setup

You need an API key from one of the supported providers. Both can be registered in mainland China without an international credit card:

- Alibaba Cloud: https://mt.console.aliyun.com — 1M characters/month free, Taobao/Alipay login
- Tencent Cloud: https://console.cloud.tencent.com/tmt

Paste the credentials into the add-on options and click "Test connection".

## Privacy

This add-on has **no server of its own**. It contacts only the translation endpoint you configure.

- Message body text is sent to your chosen provider **only when you click Translate**
- API credentials and preferences are stored locally in `storage.local` and never uploaded
- No telemetry, no analytics, no crash reporting, no device fingerprinting
- No mailbox credentials, contacts, calendar data, or attachments are accessed

The full privacy policy is in the Privacy Policy field of this listing.

## Source

MIT licensed. Source code: https://github.com/shuai-beep/thunderbird-mail-translate
```

### Categories

首选 `Language Support`；如果审核认为不合适，改选 `Miscellaneous`。

### Tags

```
translate, translation, chinese, 翻译, aliyun, tencent, machine translation
```

### License

```
MIT License
```

### Privacy Policy

**必须粘贴 `docs/PRIVACY_POLICY.md` 的完整文本**（中英双语整段），不能放链接。
ATN 明确要求 "the add-on's privacy policy must be the full policy text; it cannot be a link"。

### Homepage / Support site

```
https://github.com/shuai-beep/thunderbird-mail-translate
```

### Support email

填你的 GitHub noreply 或常用邮箱。

## 截图建议

至少 1 张，建议 3 张，尺寸 1280×800 左右：

1. **邮件正文 + 译文区块** —— 最能说明产品价值，一张图讲清「原文保留 + 译文追加」
2. **工具栏按钮位置** —— 红色圆圈标注那个「翻译」按钮
3. **选项页** —— 展示双服务商切换和「测试连接」成功状态

截图里不要露出真实邮箱地址、验证码、他人姓名。

## 审核关注点

根据 [ATN 审核政策](https://github.com/thunderbird/atn-review-policy)，本项目可能被问到：

| 关注点 | 我们的情况 |
|---|---|
| 是否使用 Experiment API | 否，全部走标准 WebExtension API |
| 权限是否最小化 | 是，无 `<all_urls>`，只声明两个 API 域名 |
| 是否加载远程代码 | 否 |
| 敏感数据传输是否加密 | 是，全部 HTTPS |
| 隐私政策是否完整 | 是，全文粘贴，含数据流向披露 |
| 是否请求了不必要的敏感权限 | `messagesRead` / `messagesModify` 是读取正文和注入译文的必要权限 |

**最可能被追问的一点**：`messagesModify`。这是往邮件阅读页面注入脚本所必需的
（Thunderbird 的 `tabs.executeScript` 到邮件页面需要该权限）。如果审核质疑，
可以说明：该权限仅用于在阅读视图中插入译文区块，**不会修改或删除任何邮件**，
代码中所有调用点都在 `background.js` 的 `injectInto()`。

审核提出修改要求后 **10 天内**必须回应，否则会被关闭。

## lint 结果解读

用官方 `web-ext lint` 跑过，**errors: 0**，8 个 warning 全部是 Firefox 侧的误报：

| 代码 | 数量 | 说明 |
|---|---|---|
| `UNSUPPORTED_API` | 5 | `messageDisplayAction.*`、`messages.getFull` 等是 **Thunderbird 专有 API**，Firefox 当然不认识。真实环境是 Thunderbird，不受影响 |
| `MANIFEST_PERMISSIONS` | 2 | `messagesRead` / `messagesModify` 同为 Thunderbird 专有权限，Firefox 的权限表里没有 |
| `MISSING_DATA_COLLECTION_PERMISSIONS` | 1 | Firefox 140+ 新增的键，用于 AMO 的数据披露。**Thunderbird / ATN 目前不要求**，且本项目不发布到 AMO，无需添加 |
| `FLAGGED_FILE_TYPE` | 1 | 扫描到了 `dist/` 里的 xpi 产物。`build.py` 打包时已排除 `dist/`，实际 xpi 里没有 |

复现：

```bash
npx web-ext lint --source-dir . --output json
```

> 想彻底消除最后一条，可先 `rm -rf dist` 再 lint。

## 后续发版

1. 改 `manifest.json` 的 version
2. 更新 `CHANGELOG.md`
3. `git tag v<version> && git push --tags`（GitHub Actions 会自动构建并发布 Release）
4. 到 ATN 开发者后台，在**已有 listing** 里上传新版本 xpi（不是新建提交）
5. 等审核，通过后 ATN 用户自动更新

## 已知会拖慢审核的做法

- 一次性提交大量无关改动
- 描述与实际功能不符
- 隐私政策写成链接或缺项
- 请求了功能用不到的权限
