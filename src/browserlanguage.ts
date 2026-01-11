const browserLanguage = (): string => {
  const navigator = window.navigator;
  const ua = navigator.userAgent.toLowerCase();

  try {
    let lang;
    // Chrome
    if (ua.indexOf("chrome") != -1) {
      lang = (
        navigator.languages[0] ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (navigator as any).browserLanguage ||
        navigator.language ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (navigator as any).userLanguage
      ).split(";");
      return lang[0];
    }
    // Other
    else {
      lang = // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (
        (navigator as any).browserLanguage ||
        navigator.language ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (navigator as any).userLanguage
      ).split(";");
      return lang[0];
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_e) {
    return "";
  }
};
export default browserLanguage;
