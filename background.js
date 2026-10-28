/* 邮件翻译 - 后台逻辑
 * 支持两家服务商：
 *   aliyun  - 阿里云机器翻译通用版（每月 100 万字符免费，推荐）
 *   tencent - 腾讯云机器翻译 TMT（2027-10 起停服，仅作过渡）
 */

const CHUNK_LIMIT = 4500;
const CHUNK_DELAY = 260;

/* ---------- 阿里云 ---------- */
const ALI_HOST = "mt.cn-hangzhou.aliyuncs.com";
const ALI_VERSION = "2018-10-12";

/* ---------- 腾讯云 ---------- */
const TMT_HOST = "tmt.tencentcloudapi.com";
const TMT_SERVICE = "tmt";
const TMT_ACTION = "TextTranslate";
const TMT_VERSION = "2018-03-21";

/* ---------- 错误码 → 人话 ---------- */
const ERR_HINTS = {
  // 腾讯云
  "FailedOperation.UserNotRegistered":
    "腾讯云账号还没开通「机器翻译」服务。打开 console.cloud.tencent.com/tmt 点「开通服务」。",
  "FailedOperation.NoFreeAmount":
    "腾讯云本月免费额度已用完。建议改用阿里云（选项里切换服务商）。",
  "FailedOperation.ServiceIsolate": "腾讯云账号因欠费被停服，需要先充值。",
  "FailedOperation.StopUsing": "账号已停服，请联系腾讯云客服。",
  "FailedOperation.ErrorUserArea":
    "账号所属区域和请求区域不一致。到选项里把地域换成「中国香港」再试。",
  "AuthFailure.SignatureFailure":
    "签名校验失败。最常见是密钥复制错了或末尾多了空格，重新复制一次。",
  "AuthFailure.SecretIdNotFound": "SecretId 不存在，检查是否复制完整。",
  "AuthFailure.SignatureExpire":
    "本机时间和服务器相差超过 5 分钟。校准一下 Windows 系统时间再试。",
  "AuthFailure.UnauthorizedOperation":
    "这把密钥没有调用机器翻译的权限，请使用主账号创建密钥，或给子账号授权。",
  "AuthFailure.TokenFailure": "临时密钥已失效，请使用主账号的永久密钥。",
  "RequestLimitExceeded": "请求太频繁，触发了频率限制，等几秒再点一次。",
  "LimitExceeded": "超出配额限制，稍后再试。",

  // 阿里云
  "10001": "请求超时，重试一次通常就好。",
  "10002": "阿里云系统错误，稍后重试。",
  "10003": "译文解码失败，可能是邮件里有异常字符。",
  "10004": "请求参数有误，检查选项里的语言设置。",
  "10005": "不支持这个翻译方向，到选项里换一种目标语言。",
  "10006": "语种识别失败，这封邮件可能主要是图片或符号。",
  "10007": "翻译失败，重试一次。",
  "10008": "单次文本超过 5000 字符，会自动分段，如果反复出现请反馈。",
  "10009": "阿里云账号未开通机器翻译服务。打开 mt.console.aliyun.com 点「开通服务」。",
  "InvalidAccessKeyId.NotFound":
    "AccessKeyId 不存在。阿里云控制台 → 右上角头像 → AccessKey 管理，确认密钥状态为「启用」。",
  "SignatureDoesNotMatch":
    "签名不匹配。多半是 AccessKeySecret 复制错了，重新复制一次（注意别带空格）。",
  "IncompleteSignature": "签名参数缺失，检查密钥是否填完整。",
  "Forbidden.RAM": "这个子账号没有机器翻译权限，换主账号的 AccessKey 试试。",
  "Throttling.User": "调用太频繁，等几秒再点。",
  "Throttling.Api": "调用太频繁，等几秒再点。",
  "InvalidTimeStamp.Format": "本机时间格式异常，校准系统时间后重试。",
};

/* ---------- 菜单与工具栏按钮 ---------- */

/* 启动即注册注入，并给已经打开的邮件页面补上脚本 */
registerDisplayScript()
  .then(injectIntoAllTabs)
  .catch(() => {});

