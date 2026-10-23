// 旧 API（`MaplatUi`）の**API 水準**の回帰テスト（実ブラウザ。設計 v2 §2.5.1・§6.1・再レビュー D4）。
//
// 位置付け:
//   - `spec/legacy-api.spec.ts`（jsdom・層 A は実物だが地図は作らない）の姉妹。こちらは実 Core・
//     実ブラウザでしか判定できないもの（地図の切り替え・`#!` の復元・題名の文字）を判定する。
//   - **DOM のセレクタを使わない**。旧 UI の class 名（`.swiper-slide`・`.map-title span`・`.ol-*`）も
//     Swiper の実物も読まない。使うのは `window.__maplatUi` の公開面（`ui.core`・イベント・戻り値）と、
//     文書全体＋shadow root を再帰で探した**文字**だけ。fixture の `#status` は判定対象ではなく
//     起動の合図（旧 e2e と同じ扱い）。
//   - **旧の実装で緑になるように書く**（D4）。Stage 3 で `MaplatUi` を `<maplat-ui>` の互換層に
//     差し替えたあと、このファイルを `git diff` で無変更のまま緑にすることが受け入れ条件。
//   - 仕分けの根拠は `spec/fixtures/legacy-e2e-classification.md`（A1〜A9）。
//
// 実行（dev サーバーは playwright.config.ts の webServer が立てる）:
//   PLAYWRIGHT_SKIP_BROWSER_GC=1 node_modules/.bin/playwright test --config playwright.config.ts e2e/legacy-api.spec.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, type Page } from "@playwright/test";

const FIXTURE = "/e2e/fixtures/legacy-api.html";

/** 地図の題名（fixture の `title`／`officialTitle`。カードの `label` とは別の文字列） */
const TITLES = {
  start: "旧API題名・壱",
  second: "旧API題名・弐",
  third: "旧API題名・参"
};
const IDS = {
  start: "tatebayashi_ojozu",
  second: "tatebayashi_castle_akimoto",
  third: "tatebayashi_kaei_jokamachi"
};

type Opened = { page: Page; errors: string[] };

