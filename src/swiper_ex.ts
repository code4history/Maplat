import Swiper from "swiper";

// oct26-m9-t1（実装レビュー IR1 MAJ-1・人間の指示による範囲追加 OF-1）: 位置合わせの見張り。
// swiper は observeParents の MutationObserver が親要素の属性変化（地図の切り替えで .maplat の class が変わる等）を拾うと
// observerUpdate → onResize を呼び、onResize は slideToLoop(その時点の realIndex, 0, false, true) で「その時点の DOM の並びでの
// index」を求めてから slideTo を requestAnimationFrame に積む。この slideTo が、slideToMapID の位置合わせ
// （slideToLoop も slideTo を rAF に積む）や、カードのクリックの先回り（slideNext / slidePrev = 同期の loopFix で並べ替え）の後に
// 走ると、位置を直前の地図へ戻す。戻された後に slideToMapID がもう一度呼ばれる保証は無い（外部 changeMap・状態復元・
// クリック後の mapChanged はいずれも 1 回だけ）ため、中央のカードと表示中の地図が持続的に食い違っていた。
// ∴ slideToMapID で目的の mapID を覚え、swiper の transitionEnd（速さ 0 の slideTo でも同期で出る）と observerUpdate / resize の
// 次のフレームで点検し、active が目的と違えば合わせ直す。利用者が矢印・ドラッグ・スワイプで動かし始めたら（navigationNext /
// navigationPrev / touchStart）目的を解き、利用者の操作とは取り合わない。合わせ直しは 1 つの目的につき上限回数までとする。
const MAX_MAPID_CORRECTIONS = 5;

interface MapIDGuard {
  target: string | undefined;
  pending: boolean;
  corrections: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function slideIndexOfMapID(swiper: any, mapID: string): number | undefined {
  const sliders = swiper.el.querySelectorAll(".swiper-slide");
  for (let i = 0; i < sliders.length; i++) {
    const slider = sliders[i];
    if (slider.getAttribute("data") == mapID) {
      return parseInt(slider.getAttribute("data-swiper-slide-index") || "0");
    }
  }
  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function activeMapID(swiper: any): string | null | undefined {
  return swiper.el.querySelector(".swiper-slide-active")?.getAttribute("data");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function alignToMapID(swiper: any, guard: MapIDGuard, index: number) {
  guard.pending = true;
  swiper.slideToLoop(index);
  // slideToLoop が積んだ slideTo の rAF の後に走る（同じフレームで積んだ順）。それまでは点検で slideToLoop を重ねない。
  // 戻す slideTo が保留中に走った（その transitionEnd の点検は見送られた）場合に備え、保留を解いた時点でも点検する
  requestAnimationFrame(() => {
    guard.pending = false;
    checkMapIDGuard(swiper, guard);
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkMapIDGuard(swiper: any, guard: MapIDGuard) {
  const target = guard.target;
  if (target === undefined || guard.pending || swiper.destroyed) return;
  if (activeMapID(swiper) == target) return;
  if (guard.corrections >= MAX_MAPID_CORRECTIONS) return;
  const index = slideIndexOfMapID(swiper, target);
  if (index === undefined) return;
  guard.corrections++;
  alignToMapID(swiper, guard, index);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapIDGuardOf(swiper: any): MapIDGuard {
  if (swiper.__mapIDGuard) return swiper.__mapIDGuard;
  const guard: MapIDGuard = {
    target: undefined,
    pending: false,
    corrections: 0
  };
  swiper.__mapIDGuard = guard;
  swiper.on("transitionEnd", () => checkMapIDGuard(swiper, guard));
  // onResize（同じイベントに先に登録されている）が slideTo を rAF に積んだ後に、こちらの点検を積む
  swiper.on("observerUpdate resize", () =>
    requestAnimationFrame(() => checkMapIDGuard(swiper, guard))
  );
  swiper.on("touchStart navigationNext navigationPrev", () => {
    guard.target = undefined;
  });
  return guard;
}

Swiper.prototype.slideToMapID = function (mapID: string) {
  const guard = mapIDGuardOf(this);
  const index = slideIndexOfMapID(this, mapID);
  // このスワイパーに無い mapID（base / overlay の片方）では動かさず、見張りも解く
  guard.target = index === undefined ? undefined : mapID;
  guard.corrections = 0;
  if (index === undefined) return;
  if (activeMapID(this) == mapID) return;
  alignToMapID(this, guard, index);
};

Swiper.prototype.slideToIndex = function (index: number) {
  // index 基準の移動は mapID の見張りと取り合わないよう、見張りを解く
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const guard: MapIDGuard | undefined = (this as any).__mapIDGuard;
  if (guard) guard.target = undefined;
  const slide = this.el.querySelector(".swiper-slide-active");
  if (
    slide &&
    parseInt(slide.getAttribute("data-swiper-slide-index") || "0") == index
  )
    return;

  if (this.params.loop) {
    this.slideToLoop(index);
  } else {
    this.slideTo(index);
  }
};

Swiper.prototype.setSlideMapID = function (mapID: string) {
  this.slideToMapID(mapID);
  this.setSlideMapIDAsSelected(mapID);
};

Swiper.prototype.setSlideIndex = function (index: number) {
  this.slideToIndex(index);
  this.setSlideIndexAsSelected(index);
};

Swiper.prototype.setSlideIndexAsSelected = function (index: number) {
  const sliders = this.el.querySelectorAll(".swiper-slide");
  for (let i = 0; i < sliders.length; i++) {
    const slider = sliders[i];
    if (slider.getAttribute("data-swiper-slide-index") == index.toString()) {
      slider.classList.add("selected");
    } else {
      slider.classList.remove("selected");
    }
  }
};

Swiper.prototype.setSlideMapIDAsSelected = function (mapID: string) {
  const sliders = this.el.querySelectorAll(".swiper-slide");
  for (let i = 0; i < sliders.length; i++) {
    const slider = sliders[i];
    if (slider.getAttribute("data") == mapID) {
      slider.classList.add("selected");
    } else {
      slider.classList.remove("selected");
    }
  }
};

export { Swiper };
