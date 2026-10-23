/** 共有する URL の種類（仕様 §4.4 getShareUrl）。app はアプリそのもの、view は今の表示（状態 URL 込み）。 */
export type ShareUrlType = "app" | "view";
/** 旧 getShareUrl と同じ: view は今の URL（state-url なら "#!…" を含む）、それ以外は ? と # を落とした URL。 */
export declare function shareUrlOf(type: string, href: string): string;
/** 旧と同じ SNS の共有先（Twitter の intent・Facebook の sharer）。 */
export declare function twitterShareUrl(uri: string, text: string): string;
export declare function facebookShareUrl(uri: string): string;
/**
 * container の中身を text の QR に替える。
 * @returns 描いたら true（qrcode が読めない・符号化できない・より新しい依頼に替わったら false）
 */
export declare function renderQr(container: HTMLElement, text: string, label: string): Promise<boolean>;