/** fixture を開き、`createObject` が解決する（`#status` が READY）まで待つ。 */
async function open(
  page: Page,
  options: { stateUrl?: boolean } = {}
): Promise<Opened> {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(String(e.message ?? e)));
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${FIXTURE}${options.stateUrl ? "?stateUrl=1" : ""}`);
  await page.waitForFunction(
    () => {
      const status = document.getElementById("status")?.textContent || "";
      return status === "READY" || status.startsWith("ERROR");
    },
    null,
    { timeout: 120000 }
  );
  const status = await page.textContent("#status");
  expect(status, "createObject が解決して READY になる").toBe("READY");
  return { page, errors };
}

/**
 * 文書全体と shadow root を再帰で探し、完全一致する**表示されている**文字があれば true。
 * `textContent` の一致だけでは、`display: none` の中に残っている文字（旧 UI のモーダル・
 * Swiper の複製など）を「画面にある」と誤認するので、`getClientRects().length > 0` も見る（Minor 15）。
 */
const hasText = (page: Page, needle: string) =>
  page.evaluate(needle => {
    const stack: (Document | ShadowRoot)[] = [document];
    while (stack.length) {
      const root = stack.pop()!;
      for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
        if (el.textContent?.trim() === needle && el.getClientRects().length > 0)
          return true;
        if (el.shadowRoot) stack.push(el.shadowRoot);
      }
    }
    return false;
  }, needle);

const waitText = (page: Page, needle: string, timeout = 60000) =>
  expect
    .poll(() => hasText(page, needle), {
      timeout,
      message: `文字「${needle}」が画面にある`
    })
    .toBe(true);

test.describe("旧 API の API 水準の不変条件（A1・A2）", () => {
  test("createObject が解決し、ui.core が非 null になる（stateUrl なし）", async ({
    page
  }) => {
    test.setTimeout(180000);
    const { errors } = await open(page);
    const info = await page.evaluate(() => {
      const ui = (window as any).__maplatUi;
      return {
        waitReady: typeof ui?.waitReady,
        changeMap: typeof ui?.core?.changeMap,
        addEventListener: typeof ui?.addEventListener,
        stateUrl: !!ui?.appOption?.stateUrl
      };
    });
    expect(info.waitReady).toBe("function");
    expect(info.changeMap).toBe("function");
    expect(info.addEventListener).toBe("function");
    expect(info.stateUrl).toBe(false);
    expect(errors).toEqual([]);
  });

  test("createObject が解決し、ui.core が非 null になる（stateUrl あり）", async ({
    page
  }) => {
    test.setTimeout(180000);
    const { errors } = await open(page, { stateUrl: true });
    const info = await page.evaluate(() => {
      const ui = (window as any).__maplatUi;
      return {
        changeMap: typeof ui?.core?.changeMap,
        stateUrl: !!ui?.appOption?.stateUrl,
        restoring: ui?.restoring === true
      };
    });
    expect(info.changeMap).toBe("function");
    expect(info.stateUrl).toBe(true);
    expect(info.restoring).toBe(false);
    expect(errors).toEqual([]);
  });
});

test.describe("地図の切り替え（A3）と題名の文字（A5）", () => {
  test("ui.core.changeMap(id) が mapChanged を出し、from.mapID が一致する", async ({
    page
  }) => {
    test.setTimeout(240000);
    const { errors } = await open(page);
    // 起動時の地図の題名が出ている
    await waitText(page, TITLES.start);
    // 背景の地図（OSM のタイル）へは切り替えない。外のネットワークに依らずに済むよう、
    // 重ねる地図（`tiles/` の非線形地図）だけで往復する。
    for (const id of [IDS.second, IDS.third, IDS.start]) {
      await page.evaluate(() => {
        const ui = (window as any).__maplatUi;
        (window as any).__mapChanged = [];
        if (!(window as any).__wired) {
          (window as any).__wired = true;
          ui.core.addEventListener("mapChanged", (evt: any) =>
            (window as any).__mapChanged.push(evt.detail?.mapID)
          );
        }
      });
      // `changeMap` はタイルの読込を待つので、待ちは長めに取る
      const resolved = await page.evaluate(async id => {
        try {
          await (window as any).__maplatUi.core.changeMap(id);
          return "resolved";
        } catch (e: any) {
          return `rejected: ${String(e?.message ?? e)}`;
        }
      }, id);
      await page.waitForFunction(
        id => ((window as any).__mapChanged as string[]).includes(id),
        id,
        { timeout: 120000 }
      );
      const now = await page.evaluate(() => ({
        from: (window as any).__maplatUi.core.from?.mapID,
        changed: (window as any).__mapChanged as string[]
      }));
      expect.soft(resolved, `changeMap(${id}) が解決する`).toBe("resolved");
      expect.soft(now.changed, `changeMap(${id}) の mapChanged`).toContain(id);
      expect.soft(now.from, `changeMap(${id}) の後の from.mapID`).toBe(id);
    }
    // 題名が切り替わった地図のものになる
    await waitText(page, TITLES.start);
    expect(errors).toEqual([]);
  });

  test("題名の文字は、切り替えた地図のものになる（A5）", async ({ page }) => {
    test.setTimeout(240000);
    const { errors } = await open(page);
    await waitText(page, TITLES.start);
    for (const [id, title] of [
      [IDS.second, TITLES.second],
      [IDS.third, TITLES.third]
    ] as const) {
      await page.evaluate(
        async id => await (window as any).__maplatUi.core.changeMap(id),
        id
      );
      await waitText(page, title);
    }
    expect(errors).toEqual([]);
  });
});

test.describe("URL の #! の復元（A4）", () => {
  test("location.hash の #!s:<id> が changeMap(<id>) を呼び、その地図になる", async ({
    page
  }) => {
    test.setTimeout(240000);
    const { errors } = await open(page, { stateUrl: true });
    await waitText(page, TITLES.start);
    // `ui.core.changeMap` を差し替えて呼び出しを記録しない（Minor 14）。互換層では復元の経路が
    // 違う（要素の `refreshStateUrl` → 子の復元）ので、記録に頼ると**振る舞いが正しくても落ちる**。
    // 復元できたことは、直後の `from.mapID` と題名の文字で判定する（どちらも API 水準）。
    for (const [id, title] of [
      [IDS.third, TITLES.third],
      [IDS.second, TITLES.second]
    ] as const) {
      await page.evaluate(id => {
        location.hash = `#!s:${id}`;
      }, id);
      await page.waitForFunction(
        id => (window as any).__maplatUi.core.from?.mapID === id,
        id,
        { timeout: 120000 }
      );
      await waitText(page, title);
    }
    expect(errors).toEqual([]);
  });
});

test.describe("showContextMenu（A7）", () => {
  test("showContextMenu([{icon,text,callback}]) が項目を出し、押すと callback が呼ばれる", async ({
    page
  }) => {
    test.setTimeout(180000);
    const { errors } = await open(page);
    const LABEL = "旧APIの項目A";
    await page.evaluate(label => {
      const ui = (window as any).__maplatUi;
      (window as any).__menuClicked = [];
      ui.lastClickPixel = [40, 40];
      ui.lastClickCoordinate = [0, 0];
      ui.showContextMenu([
        {
          icon: "img/no_image.png",
          text: label,
          callback: () => (window as any).__menuClicked.push("A")
        }
      ]);
    }, LABEL);
    await waitText(page, LABEL, 20000);
    // 項目（最も深い要素）を押す。座標ではなく要素の click で押す（旧・新のどちらでも同じ経路）
    const clicked = await page.evaluate(label => {
      const stack: (Document | ShadowRoot)[] = [document];
      let hit: HTMLElement | null = null;
      while (stack.length) {
        const root = stack.pop()!;
        for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
          if (el.textContent?.trim() === label) hit = el;
          if (el.shadowRoot) stack.push(el.shadowRoot);
        }
      }
      if (!hit) return false;
      let target: HTMLElement = hit;
      while (
        Array.from(target.children).some(c => c.textContent?.trim() === label)
      )
        target = Array.from(target.children).find(
          c => c.textContent?.trim() === label
        ) as HTMLElement;
      target.click();
      return true;
    }, LABEL);
    expect(clicked).toBe(true);
    await expect
      .poll(
        () => page.evaluate(() => (window as any).__menuClicked as string[]),
        { timeout: 20000 }
      )
      .toEqual(["A"]);
    expect(errors).toEqual([]);
  });
});

