const browserLanguage = (): string => {
  const ua = window.navigator.userAgent.toLowerCase();
  try {
    let lang;
    // Chrome
    if (ua.indexOf("chrome") != -1) {
      lang = (
        navigator.languages[0] ||
        (navigator as any).browserLanguage ||
        navigator.language ||
        (navigator as any).userLanguage
      ).split(";");
      return lang[0];
    }
    // Other
    else {
      lang = (
        (navigator as any).browserLanguage ||
        navigator.language ||
        (navigator as any).userLanguage
      ).split(";");
      return lang[0];
    }
  } catch (_e) {
    return "";
  }
};
export default browserLanguage;
