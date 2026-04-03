type LegacyNavigator = Navigator & {
  browserLanguage?: string;
  userLanguage?: string;
};

const browserLanguage = (): string => {
  const navigator = window.navigator as LegacyNavigator;
  const ua = navigator.userAgent.toLowerCase();

  try {
    let lang: string[] | undefined;
    // Chrome
    if (ua.indexOf("chrome") != -1) {
      const detectedLang =
        navigator.languages[0] ||
        navigator.browserLanguage ||
        navigator.language ||
        navigator.userLanguage;
      if (!detectedLang) return "";
      lang = detectedLang.split(";");
      return lang[0];
    }
    // Other
    else {
      const detectedLang =
        navigator.browserLanguage ||
        navigator.language ||
        navigator.userLanguage;
      if (!detectedLang) return "";
      lang = detectedLang.split(";");
      return lang[0];
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_e) {
    return "";
  }
};
export default browserLanguage;
