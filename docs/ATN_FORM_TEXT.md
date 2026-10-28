# ATN 提交表单 — 可直接粘贴的文本

下面两段分别对应提交页面的两个文本框。用 `---8<---` 之间的内容，不要带标题。

---

## ① 粘贴到「请提供您插件的隐私政策」

---8<--- 以下为隐私政策全文 ---8<---

邮件翻译 (Thunderbird Mail Translate) — 隐私政策
最后更新：2026-10-28

【中文】

一、一句话说明

本扩展没有服务器。它只做一件事：在你点击「翻译」时，把你当前查看的这封邮件的正文，发送到你自己配置的翻译服务商。除此之外不收集任何数据。


二、收集哪些数据

1) 邮件正文文本
   - 何时：仅在你主动点击「翻译」按钮或右键菜单项时
   - 去向：你自行配置的翻译服务商（阿里云机器翻译 或 腾讯云机器翻译）
   - 是否必要：是，否则无法完成翻译

2) 翻译服务商的 API 密钥
   - 何时：你在选项页填写时
   - 去向：仅保存在本机扩展存储中，不上传、不同步
   - 是否必要：是，用于调用你选择的接口

3) 扩展配置（服务商选择、目标语言、地域）
   - 何时：你在选项页修改时
   - 去向：仅保存在本机扩展存储中
   - 是否必要：是，用于记住你的选择

4) 最近一次错误信息
   - 何时：翻译失败时
   - 去向：仅保存在本机，用于在选项页显示失败原因
   - 是否必要：否，可随时清除


三、不收集哪些数据

- 不收集邮箱账号、密码、联系人、日历、附件
- 不收集任何使用统计、遥测、崩溃报告、设备指纹
- 不向开发者或任何第三方服务器发送数据 —— 本扩展没有自建服务器
- 不在你未点击「翻译」时读取或发送任何邮件内容


四、第三方服务

当你点击「翻译」时，被翻译的邮件正文会以 HTTPS 发送到你选择的服务商。该服务商对数据的处理受其自身隐私政策约束：

- 阿里云机器翻译：https://help.aliyun.com/zh/machine-translation/
- 腾讯云机器翻译：https://cloud.tencent.com/document/product/551/7482

请注意：这些服务商可能按其条款保留请求记录，用于计费与服务改进。不要在未获授权的情况下翻译含他人隐私、涉密或敏感信息的邮件。


五、数据存储与删除

所有本地数据（密钥、配置、错误记录）存放在 Thunderbird 扩展的 storage.local 中，仅存在于你的电脑上，不会同步到任何云端。

- 清除错误记录：选项页点击「知道了」
- 清除全部本地数据：在 Thunderbird 中卸载本扩展


六、你的控制权

- 翻译完全由你手动触发，不点按钮就不会有任何网络请求
- 你可以随时在选项页更换或清空 API 密钥
- 你可以随时卸载扩展


七、联系方式

问题请开 issue：https://github.com/shuai-beep/thunderbird-mail-translate/issues


【English】

1. Summary

This add-on has no server of its own. It does exactly one thing: when you click "Translate", it sends the body text of the currently displayed message to the translation provider you configured yourself. Nothing else is collected.


2. Data We Process

a) Message body text
   - When: only when you click the Translate button or the context menu item
   - Where it goes: the translation provider you configured (Alibaba Cloud Machine Translation or Tencent Cloud TMT)
   - Required: yes, otherwise translation is impossible

b) API credentials
   - When: when you enter them in the options page
   - Where it goes: stored locally in extension storage only, never uploaded
   - Required: yes, to call the endpoint you chose

c) Preferences (provider, target language, region)
   - When: when you change them in the options page
   - Where it goes: stored locally only
   - Required: yes, to remember your choice

d) Last error message
   - When: when a translation fails
   - Where it goes: stored locally only, shown in the options page
   - Required: no, can be cleared at any time


3. What We Do NOT Collect

- No mailbox credentials, contacts, calendar data, or attachments
- No analytics, telemetry, crash reports, or device fingerprinting
- No data is sent to the developer or any server owned by the developer — this add-on has no backend
- No message content is read or transmitted unless you explicitly click Translate


