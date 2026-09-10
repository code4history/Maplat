// oct26-m3-t1 の設計根拠の記録（canary）: この vitest 環境における
// unhandledRejection と vi.fn モックの相互関係を実測どおりに固定する。
//
// 設計段階の実測（2026-09-10・vitest 3.2.7 / jsdom 30.0.1）:
//   - 素の Promise.reject を未処理で置くと process の unhandledRejection
//     リスナへ届く（届かなければ本 canary の第1試験が落ちる）
//   - vi.fn() の mockRejectedValueOnce が返す拒否は vitest のモック結果追跡が
//     ハンドラを付けるため、unhandledRejection リスナへは届かない
//     （届けば本 canary の第2試験が落ちる）
//
// ∴ oct26-m3-t1-pwa-sw-rejection.spec.ts の AC1（registerSW 拒否の未捕捉検証）は
// vi.fn ではなく素の関数で registerSW を差し替えている。この前提（vitest の
// モック追跡が拒否を「処理済み」にする）が崩れた場合、本 canary が先に落ちて
// AC1 の差し替え手段の再検討を促す。
import { describe, it, expect, vi } from "vitest";

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

describe("vitest モック拒否の unhandledRejection 到達性 (oct26-m3-t1 設計根拠)", () => {
  it("素の Promise.reject は unhandledRejection リスナへ届く", async () => {
    const seen: unknown[] = [];
    const on = (r: unknown) => {
      seen.push(r);
    };
    process.on("unhandledRejection", on);
    try {
      Promise.reject(new Error("canary-raw"));
      await flush();
      await flush();
      expect(seen.length).toBe(1);
      expect((seen[0] as Error).message).toBe("canary-raw");
    } finally {
      process.off("unhandledRejection", on);
    }
  });

  it("vi.fn の mockRejectedValueOnce が返す拒否はリスナへ届かない（モック結果追跡が処理済みにする）", async () => {
    const seen: unknown[] = [];
    const on = (r: unknown) => {
      seen.push(r);
    };
    process.on("unhandledRejection", on);
    try {
      const fn = vi.fn();
      fn.mockRejectedValueOnce(new Error("canary-mock"));
      fn();
      await flush();
      await flush();
      expect(seen.length).toBe(0);
    } finally {
      process.off("unhandledRejection", on);
    }
  });
});
