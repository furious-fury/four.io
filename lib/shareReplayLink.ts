/** Share a replay URL: native share when supported, else copy, else prompt. */

const dbg = (...args: unknown[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log("[four.io share-replay]", ...args);
  }
};

function isAbortError(e: unknown): boolean {
  return (
    e != null &&
    typeof e === "object" &&
    "name" in e &&
    (e as { name: string }).name === "AbortError"
  );
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  dbg("copyTextToClipboard: start", {
    hasClipboard: !!navigator.clipboard?.writeText,
    isSecureContext: typeof window !== "undefined" && window.isSecureContext,
  });
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      dbg("copyTextToClipboard: navigator.clipboard.writeText OK");
      return true;
    }
  } catch (e) {
    dbg("copyTextToClipboard: clipboard API failed", e);
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    dbg("copyTextToClipboard: execCommand", ok);
    return ok;
  } catch (e) {
    dbg("copyTextToClipboard: execCommand failed", e);
    return false;
  }
}

export type ShareReplayResult = "shared" | "copied" | "prompt" | "aborted";

export async function shareReplayLink(params: {
  url: string;
  title: string;
  text: string;
}): Promise<ShareReplayResult> {
  const { url, title, text } = params;
  const data: ShareData = { url, title, text };

  dbg("shareReplayLink: input", { url, hasShare: typeof navigator?.share });

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    let canShareResult = false;
    if (typeof navigator.canShare !== "function") {
      canShareResult = true;
      dbg("shareReplayLink: no canShare — will try navigator.share");
    } else {
      try {
        canShareResult = navigator.canShare(data);
        dbg("shareReplayLink: canShare(data)", canShareResult);
      } catch (e) {
        dbg("shareReplayLink: canShare threw (falling back to copy)", e);
        canShareResult = false;
      }
    }
    if (canShareResult) {
      try {
        dbg("shareReplayLink: calling navigator.share");
        await navigator.share(data);
        dbg(
          "shareReplayLink: navigator.share resolved — also copying URL (share sheet does not fill clipboard)",
        );
        const copiedAfterShare = await copyTextToClipboard(url);
        return copiedAfterShare ? "copied" : "shared";
      } catch (e) {
        dbg("shareReplayLink: navigator.share rejected", e);
        if (isAbortError(e)) {
          dbg("shareReplayLink: user aborted");
          return "aborted";
        }
      }
    }
  }

  dbg("shareReplayLink: falling back to clipboard / prompt");
  const copied = await copyTextToClipboard(url);
  if (copied) return "copied";

  if (typeof window !== "undefined") {
    dbg("shareReplayLink: opening prompt fallback");
    window.prompt("Copy this replay link:", url);
  }
  return "prompt";
}