function createMenus() {
  browser.menus.create({
    id: "mtcn-translate",
    title: "翻译此邮件正文",
    contexts: ["message_list", "page", "all"],
  });
}

browser.runtime.onInstalled.addListener(createMenus);
browser.runtime.onStartup.addListener(() => {
  browser.menus.removeAll().then(createMenus).catch(() => {});
});

browser.menus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "mtcn-translate") return;
  await handleTrigger(tab);
});

if (browser.messageDisplayAction && browser.messageDisplayAction.onClicked) {
  browser.messageDisplayAction.onClicked.addListener(async (tab) => {
    await handleTrigger(tab);
  });
}

async function handleTrigger(tab) {
  let tabId = tab && tab.id;
  if (tabId === undefined || tabId === null) {
    const list = await browser.tabs.query({ active: true, currentWindow: true });
    tabId = list && list[0] ? list[0].id : undefined;
  }
  if (tabId === undefined || tabId === null) {
    await notifyError("找不到当前邮件所在的标签页。");
    return;
  }

  try {
    setBadge(tabId, "…");
    await runTranslate(tabId);
    setBadge(tabId, "");
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    setBadge(tabId, "!");
    setTimeout(() => setBadge(tabId, ""), 4000);
    await notifyError(msg, tabId);
  }
}

/* 错误优先写到邮件页面里；写不进去就弹通知 + 打开选项页，绝不让它静默 */
async function notifyError(text, tabId) {
  console.error("[邮件翻译]", text);

  try {
    await browser.storage.local.set({
      lastError: { at: new Date().toISOString(), text },
    });
  } catch (e) {
    /* 存不下就算了 */
  }

  if (tabId !== undefined && tabId !== null) {
    const ok = await send(tabId, { cmd: "error", text });
    if (ok) return;
  }

  try {
    await browser.notifications.create("mtcn-error", {
      type: "basic",
      iconUrl: browser.runtime.getURL("icons/icon-64.png"),
      title: "邮件翻译失败",
      message: text.length > 400 ? text.slice(0, 400) + "…" : text,
    });
  } catch (e) {
    /* 通知不可用 */
  }

  // 页面里写不进去，用户就没法看到原因，直接把选项页翻出来给他看
  try {
    await browser.runtime.openOptionsPage();
  } catch (e) {
    /* 忽略 */
  }
}

function setBadge(tabId, text) {
  if (!browser.messageDisplayAction) return;
  browser.messageDisplayAction.setBadgeText({ text, tabId }).catch(() => {});
}

/* ---------- content script 报到 / 选项页测试 ---------- */

const liveTabs = new Map();

browser.runtime.onMessage.addListener((msg, sender) => {
  if (msg && msg.cmd === "cs-hello") {
    const id = sender && sender.tab ? sender.tab.id : null;
    if (id !== null && id !== undefined) liveTabs.set(id, Date.now());
    return Promise.resolve({ ok: true });
  }
  if (msg && msg.cmd === "test-api" && msg.cfg) return testApi(msg.cfg);
  return undefined;
});

if (browser.tabs && browser.tabs.onRemoved) {
  browser.tabs.onRemoved.addListener((id) => liveTabs.delete(id));
}

async function testApi(cfg) {
  const sample = "Hello, this is a connection test from Thunderbird.";
  try {
    const out = await translateText(sample, cfg);
    return { ok: true, text: out };
  } catch (e) {
    return { ok: false, error: String(e && e.message ? e.message : e) };
  }
}

/* ---------- 往邮件页面注入脚本 ----------
 * manifest 里的 message_display_scripts 在 Thunderbird 158 上实测不生效，
 * 改为：运行时 register() 注册 + 对已打开的邮件页面用 executeScript 补注入，
 * 与 Thunderbird Translate 扩展的做法保持一致。
 */

const DISPLAY_SCRIPT = "/content.js";

