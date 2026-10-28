/* 选项页逻辑 */

const $ = (id) => document.getElementById(id);

const KEYS = [
  "provider",
  "aliKeyId",
  "aliKeySecret",
  "secretId",
  "secretKey",
  "region",
  "target",
];

function setStatus(text, kind) {
  const el = $("status");
  el.textContent = text || "";
  el.className = kind || "";
}

function toggleProvider() {
  const isAli = $("provider").value === "aliyun";
  $("ali-fields").hidden = !isAli;
  $("tx-fields").hidden = isAli;
  $("tip-ali").hidden = !isAli;
  $("tip-tx").hidden = isAli;
  setStatus("");
}

function readForm() {
  return {
    provider: $("provider").value,
    aliKeyId: $("aliKeyId").value.trim(),
    aliKeySecret: $("aliKeySecret").value.trim(),
    secretId: $("secretId").value.trim(),
    secretKey: $("secretKey").value.trim(),
    region: $("region").value,
    target: $("target").value,
  };
}

function validate(cfg) {
  if (cfg.provider === "aliyun") {
    if (!cfg.aliKeyId || !cfg.aliKeySecret) return "AccessKey ID 和 Secret 都要填";
  } else {
    if (!cfg.secretId || !cfg.secretKey) return "SecretId 和 SecretKey 都要填";
  }
  return "";
}

async function load() {
  const cfg = await browser.storage.local.get([...KEYS, "lastError"]);
  if (cfg.provider) $("provider").value = cfg.provider;
  if (cfg.aliKeyId) $("aliKeyId").value = cfg.aliKeyId;
  if (cfg.aliKeySecret) $("aliKeySecret").value = cfg.aliKeySecret;
  if (cfg.secretId) $("secretId").value = cfg.secretId;
  if (cfg.secretKey) $("secretKey").value = cfg.secretKey;
  if (cfg.region) $("region").value = cfg.region;
  if (cfg.target) $("target").value = cfg.target;
  toggleProvider();

  if (cfg.lastError && cfg.lastError.text) {
    const when = cfg.lastError.at ? new Date(cfg.lastError.at).toLocaleString() : "";
    $("last-error-text").textContent = cfg.lastError.text + (when ? `\n\n（${when}）` : "");
    $("last-error").hidden = false;
  }
}

$("dismiss-error").addEventListener("click", async () => {
  await browser.storage.local.remove("lastError");
  $("last-error").hidden = true;
});

/* 诊断：看看有没有邮件页面真的加载了注入脚本 */
$("diag").addEventListener("click", async () => {
  setStatus("正在检查…", "");
  let tabs = [];
  try {
    tabs = await browser.tabs.query({});
  } catch (e) {
    setStatus("无法枚举标签页：" + e.message, "err");
    return;
  }

  const alive = [];
  for (const t of tabs) {
    if (t.id === undefined) continue;
    const r = await browser.tabs.sendMessage(t.id, { cmd: "ping" }).catch(() => null);
    if (r && r.ok) alive.push({ id: t.id, href: r.href || "" });
  }

  if (alive.length === 0) {
    const n = tabs.length;
    setStatus(
      `已检查 ${n} 个标签页，没有任何一个响应。说明注入脚本没有加载 —— ` +
        `请完全退出 Thunderbird（托盘图标右键退出）后重新启动。`,
      "err"
    );
    return;
  }

  const detail = alive
    .map((a) => `#${a.id} ${a.href}`)
    .join("；");
  setStatus(`找到 ${alive.length} 个已加载脚本的页面：${detail}`, "ok");
});

$("provider").addEventListener("change", toggleProvider);

$("save").addEventListener("click", async () => {
  const cfg = readForm();
  const problem = validate(cfg);
  if (problem) {
    setStatus(problem, "err");
    return;
  }
  await browser.storage.local.set(cfg);
  setStatus("已保存", "ok");
  setTimeout(() => setStatus(""), 2600);
});

$("test").addEventListener("click", async () => {
  const cfg = readForm();
  const problem = validate(cfg);
  if (problem) {
    setStatus(problem, "err");
    return;
  }
  await browser.storage.local.set(cfg);
  setStatus("正在测试…", "");
  const res = await browser.runtime.sendMessage({ cmd: "test-api", cfg });
  if (res && res.ok) {
    setStatus("连接正常，返回：" + res.text, "ok");
  } else {
    setStatus((res && res.error) || "测试失败", "err");
  }
});

load();
