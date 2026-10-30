/**
 * POI のスライダー（qy-swiper）の宣言。media から組んだもの（`.poi-media qy-swiper`）と、POI の html
 * （テンプレート）が書いたもの（入れ子の Shadow DOM の `qy-swiper`）の両方に当てる（2 か所に書かない）。
 * 色はページから変えられるよう、層 B の CSS 変数で公開する（Shadow DOM の中で直接指定すると外から上書きできない。
 * レビュー m5）。既定は旧と同じ #007aff。qy-swiper は Chuci のスライダーを継承するので、変数も Chuci の
 * `--cc-slider-*` を使う。
 */
export declare const POI_SWIPER_DECLARATIONS: string;
export declare const MAPLAT_UI_CSS: string;
/**
 * POI の html を描く入れ子の Shadow DOM の CSS（poi-html.ts）。`<maplat-ui>` の CSS はこの中へ届かない ∴
 * テンプレートが書いた qy-swiper にも、media のスライダーと同じ宣言をここで当てる（無いと高さが 0 になる）。
 * CSS 変数（`--maplat-poi-media-*`）は継承で届く。
 */
export declare const POI_HTML_SHADOW_CSS = "img { width: 100%; } qy-swiper { display: block; height: 300px; --cc-slider-theme-color: var(--maplat-poi-media-theme-color, #007aff); --cc-slider-navigation-color: var(--maplat-poi-media-navigation-color, #007aff); }";