async function registerDisplayScript() {
  const api = browser.messageDisplayScripts;
  if (!api || !api.register) return false;
  try {
    if (api.list) {
      const list = await api.list().catch(() => []);
      if (Array.isArray(list) && list.length > 0) return true;
    }
  } catch (e) {
    /* 忽略 */
  }
  try {
    await api.register({ js: [{ file: DISPLAY_SCRIPT }] });
    return true;
  } catch (e) {
    console.error("[邮件翻译] 注册显示脚本失败", e);
    return false;
  }
}

async function injectInto(tabId) {
  try {
    await browser.tabs.executeScript(tabId, { file: DISPLAY_SCRIPT });
    return true;
  } catch (e) {
    return false;
  }
}

async function injectIntoAllTabs() {
  let tabs = [];
  try {
    tabs = await browser.tabs.query({});
  } catch (e) {
    return;
  }
  for (const t of tabs) {
    if (t.id === undefined) continue;
    await injectInto(t.id);
  }
}

/* ---------- 主流程 ---------- */

async function runTranslate(tabId) {
  const cfg = await browser.storage.local.get(null);
  const provider = cfg.provider || "aliyun";

  if (provider === "aliyun") {
    if (!cfg.aliKeyId || !cfg.aliKeySecret) {
      throw new Error("尚未配置阿里云密钥。附加组件 → 邮件翻译 → 选项，填写 AccessKey ID 和 Secret。");
    }
  } else {
    if (!cfg.secretId || !cfg.secretKey) {
      throw new Error("尚未配置腾讯云密钥。附加组件 → 邮件翻译 → 选项，填写 SecretId 和 SecretKey。");
    }
  }

  const extracted = await send(tabId, { cmd: "extract" });
  const text = extracted && extracted.text ? String(extracted.text).trim() : "";

  // 页面里取不到文字（脚本没注入/邮件结构特殊）——走降级路径，直接读 MIME 正文
  if (text.length < 2) {
    return await translateViaMessageBody(tabId, cfg);
  }

  const chunks = splitText(text, CHUNK_LIMIT);
  send(tabId, { cmd: "progress", done: 0, total: chunks.length });

  const results = [];
  for (let i = 0; i < chunks.length; i++) {
    results.push(await translateText(chunks[i], cfg));
    send(tabId, { cmd: "progress", done: i + 1, total: chunks.length });
    if (i < chunks.length - 1) await sleep(CHUNK_DELAY);
  }

  await send(tabId, {
    cmd: "render",
    text: results.join("\n\n"),
    provider,
    chunks: chunks.length,
  });
}

/* ---------- 降级路径：完全不依赖页面脚本，直接读 MIME 正文 ---------- */

async function translateViaMessageBody(tabId, cfg) {
  const msg = await browser.messageDisplay.getDisplayedMessage(tabId);
  if (!msg) throw new Error("没有找到当前显示的邮件。请先点开一封邮件再试。");

  const full = await browser.messages.getFull(msg.id);
  const text = bodyTextFromFull(full);
  if (text.length < 2) throw new Error("这封邮件没有可提取的文字正文（可能只有图片）。");

  const chunks = splitText(text, CHUNK_LIMIT);
  const out = [];
  for (let i = 0; i < chunks.length; i++) {
    out.push(await translateText(chunks[i], cfg));
    if (i < chunks.length - 1) await sleep(CHUNK_DELAY);
  }
  const translated = out.join("\n\n");

  await browser.storage.local.set({
    result: {
      subject: msg.subject || "(无主题)",
      author: msg.author || "",
      translated,
      source: text,
      provider: cfg.provider || "aliyun",
      chunks: chunks.length,
      at: new Date().toISOString(),
    },
  });

  await browser.tabs.create({ url: browser.runtime.getURL("result.html") });
  return translated;
}

function bodyTextFromFull(full) {
  const plain = [];
  const html = [];
  const walk = (part) => {
    if (!part) return;
    const ct = String(part.contentType || "").toLowerCase();
    if (part.body) {
      if (ct.startsWith("text/plain")) plain.push(part.body);
      else if (ct.startsWith("text/html")) html.push(part.body);
    }
    if (Array.isArray(part.parts)) part.parts.forEach(walk);
  };
  walk(full);
  if (plain.length) return plain.join("\n\n").trim();
  if (html.length) return stripHtml(html.join("\n"));
  return "";
}

