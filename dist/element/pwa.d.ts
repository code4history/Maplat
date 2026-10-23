export interface PwaOptions {
    /** manifest の URL（true は既に既定のパスへ解決済みの値を渡す） */
    manifest: string;
    /**
     * Service Worker の URL（既定 ./service-worker.js）。`null` は「登録しない」（manifest・apple-touch-icon は足す。
     * 旧 API の `pwaWorker: false / null`。旧 pwa_init.ts と同じ。互換層だけが渡す）
     */
    worker?: string | null;
    /** Service Worker の scope（既定 ./） */
    scope?: string;
}
/** 単体テスト用: 文書ごとの「登録済み」の記録を消す（公開の入口からは出さない）。 */
export declare function resetPwaRegistryForTest(): void;
/**
 * PWA を有効にする。
 * @returns Service Worker の登録（登録しなかった・失敗したら undefined に解決）。URL が不正なら undefined
 */
export declare function initPwa(options: PwaOptions): Promise<ServiceWorkerRegistration | undefined> | undefined;
