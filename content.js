/* 邮件翻译 - 邮件阅读页脚本
 * 负责：提取正文文本、把译文以独立区块插到邮件末尾
 *
 * 本脚本可能被注入多次（动态注册 + executeScript 补注入），
 * 用 window 标记避免重复注册监听器。
 */

(() => {
  if (window.__mtcnLoaded__) return;
  window.__mtcnLoaded__ = true;

  const api =
    (typeof browser !== "undefined" && browser) ||
    (typeof messenger !== "undefined" && messenger) ||
    null;

  const BOX_ID = "mtcn-box";

  const STYLE = {
    wrap:
      "margin:22px 0 8px;padding:16px 20px;border-left:3px solid #2f7ed8;" +
      "background:#f3f7fc;border-radius:0 6px 6px 0;font-size:14px;line-height:1.75;" +
      "color:#1f2328;white-space:pre-wrap;word-break:break-word;font-family:inherit;" +
      "text-align:left;direction:ltr;",
    head:
      "font-size:12px;color:#2f7ed8;font-weight:600;margin:0 0 10px;" +
      "letter-spacing:.02em;",
    body: "margin:0;white-space:pre-wrap;word-break:break-word;",
    err:
      "margin:22px 0 8px;padding:14px 18px;border-left:3px solid #d9534f;" +
      "background:#fdf3f3;border-radius:0 6px 6px 0;font-size:13px;line-height:1.6;" +
      "color:#8a2420;white-space:pre-wrap;font-family:inherit;",
  };

  if (!api) {
    console.error("[邮件翻译] 未取到扩展 API 对象");
    return;
  }

  try {
    const p = api.runtime.sendMessage({ cmd: "cs-hello", href: location.href });
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch (e) {
    /* 忽略 */
  }

  api.runtime.onMessage.addListener((msg) => {
    switch (msg && msg.cmd) {
      case "ping":
        return Promise.resolve({ ok: true, href: location.href, hasBody: !!document.body });

      case "extract": {
        const text = extractText();
        return Promise.resolve({ ok: true, text, chars: text.length, href: location.href });
      }

      case "progress":
        showProgress(msg.done, msg.total);
        return Promise.resolve({ ok: true });

      case "render":
        renderBox(msg.text, msg.chunks, msg.provider);
        return Promise.resolve({ ok: true });

      case "error":
        renderError(msg.text);
        return Promise.resolve({ ok: true });

      default:
        return undefined;
    }
  });

  /* ---------- 提取 ---------- */

  function cleanText(s) {
    return String(s || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function extractText() {
    const box = document.getElementById(BOX_ID);
    const prev = box ? box.style.display : null;
    if (box) box.style.display = "none";

    try {
      if (document.body) {
        const t = cleanText(document.body.innerText);
        if (t.length > 10) return t;
      }
      if (document.documentElement) {
        const t = cleanText(document.documentElement.innerText);
        if (t.length > 10) return t;
      }
      if (document.body) return cleanText(document.body.textContent);
      return "";
    } finally {
      if (box) box.style.display = prev || "";
    }
  }

  /* ---------- 渲染 ---------- */

  function removeBox() {
    const old = document.getElementById(BOX_ID);
    if (old) old.remove();
  }

  function ensureBox(styleText) {
    removeBox();
    const box = document.createElement("div");
    box.id = BOX_ID;
    box.setAttribute("style", styleText);
    (document.body || document.documentElement).appendChild(box);
    return box;
  }

  function showProgress(done, total) {
    let box = document.getElementById(BOX_ID);
    if (!box) {
      box = ensureBox(STYLE.wrap);
      const head = document.createElement("p");
      head.setAttribute("style", STYLE.head);
      head.textContent = "正在翻译";
      box.appendChild(head);
    }
    const head = box.querySelector("p");
    if (head instanceof HTMLElement && box.childElementCount === 1) {
      const pct = total ? Math.round((done / total) * 100) : 0;
      head.textContent = `正在翻译　${done}/${total}　${pct}%`;
    }
  }

  function renderBox(translated, chunks, provider) {
    const box = ensureBox(STYLE.wrap);

    const name = provider === "tencent" ? "腾讯云" : "阿里云";
    const head = document.createElement("p");
    head.setAttribute("style", STYLE.head);
    head.textContent = `译文 · 共 ${chunks || 1} 段 · ${name}机器翻译`;
    box.appendChild(head);

    const body = document.createElement("div");
    body.setAttribute("style", STYLE.body);
    body.textContent = translated;
    box.appendChild(body);

    try {
      box.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      /* 忽略 */
    }
  }

  function renderError(text) {
    const box = ensureBox(STYLE.err);
    box.textContent = "翻译失败：" + text;
  }
})();
