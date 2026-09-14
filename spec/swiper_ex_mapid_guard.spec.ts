// oct26-m9-t1（実装レビュー IR1 MAJ-1・人間の指示による範囲追加 OF-1）:
// slideToMapID の位置合わせを、swiper 自身の再計算（observeParents → onResize → slideToLoop(その時点の realIndex, 0)）が
// 後から戻しても、最終的に目的の mapID へ合わせ直すこと（src/swiper_ex.ts の見張り）の単体試験。
//
// 実物の Swiper は生成せず、slideToMapID が使う面（el・slideToLoop・on / emit・destroyed）だけを持つ偽物に
// Swiper.prototype のメソッドを当てる。requestAnimationFrame は手で進めるキューに差し替え、swiper 12 の
// slideToLoop と同じく「slideTo は次のフレームで走る」「速さ 0 の slideTo は transitionEnd を同期で出す」を再現する。
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Swiper } from "../src/swiper_ex";

type Handler = () => void;

let frames: FrameRequestCallback[] = [];
function flushFrame() {
  const run = frames;
  frames = [];
  run.forEach(cb => cb(0));
}
function flushAll(max = 20) {
  for (let i = 0; i < max && frames.length; i++) flushFrame();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeSwiper(ids: string[], active: number): any {
  const el = document.createElement("div");
  ids.forEach((id, i) => {
    const s = document.createElement("div");
    s.className = "swiper-slide";
    s.setAttribute("data", id);
    s.setAttribute("data-swiper-slide-index", String(i));
    el.appendChild(s);
  });
  const handlers: Record<string, Handler[]> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sw: any = {
    el,
    destroyed: false,
    slideToLoopCalls: [] as number[],
    setActive(i: number) {
      el.querySelectorAll(".swiper-slide").forEach((s, j) =>
        s.classList.toggle("swiper-slide-active", j === i)
      );
    },
    activeID() {
      return el.querySelector(".swiper-slide-active")?.getAttribute("data");
    },
    on(events: string, h: Handler) {
      events.split(" ").forEach(e => (handlers[e] ??= []).push(h));
    },
    emit(e: string) {
      (handlers[e] || []).slice().forEach(h => h());
    },
    // swiper 12 の slideToLoop と同じく slideTo を次のフレームへ積む（transitionEnd は移動の後に出す）
    slideToLoop(index: number) {
      sw.slideToLoopCalls.push(index);
      requestAnimationFrame(() => {
        sw.setActive(index);
        sw.emit("transitionEnd");
      });
      // 試験用の差し込み口: slideToLoop が slideTo を積んだ直後（呼び出し元に戻る前）に 1 回だけ走らせる
      const after = sw.afterSlideToLoop;
      sw.afterSlideToLoop = undefined;
      if (after) after();
      return sw;
    },
    // onResize が積む「まだ動く前の位置への slideTo(…, 0)」を再現する: 呼んだ時点の active を次のフレームで戻す
    staleResize() {
      const back = [...el.querySelectorAll(".swiper-slide")].findIndex(s =>
        s.classList.contains("swiper-slide-active")
      );
      sw.emit("observerUpdate");
      requestAnimationFrame(() => {
        sw.setActive(back);
        sw.emit("transitionEnd");
      });
    }
  };
  sw.setActive(active);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (sw as any).__proto__ = Swiper.prototype;
  return sw;
}

beforeEach(() => {
  frames = [];
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frames.push(cb);
    return frames.length;
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("slideToMapID の位置合わせの見張り（oct26-m9-t1 IR1 MAJ-1・OF-1）", () => {
  it("目的の mapID のスライドへ slideToLoop する（従来の動作）", () => {
    const sw = makeSwiper(["a", "b", "c"], 0);
    sw.slideToMapID("b");
    flushAll();
    expect(sw.slideToLoopCalls).toEqual([1]);
    expect(sw.activeID()).toBe("b");
  });

  it("OF-1: 位置合わせの slideTo が走る前に onResize が積まれ、後から元の位置へ戻されても、目的の mapID へ合わせ直す", () => {
    const sw = makeSwiper(["a", "b", "c"], 0);
    sw.slideToMapID("b"); // 次のフレームで b へ
    sw.staleResize(); // 同じタスクで observer → onResize（まだ a の位置）が、こちらの slideTo の後に a へ戻す
    flushAll();
    expect(sw.activeID()).toBe("b");
    expect(sw.slideToLoopCalls).toEqual([1, 1]);
  });

  it("MAJ-1: active が既に目的の mapID（カードのクリックの先回り後）で早期 return しても、保留中の onResize に戻されたら合わせ直す", () => {
    const sw = makeSwiper(["a", "b", "c"], 0);
    sw.staleResize(); // クリックの前に onResize が積まれている（a へ戻す slideTo が保留中）
    sw.setActive(1); // クリックの先回り slideNext で b が active になった
    sw.slideToMapID("b"); // active が b なので slideToLoop はしない
    expect(sw.slideToLoopCalls).toEqual([]);
    flushAll();
    expect(sw.activeID()).toBe("b");
    expect(sw.slideToLoopCalls).toEqual([1]);
  });

  it("OF-1: 戻す slideTo が位置合わせの slideTo と保留解除の間に積まれ、transitionEnd が保留中に出ても、保留解除の時点で合わせ直す", () => {
    const sw = makeSwiper(["a", "b", "c"], 0);
    // slideToLoop の中で（保留解除の rAF より前に）onResize が a へ戻す slideTo を積む
    sw.afterSlideToLoop = () => sw.staleResize();
    sw.slideToMapID("b");
    flushAll();
    expect(sw.activeID()).toBe("b");
    expect(sw.slideToLoopCalls).toEqual([1, 1]);
  });

  it("位置合わせの slideTo が保留中の間は、observerUpdate の後の点検で slideToLoop を重ねない", () => {
    const sw = makeSwiper(["a", "b", "c"], 0);
    sw.slideToMapID("c");
    sw.emit("observerUpdate");
    sw.emit("observerUpdate");
    expect(sw.slideToLoopCalls).toEqual([2]);
    flushAll();
    expect(sw.activeID()).toBe("c");
    expect(sw.slideToLoopCalls).toEqual([2]);
  });

  it.each(["navigationNext", "navigationPrev", "touchStart"])(
    "利用者の操作（%s）の後は、目的の mapID と違う位置に移っても合わせ直さない",
    ev => {
      const sw = makeSwiper(["a", "b", "c"], 0);
      sw.slideToMapID("b");
      flushAll();
      expect(sw.slideToLoopCalls).toEqual([1]);
      sw.emit(ev);
      sw.setActive(2); // 矢印・ドラッグで c へ
      sw.emit("transitionEnd");
      sw.emit("observerUpdate");
      flushAll();
      expect(sw.activeID()).toBe("c");
      expect(sw.slideToLoopCalls).toEqual([1]);
    }
  );

  it("このスワイパーに無い mapID（base / overlay の片方）では動かさず、以後の再計算でも合わせ直さない", () => {
    const sw = makeSwiper(["a", "b", "c"], 0);
    sw.slideToMapID("b");
    flushAll();
    sw.slideToMapID("zzz");
    sw.setActive(2);
    sw.emit("transitionEnd");
    sw.emit("observerUpdate");
    flushAll();
    expect(sw.activeID()).toBe("c");
    expect(sw.slideToLoopCalls).toEqual([1]);
  });

  it("戻され続けても合わせ直しは上限回数で止まる（swiper と取り合って無限に動かない）", () => {
    const sw = makeSwiper(["a", "b", "c"], 0);
    // 何度合わせても a へ戻す相手
    sw.on("transitionEnd", () => {
      if (sw.activeID() !== "a")
        requestAnimationFrame(() => {
          sw.setActive(0);
          sw.emit("transitionEnd");
        });
    });
    sw.slideToMapID("b");
    flushAll(200);
    expect(sw.slideToLoopCalls.length).toBeGreaterThan(1);
    expect(sw.slideToLoopCalls.length).toBeLessThanOrEqual(6);
  });

  it("slideToIndex（index 基準）を呼んだら mapID の見張りを解く", () => {
    const sw = makeSwiper(["a", "b", "c"], 0);
    sw.params = { loop: true };
    sw.slideToMapID("b");
    flushAll();
    sw.slideToIndex(2);
    flushAll();
    sw.emit("transitionEnd");
    flushAll();
    expect(sw.activeID()).toBe("c");
    expect(sw.slideToLoopCalls).toEqual([1, 2]);
  });
});