test.describe("文書化された API が例外を投げない（A9）", () => {
  test("setShowBorder / setHideMarker / updateUrl / showToast / remove", async ({
    page
  }) => {
    test.setTimeout(240000);
    const { errors } = await open(page, { stateUrl: true });
    // `updateUrl()` が効いたことを、**旧の内部フィールド（`pathThatSet`）に触らずに**確かめる（N4）。
    // 旧の重複判定（同じ文字列なら書かない）を回避するために `pathThatSet` を `undefined` にすると、
    // 互換層の正しい `updateUrl()`（書き込みを省く）でも落ちる＝旧の実装に依る判定になる。
    // 代わりに「起動時のハッシュを控えて消す → 地図を替える → `updateUrl()` を呼ぶ」とし、
    // 消したハッシュが**新しい状態**（替えた地図）になることだけを見る（どちらでも API 水準）。
    const before = await page.evaluate(() => {
      const ui = (window as any).__maplatUi;
      const failed: string[] = [];
      const run = (name: string, fn: () => void) => {
        try {
          fn();
        } catch (e: any) {
          failed.push(`${name}: ${String(e?.message ?? e)}`);
        }
      };
      run("setShowBorder(true)", () => ui.setShowBorder(true));
      run("setShowBorder(false)", () => ui.setShowBorder(false));
      run("setHideMarker(true)", () => ui.setHideMarker(true));
      run("setHideMarker(false)", () => ui.setHideMarker(false));
      run("ellips()", () => ui.ellips());
      run("modalSetting()", () => ui.modalSetting("map"));
      // 起動時に書かれた `#!` を控え、消す（起動時のものが残っているだけでは通らない）
      const boot = location.hash;
      history.replaceState(null, "", `${location.pathname}${location.search}`);
      return {
        failed,
        boot,
        cleared: location.hash,
        current: ui.core?.from?.mapID ?? ""
      };
    });
    expect(before.failed).toEqual([]);
    // 起動時に `#!s:<起動時の地図>` が書かれていた（＝消す前に状態が書かれていた）
    expect(before.boot).toContain(`s:${IDS.start}`);
    expect(before.current).toBe(IDS.start);
    expect(before.cleared, "消した直後はハッシュが空").toBe("");

    // 地図を替えてから `updateUrl()` を呼ぶ（「新しい状態」を作る。旧・互換層のどちらでも同じ API）
    const changed = await page.evaluate(async id => {
      try {
        await (window as any).__maplatUi.core.changeMap(id);
        return "resolved";
      } catch (e: any) {
        return `rejected: ${String(e?.message ?? e)}`;
      }
    }, IDS.second);
    expect(changed, `changeMap(${IDS.second}) が解決する`).toBe("resolved");
    const updateError = await page.evaluate(() => {
      try {
        (window as any).__maplatUi.updateUrl();
        return null;
      } catch (e: any) {
        return String(e?.message ?? e);
      }
    });
    expect(updateError, "updateUrl() が例外を投げない").toBe(null);

    // トーストの文字は、ハッシュの待ちより先に確かめる（N4。旧のトーストは 1.5 秒で消える）
    await page.evaluate(() =>
      (window as any).__maplatUi.showToast("旧APIのトースト")
    );
    await waitText(page, "旧APIのトースト", 20000);

    // 消したハッシュが、替えた地図の状態で書き直される
    await expect
      .poll(() => page.evaluate(() => location.hash), {
        timeout: 30000,
        message: `ハッシュが新しい地図 s:${IDS.second} になる`
      })
      .toContain(`s:${IDS.second}`);
    const hash = await page.evaluate(() => location.hash);
    expect(hash, "起動時の地図のままではない").not.toContain(`s:${IDS.start}`);

    // remove() の後は ui.core が無い（文書化された後片付け）
    const removed = await page.evaluate(() => {
      const ui = (window as any).__maplatUi;
      ui.remove();
      return { core: ui.core === undefined || ui.core === null };
    });
    expect(removed.core).toBe(true);
    expect(errors).toEqual([]);
  });
});