function stripHtml(s) {
  return String(s)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6]|table)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function translateText(text, cfg) {
  const provider = cfg.provider || "aliyun";
  return provider === "aliyun" ? translateAliyun(text, cfg) : translateTencent(text, cfg);
}

/* ---------- 阿里云实现 ---------- */

function aliEncode(v) {
  return encodeURIComponent(String(v))
    .replace(/[!'()]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/\*/g, "%2A")
    .replace(/%7E/g, "~");
}

function aliLang(code) {
  const map = { zh: "zh", "zh-TW": "zh-tw", en: "en", ja: "ja", ko: "ko" };
  return map[code] || "zh";
}

async function translateAliyun(text, cfg) {
  const params = {
    AccessKeyId: cfg.aliKeyId,
    Action: "TranslateGeneral",
    Format: "JSON",
    FormatType: "text",
    RegionId: "cn-hangzhou",
    Scene: "general",
    SignatureMethod: "HMAC-SHA1",
    SignatureNonce: crypto.randomUUID(),
    SignatureVersion: "1.0",
    SourceLanguage: "auto",
    SourceText: text,
    TargetLanguage: aliLang(cfg.target || "zh"),
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    Version: ALI_VERSION,
  };

  const keys = Object.keys(params).sort();
  const canonical = keys.map((k) => `${aliEncode(k)}=${aliEncode(params[k])}`).join("&");
  const stringToSign = `GET&${aliEncode("/")}&${aliEncode(canonical)}`;
  const signature = await hmacBase64(cfg.aliKeySecret + "&", stringToSign, "SHA-1");

  const url = `https://${ALI_HOST}/?${canonical}&Signature=${aliEncode(signature)}`;

  let res;
  try {
    res = await fetch(url, { method: "GET" });
  } catch (e) {
    throw new Error("网络请求失败，检查网络或代理：" + e.message);
  }

  const body = await res.text();
  let data = null;
  try {
    data = JSON.parse(body);
  } catch (e) {
    throw new Error(parseAliXmlError(body) || `接口返回非 JSON（HTTP ${res.status}），可能是密钥有误。`);
  }

  if (!data || data.Code === undefined) {
    throw new Error(parseAliXmlError(body) || "接口返回结构异常。");
  }
  if (Number(data.Code) !== 200) {
    const code = String(data.Code);
    const hint = ERR_HINTS[code];
    throw new Error(hint ? `${hint}\n\n错误码：${code}` : `阿里云错误 ${code}：${data.Message || "未知"}`);
  }
  const translated = data.Data && data.Data.Translated;
  if (typeof translated !== "string") throw new Error("接口没有返回译文。");
  return translated;
}

/* 阿里云的鉴权错误返回的是 XML，从里面抠出 Code / Message */
function parseAliXmlError(body) {
  if (typeof body !== "string" || body.indexOf("<Code>") === -1) return "";
  const code = (body.match(/<Code>([^<]+)<\/Code>/) || [])[1] || "";
  const msg = (body.match(/<Message>([^<]+)<\/Message>/) || [])[1] || "";
  const hint = ERR_HINTS[code];
  if (hint) return `${hint}\n\n错误码：${code}`;
  return code ? `阿里云鉴权失败（${code}）：${msg}` : "";
}

/* ---------- 腾讯云实现 ---------- */

async function buildTencentHeaders(cfg, payload, region) {
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);

  const contentType = "application/json; charset=utf-8";
  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${TMT_HOST}\n` +
    `x-tc-action:${TMT_ACTION.toLowerCase()}\n`;
  const signedHeaders = "content-type;host;x-tc-action";
  const hashedPayload = await sha256Hex(payload);

  const canonicalRequest = ["POST", "/", "", canonicalHeaders, signedHeaders, hashedPayload].join("\n");
  const credentialScope = `${date}/${TMT_SERVICE}/tc3_request`;
  const stringToSign = [
    "TC3-HMAC-SHA256",
    String(timestamp),
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = await hmacRaw(utf8("TC3" + cfg.secretKey), date, "SHA-256");
  const kService = await hmacRaw(kDate, TMT_SERVICE, "SHA-256");
  const kSigning = await hmacRaw(kService, "tc3_request", "SHA-256");
  const signature = toHex(await hmacRaw(kSigning, stringToSign, "SHA-256"));

  return {
    Authorization:
      `TC3-HMAC-SHA256 Credential=${cfg.secretId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`,
    "Content-Type": contentType,
    Host: TMT_HOST,
    "X-TC-Action": TMT_ACTION,
    "X-TC-Version": TMT_VERSION,
    "X-TC-Timestamp": String(timestamp),
    "X-TC-Region": cfg.region || "ap-guangzhou",
  };
}

async function translateTencent(text, cfg) {
  const payload = JSON.stringify({
    SourceText: text,
    Source: "auto",
    Target: cfg.target || "zh",
    ProjectId: 0,
  });
  const headers = await buildTencentHeaders(cfg, payload);

  let res;
  try {
    res = await fetch(`https://${TMT_HOST}/`, { method: "POST", headers, body: payload });
  } catch (e) {
    throw new Error("网络请求失败，检查网络或代理：" + e.message);
  }

  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error(`接口返回非 JSON（HTTP ${res.status}），可能是密钥或签名有误。`);
  }

  const resp = data && data.Response;
  if (!resp) throw new Error("接口返回结构异常。");
  if (resp.Error) {
    const code = resp.Error.Code || "";
    const hint = ERR_HINTS[code];
    throw new Error(hint ? `${hint}\n\n错误码：${code}` : `腾讯云错误：${code} - ${resp.Error.Message}`);
  }
  if (typeof resp.TargetText !== "string") throw new Error("接口没有返回译文。");
  return resp.TargetText;
}