4. Third-Party Services

When you click Translate, the message body is sent over HTTPS to the provider you selected. That provider's own privacy policy governs its handling of the data:

- Alibaba Cloud Machine Translation: https://www.alibabacloud.com/help/en/machine-translation
- Tencent Cloud TMT: https://www.tencentcloud.com/document/product/1161

These providers may retain request logs for billing and service improvement purposes. Do not translate messages containing other people's private or confidential information without authorization.


5. Storage and Deletion

All local data (credentials, preferences, error log) lives in the extension's storage.local on your device. It is never synchronized to any cloud service.

- Clear the error log: click the dismiss button in the options page
- Remove all local data: uninstall the add-on from Thunderbird


6. Your Control

- Translation is always manually triggered — no click, no network request
- You can change or clear your API credentials at any time
- You can uninstall the add-on at any time


7. Contact

Please open an issue: https://github.com/shuai-beep/thunderbird-mail-translate/issues

---8<--- 隐私政策结束 ---8<---


---

## ② 粘贴到「给审稿人的说明」

---8<--- 以下为审稿说明 ---8<---

What this add-on does

Adds a Translate button to the message toolbar. When clicked, it reads the body text of the currently displayed message and sends it to a translation API that the user has configured in the options page (Alibaba Cloud Machine Translation or Tencent Cloud TMT). The translated text is appended below the message body as a separate block. The original message is never modified, moved, or deleted.

How to test it

The core feature requires an API key from one of the supported providers. Both can be registered from mainland China without an international credit card, and Alibaba Cloud includes 1,000,000 characters per month free of charge.

Without a key you can still verify that the add-on loads and works correctly:

1. Install the XPI, then FULLY QUIT Thunderbird (including the tray icon) and restart. This step matters: the script that is injected into message panes is registered at startup, so a window close is not enough.

2. Open any message. A "翻译" (Translate) button appears in the message toolbar, between Delete and More.

3. Click it with no credentials configured. An error block appears inside the message pane stating that credentials are missing. This confirms that message-pane injection and body-text extraction both work.

4. Open the options page (Add-ons and Themes -> Mail Translate -> Options). The "Test connection" button calls the real API endpoint and reports the exact error code returned by the provider (for example InvalidAccessKeyId or SignatureDoesNotMatch). This confirms that requests are actually being sent and that the signing code runs.

5. To verify the full happy path, any Alibaba Cloud account with the Machine Translation service enabled will work. The free tier does not require payment information.

Permissions justification

- messagesRead: read the body text of the message the user is currently viewing. Only invoked on user click; there is no background reading.

- messagesModify: required to inject the translation block into the message reading view via tabs.executeScript. All call sites are inside background.js in the injectInto() function. This permission does not modify, delete, or move any message. It only appends one DOM node to the message pane, which is discarded when the view changes or another message is opened.

- storage: store the user's API credentials and preferences in storage.local.

- menus: provide the right-click menu entry.

- tabs: enumerate tabs at startup to inject the display script into already-open message panes, because messageDisplayScripts.register() only affects messages opened afterwards. This is the same approach used by other Thunderbird translation add-ons.

- notifications: surface errors when they cannot be written into the message pane.

- Host permissions are limited to the two translation API endpoints. There is no <all_urls> and no access to arbitrary sites.

Privacy

The add-on has no backend of its own. Message text is sent only to the endpoint the user configured, and only when the user clicks Translate. No telemetry, no analytics, no crash reporting, no remote logging.

Source code

Public repository: https://github.com/shuai-beep/thunderbird-mail-translate

The packaged XPI is unminified, unbundled, human-readable source. build.py only copies files and zips them; it performs no transformation. No separate source archive is required per the Source Code Submission policy.

Known limitation

Only plain text is translated. Tables, formatting and images are not preserved in the translated block. Messages whose body consists only of images are not supported, since the add-on does not perform OCR.

---8<--- 审稿说明结束 ---8<---
