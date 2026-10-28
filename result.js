/* 译文展示页 */

const $ = (id) => document.getElementById(id);

let fontSize = 15;

async function load() {
  const { result } = await browser.storage.local.get("result");

  if (!result || !result.translated) {
    $("subject").textContent = "没有译文";
    $("translated").innerHTML = '<p class="empty">还没有翻译结果。回到邮件，点工具栏上的「翻译」按钮即可。</p>';
    $("copy").hidden = true;
    return;
  }

  $("subject").textContent = result.subject || "(无主题)";
  $("author").textContent = result.author || "";

  const name = result.provider === "tencent" ? "腾讯云" : "阿里云";
  $("tag").textContent = `${name} · ${result.chunks || 1} 段`;

  $("translated").textContent = result.translated;
  $("source").textContent = result.source || "";

  document.title = "译文 · " + ($("subject").textContent || "");
}

$("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("translated").textContent || "");
    $("copy").textContent = "已复制";
    setTimeout(() => ($("copy").textContent = "复制译文"), 1800);
  } catch (e) {
    $("copy").textContent = "复制失败";
    setTimeout(() => ($("copy").textContent = "复制译文"), 1800);
  }
});

$("addFont").addEventListener("click", () => {
  fontSize = Math.min(24, fontSize + 1);
  $("translated").style.fontSize = fontSize + "px";
});

$("subFont").addEventListener("click", () => {
  fontSize = Math.max(13, fontSize - 1);
  $("translated").style.fontSize = fontSize + "px";
});

load();