/* ---------- 工具 ---------- */

function utf8(s) {
  return new TextEncoder().encode(s);
}

function toHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(str) {
  return toHex(await crypto.subtle.digest("SHA-256", utf8(str)));
}

async function hmacRaw(key, str, hash) {
  const raw = typeof key === "string" ? utf8(key) : key;
  const k = await crypto.subtle.importKey("raw", raw, { name: "HMAC", hash }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, utf8(str)));
}

async function hmacBase64(key, str, hash) {
  const sig = await hmacRaw(key, str, hash);
  let bin = "";
  for (const b of sig) bin += String.fromCharCode(b);
  return btoa(bin);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* 发消息；发不到就先注入脚本再重试一次 */
async function send(tabId, msg) {
  let r = await browser.tabs.sendMessage(tabId, msg).catch(() => null);
  if (r !== null && r !== undefined) return r;

  const injected = await injectInto(tabId);
  if (!injected) return null;

  await sleep(150);
  r = await browser.tabs.sendMessage(tabId, msg).catch(() => null);
  return r === undefined ? null : r;
}

function splitText(text, limit) {
  const paragraphs = text.split(/\n{2,}/);
  const out = [];
  let buf = "";

  const flush = () => {
    if (buf.trim()) out.push(buf.trim());
    buf = "";
  };

  for (const p of paragraphs) {
    if (p.length > limit) {
      flush();
      let rest = p;
      while (rest.length > limit) {
        let cut = rest.lastIndexOf(". ", limit);
        if (cut < limit * 0.5) cut = rest.lastIndexOf(" ", limit);
        if (cut < limit * 0.5) cut = limit;
        out.push(rest.slice(0, cut + 1).trim());
        rest = rest.slice(cut + 1);
      }
      if (rest.trim()) out.push(rest.trim());
      continue;
    }
    if ((buf + "\n\n" + p).length > limit) {
      flush();
      buf = p;
    } else {
      buf = buf ? buf + "\n\n" + p : p;
    }
  }
  flush();
  return out.filter((s) => s.length > 0);
}
