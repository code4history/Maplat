export function resolveRelativeLink(
  file: string,
  fallbackPath: string | null
): string {
  if (!fallbackPath) fallbackPath = ".";
  return file.match(/\//) ? file : `${fallbackPath}/${file}`;
}

export function ellips(mapDivDocument: HTMLElement) {
  const omitMark = "…";
  const omitLine = 2;
  const stringSplit = function (element: HTMLElement) {
    const splitArr = element.innerText.split("");
    let joinString = "";
    for (let i = 0; i < splitArr.length; i++) {
      joinString += `<span>${splitArr[i]}</span>`;
    }
    joinString += `<span class="omit-mark">${omitMark}</span>`;
    element.innerHTML = joinString;
  };
  const omitCheck = function (element: HTMLElement) {
    const thisSpan = element.querySelectorAll("span");
    const omitSpan = element.querySelector(".omit-mark") as HTMLElement;
    let lineCount = 0;
    let omitCount = 0;

    if (omitLine <= 0) {
      return;
    }

    thisSpan[0].style.display = "";
    for (let i = 1; i < thisSpan.length; i++) {
      thisSpan[i].style.display = "none";
    }
    omitSpan.style.display = "";
    let divHeight = element.offsetHeight;
    let minimizeFont = false;
    for (let i = 1; i < thisSpan.length - 1; i++) {
      thisSpan[i].style.display = "";
      if (element.offsetHeight > divHeight) {
        if (!minimizeFont) {
          minimizeFont = true;
          element.classList.add("minimize");
        } else {
          divHeight = element.offsetHeight;
          lineCount++;
        }
      }
      if (lineCount >= omitLine) {
        omitCount = i - 2;
        break;
      }
      if (i >= thisSpan.length - 2) {
        omitSpan.style.display = "none";
        return;
      }
    }
    for (let i = omitCount; i < thisSpan.length - 1; i++) {
      thisSpan[i].style.display = "none";
    }
  };
  const swiperItems = mapDivDocument.querySelectorAll(".swiper-slide div");
  for (let i = 0; i < swiperItems.length; i++) {
    const swiperItem = swiperItems[i] as HTMLElement;
    stringSplit(swiperItem);
    omitCheck(swiperItem);
  }
}

export function isMaplatSource(source: unknown): source is {
  setGPSMarkerAsync: () => unknown;
  constructor: { isBasemap_?: boolean };
} {
  return (
    !!source &&
    typeof (source as { setGPSMarkerAsync: unknown }).setGPSMarkerAsync ===
      "function"
  );
}

export function isBasemap(source: unknown): boolean {
  if (!isMaplatSource(source)) return false;
  if (source.constructor && source.constructor.isBasemap_ === false)
    return false;
  if (source.constructor && source.constructor.isBasemap_ === true) return true;
  return true;
}

export function encBytes(bytes: number): string {
  const suffixes = ["Bytes", "KBytes", "MBytes", "GBytes"];
  let suffix = "Bytes";
  for (let i = 0; i < suffixes.length; i++) {
    suffix = suffixes[i];
    if (bytes < 1000) break;
    bytes = bytes / 1000;
  }
  return `${Math.floor(bytes * 10) / 10} ${suffix}`;
}
