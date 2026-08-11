// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  createElement,
  resolveRelativeLink,
  encBytes,
  isBasemap
} from "../src/ui_utils";

describe("createElement", () => {
  it("expands d/s shorthand tags and c/din attributes", () => {
    const [elem] = createElement(
      '<d c="outer"><s din="html.cache_handle"></s></d>'
    ) as HTMLElement[];
    expect(elem.tagName).toBe("DIV");
    expect(elem.className).toBe("outer");
    const span = elem.firstElementChild as HTMLElement;
    expect(span.tagName).toBe("SPAN");
    expect(span.getAttribute("data-i18n")).toBe("html.cache_handle");
  });

  it("expands dinh into data-i18n-html", () => {
    const [elem] = createElement(
      '<p dinh="html.help_using_maplat"></p>'
    ) as HTMLElement[];
    expect(elem.getAttribute("data-i18n-html")).toBe("html.help_using_maplat");
  });
});

describe("resolveRelativeLink", () => {
  it("keeps paths that already contain a slash", () => {
    expect(resolveRelativeLink("img/foo.png", "pois")).toBe("img/foo.png");
  });

  it("prefixes bare filenames with the fallback path", () => {
    expect(resolveRelativeLink("foo.png", "pois")).toBe("pois/foo.png");
  });

  it("defaults the fallback path to the current directory", () => {
    expect(resolveRelativeLink("foo.png", null)).toBe("./foo.png");
  });
});

describe("encBytes", () => {
  it("formats byte counts with decimal unit steps", () => {
    expect(encBytes(0)).toBe("0 Bytes");
    expect(encBytes(999)).toBe("999 Bytes");
    expect(encBytes(1500)).toBe("1.5 KBytes");
    expect(encBytes(2_340_000)).toBe("2.3 MBytes");
    expect(encBytes(9_990_000_000)).toBe("9.9 GBytes");
  });
});

describe("isBasemap", () => {
  it("rejects objects that are not Maplat sources", () => {
    expect(isBasemap(undefined)).toBe(false);
    expect(isBasemap({})).toBe(false);
  });

  it("respects the isBasemap_ constructor flag", () => {
    class HistLike {
      static isBasemap_ = false;
      setGPSMarkerAsync() {}
    }
    class BaseLike {
      static isBasemap_ = true;
      setGPSMarkerAsync() {}
    }
    expect(isBasemap(new HistLike())).toBe(false);
    expect(isBasemap(new BaseLike())).toBe(true);
  });
});
