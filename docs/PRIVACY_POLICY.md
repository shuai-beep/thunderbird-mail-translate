# 隐私政策 · Privacy Policy

**邮件翻译 (Thunderbird Mail Translate)**
最后更新：2026-10-28

---

## 中文

### 一句话说明

本扩展没有服务器。它只做一件事：在你点击「翻译」时，把你选中的这封邮件的正文，发送到**你自己配置的**翻译服务商。除此之外不收集任何数据。

### 收集哪些数据

| 数据 | 何时 | 去向 | 是否必要 |
|---|---|---|---|
| 邮件正文文本 | 仅在你主动点击「翻译」按钮或菜单项时 | 你自行配置的翻译服务商（阿里云或腾讯云） | 是，否则无法翻译 |
| 翻译服务商的 API 密钥 | 你在选项页填写时 | 仅保存在本机扩展存储中，不上传 | 是，用于调用你选择的接口 |
| 扩展配置（服务商、目标语言、地域） | 你在选项页修改时 | 仅保存在本机扩展存储中 | 是，记住你的选择 |
| 最近一次错误信息 | 翻译失败时 | 仅保存在本机，用于在选项页显示失败原因 | 否，可随时清除 |

### 不收集哪些数据

- 不收集邮箱账号、密码、联系人、日历、附件
- 不收集任何使用统计、遥测、崩溃报告、设备指纹
- 不向开发者或任何第三方服务器发送数据 —— 本扩展没有自建服务器
- 不在你未点击「翻译」时读取或发送任何邮件内容

### 第三方服务

当你点击「翻译」时，被翻译的邮件正文会以 HTTPS 发送到你选择的服务商。该服务商对数据的处理受其自身隐私政策约束：

- 阿里云机器翻译：<https://help.aliyun.com/zh/machine-translation/>
- 腾讯云机器翻译：<https://cloud.tencent.com/document/product/551/7482>

请注意：这些服务商可能会按其条款保留请求记录用于计费与服务改进。**不要在未获授权的情况下翻译含他人隐私、涉密或敏感信息的邮件。**

### 数据存储与删除

所有本地数据（密钥、配置、错误记录）存放在 Thunderbird 扩展的 `storage.local` 中，仅存在于你的电脑上，不会同步到任何云端。

- 清除错误记录：选项页点击「知道了」
- 清除全部本地数据：在 Thunderbird 中卸载本扩展，或删除配置文件夹下的 `storage` 数据

### 你的控制权

- 翻译完全由你手动触发，不点按钮就不会有任何网络请求
- 你可以随时在选项页更换或清空 API 密钥
- 你可以随时卸载扩展

### 联系方式

问题请开 issue：<https://github.com/shuai-beep/thunderbird-mail-translate/issues>

---

## English

### Summary

This add-on has no server of its own. It does exactly one thing: when you click "Translate", it sends the body text of the currently displayed message to **the translation provider you configured yourself**. Nothing else is collected.

### Data We Process

| Data | When | Where it goes | Required |
|---|---|---|---|
| Message body text | Only when you click Translate | The translation provider you configured (Alibaba Cloud or Tencent Cloud) | Yes — otherwise translation is impossible |
| API credentials | When you enter them in the options page | Stored locally in extension storage only, never uploaded | Yes — to call the endpoint you chose |
| Preferences (provider, target language, region) | When you change them | Stored locally only | Yes — to remember your choice |
| Last error message | When a translation fails | Stored locally only, shown in the options page | No — can be cleared anytime |

### What We Do NOT Collect

- No mailbox credentials, contacts, calendar data, or attachments
- No analytics, telemetry, crash reports, or device fingerprinting
- No data is sent to the developer or any server owned by the developer — this add-on has no backend
- No message content is read or transmitted unless you explicitly click Translate

### Third-Party Services

When you click Translate, the message body is sent over HTTPS to the provider you selected. That provider's own privacy policy governs its handling of the data:

- Alibaba Cloud Machine Translation: <https://www.alibabacloud.com/help/en/machine-translation>
- Tencent Cloud TMT: <https://www.tencentcloud.com/document/product/1161>

These providers may retain request logs for billing and service improvement purposes. **Do not translate messages containing other people's private or confidential information without authorization.**

### Storage and Deletion

All local data (credentials, preferences, error log) lives in the extension's `storage.local` on your device. It is never synchronized to any cloud service.

- Clear the error log: click "知道了" in the options page
- Remove all local data: uninstall the add-on from Thunderbird

### Your Control

- Translation is always manually triggered — no click, no network request
- You can change or clear your API credentials at any time
- You can uninstall the add-on at any time

### Contact

Please open an issue: <https://github.com/shuai-beep/thunderbird-mail-translate/issues>
