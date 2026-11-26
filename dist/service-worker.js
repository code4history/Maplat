"use strict";
(() => {
  // <define:self.__WB_MANIFEST>
  var define_self_WB_MANIFEST_default = [];

  // node_modules/.pnpm/workbox-core@7.4.1/node_modules/workbox-core/_version.js
  try {
    self["workbox:core:7.4.0"] && _();
  } catch (e) {
  }

  // node_modules/.pnpm/workbox-core@7.4.1/node_modules/workbox-core/_private/logger.js
  var logger = false ? null : (() => {
    if (!("__WB_DISABLE_DEV_LOGS" in globalThis)) {
      self.__WB_DISABLE_DEV_LOGS = false;
    }
    let inGroup = false;
    const methodToColorMap = {
      debug: `#7f8c8d`,
      log: `#2ecc71`,
      warn: `#f39c12`,
      error: `#c0392b`,
      groupCollapsed: `#3498db`,
      groupEnd: null
      // No colored prefix on groupEnd
    };
    const print = function(method, args) {
      if (self.__WB_DISABLE_DEV_LOGS) {
        return;
      }
      if (method === "groupCollapsed") {
        if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
          console[method](...args);
          return;
        }
      }
      const styles = [
        `background: ${methodToColorMap[method]}`,
        `border-radius: 0.5em`,
        `color: white`,
        `font-weight: bold`,
        `padding: 2px 0.5em`
      ];
      const logPrefix = inGroup ? [] : ["%cworkbox", styles.join(";")];
      console[method](...logPrefix, ...args);
      if (method === "groupCollapsed") {
        inGroup = true;
      }
      if (method === "groupEnd") {
        inGroup = false;
      }
    };
    const api = {};
    const loggerMethods = Object.keys(methodToColorMap);
    for (const key of loggerMethods) {
      const method = key;
      api[method] = (...args) => {
        print(method, args);
      };
    }
    return api;
  })();

  // node_modules/.pnpm/workbox-core@7.4.1/node_modules/workbox-core/models/messages/messages.js
  var messages = {
    "invalid-value": ({ paramName, validValueDescription, value }) => {
      if (!paramName || !validValueDescription) {
        throw new Error(`Unexpected input to 'invalid-value' error.`);
      }
      return `The '${paramName}' parameter was given a value with an unexpected value. ${validValueDescription} Received a value of ${JSON.stringify(value)}.`;
    },
    "not-an-array": ({ moduleName, className, funcName, paramName }) => {
      if (!moduleName || !className || !funcName || !paramName) {
        throw new Error(`Unexpected input to 'not-an-array' error.`);
      }
      return `The parameter '${paramName}' passed into '${moduleName}.${className}.${funcName}()' must be an array.`;
    },
    "incorrect-type": ({ expectedType, paramName, moduleName, className, funcName }) => {
      if (!expectedType || !paramName || !moduleName || !funcName) {
        throw new Error(`Unexpected input to 'incorrect-type' error.`);
      }
      const classNameStr = className ? `${className}.` : "";
      return `The parameter '${paramName}' passed into '${moduleName}.${classNameStr}${funcName}()' must be of type ${expectedType}.`;
    },
    "incorrect-class": ({ expectedClassName, paramName, moduleName, className, funcName, isReturnValueProblem }) => {
      if (!expectedClassName || !moduleName || !funcName) {
        throw new Error(`Unexpected input to 'incorrect-class' error.`);
      }
      const classNameStr = className ? `${className}.` : "";
      if (isReturnValueProblem) {
        return `The return value from '${moduleName}.${classNameStr}${funcName}()' must be an instance of class ${expectedClassName}.`;
      }
      return `The parameter '${paramName}' passed into '${moduleName}.${classNameStr}${funcName}()' must be an instance of class ${expectedClassName}.`;
    },
    "missing-a-method": ({ expectedMethod, paramName, moduleName, className, funcName }) => {
      if (!expectedMethod || !paramName || !moduleName || !className || !funcName) {
        throw new Error(`Unexpected input to 'missing-a-method' error.`);
      }
      return `${moduleName}.${className}.${funcName}() expected the '${paramName}' parameter to expose a '${expectedMethod}' method.`;
    },
    "add-to-cache-list-unexpected-type": ({ entry }) => {
      return `An unexpected entry was passed to 'workbox-precaching.PrecacheController.addToCacheList()' The entry '${JSON.stringify(entry)}' isn't supported. You must supply an array of strings with one or more characters, objects with a url property or Request objects.`;
    },
    "add-to-cache-list-conflicting-entries": ({ firstEntry, secondEntry }) => {
      if (!firstEntry || !secondEntry) {
        throw new Error(`Unexpected input to 'add-to-cache-list-duplicate-entries' error.`);
      }
      return `Two of the entries passed to 'workbox-precaching.PrecacheController.addToCacheList()' had the URL ${firstEntry} but different revision details. Workbox is unable to cache and version the asset correctly. Please remove one of the entries.`;
    },
    "plugin-error-request-will-fetch": ({ thrownErrorMessage }) => {
      if (!thrownErrorMessage) {
        throw new Error(`Unexpected input to 'plugin-error-request-will-fetch', error.`);
      }
      return `An error was thrown by a plugins 'requestWillFetch()' method. The thrown error message was: '${thrownErrorMessage}'.`;
    },
    "invalid-cache-name": ({ cacheNameId, value }) => {
      if (!cacheNameId) {
        throw new Error(`Expected a 'cacheNameId' for error 'invalid-cache-name'`);
      }
      return `You must provide a name containing at least one character for setCacheDetails({${cacheNameId}: '...'}). Received a value of '${JSON.stringify(value)}'`;
    },
    "unregister-route-but-not-found-with-method": ({ method }) => {
      if (!method) {
        throw new Error(`Unexpected input to 'unregister-route-but-not-found-with-method' error.`);
      }
      return `The route you're trying to unregister was not  previously registered for the method type '${method}'.`;
    },
    "unregister-route-route-not-registered": () => {
      return `The route you're trying to unregister was not previously registered.`;
    },
    "queue-replay-failed": ({ name }) => {
      return `Replaying the background sync queue '${name}' failed.`;
    },
    "duplicate-queue-name": ({ name }) => {
      return `The Queue name '${name}' is already being used. All instances of backgroundSync.Queue must be given unique names.`;
    },
    "expired-test-without-max-age": ({ methodName, paramName }) => {
      return `The '${methodName}()' method can only be used when the '${paramName}' is used in the constructor.`;
    },
    "unsupported-route-type": ({ moduleName, className, funcName, paramName }) => {
      return `The supplied '${paramName}' parameter was an unsupported type. Please check the docs for ${moduleName}.${className}.${funcName} for valid input types.`;
    },
    "not-array-of-class": ({ value, expectedClass, moduleName, className, funcName, paramName }) => {
      return `The supplied '${paramName}' parameter must be an array of '${expectedClass}' objects. Received '${JSON.stringify(value)},'. Please check the call to ${moduleName}.${className}.${funcName}() to fix the issue.`;
    },
    "max-entries-or-age-required": ({ moduleName, className, funcName }) => {
      return `You must define either config.maxEntries or config.maxAgeSecondsin ${moduleName}.${className}.${funcName}`;
    },
    "statuses-or-headers-required": ({ moduleName, className, funcName }) => {
      return `You must define either config.statuses or config.headersin ${moduleName}.${className}.${funcName}`;
    },
    "invalid-string": ({ moduleName, funcName, paramName }) => {
      if (!paramName || !moduleName || !funcName) {
        throw new Error(`Unexpected input to 'invalid-string' error.`);
      }
      return `When using strings, the '${paramName}' parameter must start with 'http' (for cross-origin matches) or '/' (for same-origin matches). Please see the docs for ${moduleName}.${funcName}() for more info.`;
    },
    "channel-name-required": () => {
      return `You must provide a channelName to construct a BroadcastCacheUpdate instance.`;
    },
    "invalid-responses-are-same-args": () => {
      return `The arguments passed into responsesAreSame() appear to be invalid. Please ensure valid Responses are used.`;
    },
    "expire-custom-caches-only": () => {
      return `You must provide a 'cacheName' property when using the expiration plugin with a runtime caching strategy.`;
    },
    "unit-must-be-bytes": ({ normalizedRangeHeader }) => {
      if (!normalizedRangeHeader) {
        throw new Error(`Unexpected input to 'unit-must-be-bytes' error.`);
      }
      return `The 'unit' portion of the Range header must be set to 'bytes'. The Range header provided was "${normalizedRangeHeader}"`;
    },
    "single-range-only": ({ normalizedRangeHeader }) => {
      if (!normalizedRangeHeader) {
        throw new Error(`Unexpected input to 'single-range-only' error.`);
      }
      return `Multiple ranges are not supported. Please use a  single start value, and optional end value. The Range header provided was "${normalizedRangeHeader}"`;
    },
    "invalid-range-values": ({ normalizedRangeHeader }) => {
      if (!normalizedRangeHeader) {
        throw new Error(`Unexpected input to 'invalid-range-values' error.`);
      }
      return `The Range header is missing both start and end values. At least one of those values is needed. The Range header provided was "${normalizedRangeHeader}"`;
    },
    "no-range-header": () => {
      return `No Range header was found in the Request provided.`;
    },
    "range-not-satisfiable": ({ size, start, end }) => {
      return `The start (${start}) and end (${end}) values in the Range are not satisfiable by the cached response, which is ${size} bytes.`;
    },
    "attempt-to-cache-non-get-request": ({ url, method }) => {
      return `Unable to cache '${url}' because it is a '${method}' request and only 'GET' requests can be cached.`;
    },
    "cache-put-with-no-response": ({ url }) => {
      return `There was an attempt to cache '${url}' but the response was not defined.`;
    },
    "no-response": ({ url, error }) => {
      let message = `The strategy could not generate a response for '${url}'.`;
      if (error) {
        message += ` The underlying error is ${error}.`;
      }
      return message;
    },
    "bad-precaching-response": ({ url, status }) => {
      return `The precaching request for '${url}' failed` + (status ? ` with an HTTP status of ${status}.` : `.`);
    },
    "non-precached-url": ({ url }) => {
      return `createHandlerBoundToURL('${url}') was called, but that URL is not precached. Please pass in a URL that is precached instead.`;
    },
    "add-to-cache-list-conflicting-integrities": ({ url }) => {
      return `Two of the entries passed to 'workbox-precaching.PrecacheController.addToCacheList()' had the URL ${url} with different integrity values. Please remove one of them.`;
    },
    "missing-precache-entry": ({ cacheName, url }) => {
      return `Unable to find a precached response in ${cacheName} for ${url}.`;
    },
    "cross-origin-copy-response": ({ origin }) => {
      return `workbox-core.copyResponse() can only be used with same-origin responses. It was passed a response with origin ${origin}.`;
    },
    "opaque-streams-source": ({ type }) => {
      const message = `One of the workbox-streams sources resulted in an '${type}' response.`;
      if (type === "opaqueredirect") {
        return `${message} Please do not use a navigation request that results in a redirect as a source.`;
      }
      return `${message} Please ensure your sources are CORS-enabled.`;
    }
  };

  // node_modules/.pnpm/workbox-core@7.4.1/node_modules/workbox-core/models/messages/messageGenerator.js
  var generatorFunction = (code, details = {}) => {
    const message = messages[code];
    if (!message) {
      throw new Error(`Unable to find message for code '${code}'.`);
    }
    return message(details);
  };
  var messageGenerator = false ? fallback : generatorFunction;

  // node_modules/.pnpm/workbox-core@7.4.1/node_modules/workbox-core/_private/WorkboxError.js
  var WorkboxError = class extends Error {
    /**
     *
     * @param {string} errorCode The error code that
     * identifies this particular error.
     * @param {Object=} details Any relevant arguments
     * that will help developers identify issues should
     * be added as a key on the context object.
     */
    constructor(errorCode, details) {
      const message = messageGenerator(errorCode, details);
      super(message);
      this.name = errorCode;
      this.details = details;
    }
  };

  // node_modules/.pnpm/workbox-core@7.4.1/node_modules/workbox-core/_private/assert.js
  var isArray = (value, details) => {
    if (!Array.isArray(value)) {
      throw new WorkboxError("not-an-array", details);
    }
  };
  var hasMethod = (object, expectedMethod, details) => {
    const type = typeof object[expectedMethod];
    if (type !== "function") {
      details["expectedMethod"] = expectedMethod;
      throw new WorkboxError("missing-a-method", details);
    }
  };
  var isType = (object, expectedType, details) => {
    if (typeof object !== expectedType) {
      details["expectedType"] = expectedType;
      throw new WorkboxError("incorrect-type", details);
    }
  };
  var isInstance = (object, expectedClass, details) => {
    if (!(object instanceof expectedClass)) {
      details["expectedClassName"] = expectedClass.name;
      throw new WorkboxError("incorrect-class", details);
    }
  };
  var isOneOf = (value, validValues, details) => {
    if (!validValues.includes(value)) {
      details["validValueDescription"] = `Valid values are ${JSON.stringify(validValues)}.`;
      throw new WorkboxError("invalid-value", details);
    }
  };
  var isArrayOfClass = (value, expectedClass, details) => {
    const error = new WorkboxError("not-array-of-class", details);
    if (!Array.isArray(value)) {
      throw error;
    }
    for (const item of value) {
      if (!(item instanceof expectedClass)) {
        throw error;
      }
    }
  };
  var finalAssertExports = false ? null : {
    hasMethod,
    isArray,
    isInstance,
    isOneOf,
    isType,
    isArrayOfClass
  };

  // node_modules/.pnpm/workbox-core@7.4.1/node_modules/workbox-core/models/quotaErrorCallbacks.js
  var quotaErrorCallbacks = /* @__PURE__ */ new Set();

  // node_modules/.pnpm/workbox-core@7.4.1/node_modules/workbox-core/registerQuotaErrorCallback.js
  function registerQuotaErrorCallback(callback) {
    if (true) {
      finalAssertExports.isType(callback, "function", {
        moduleName: "workbox-core",
        funcName: "register",
        paramName: "callback"
      });
    }
    quotaErrorCallbacks.add(callback);
    if (true) {
      logger.log("Registered a callback to respond to quota errors.", callback);
    }
  }

  // node_modules/.pnpm/workbox-core@7.4.1/node_modules/workbox-core/_private/cacheNames.js
  var _cacheNameDetails = {
    googleAnalytics: "googleAnalytics",
    precache: "precache-v2",
    prefix: "workbox",
    runtime: "runtime",
    suffix: typeof registration !== "undefined" ? registration.scope : ""
  };
  var _createCacheName = (cacheName) => {
    return [_cacheNameDetails.prefix, cacheName, _cacheNameDetails.suffix].filter((value) => value && value.length > 0).join("-");
  };
  var eachCacheNameDetail = (fn2) => {
    for (const key of Object.keys(_cacheNameDetails)) {
      fn2(key);
    }
  };
  var cacheNames = {
    updateDetails: (details) => {
      eachCacheNameDetail((key) => {
        if (typeof details[key] === "string") {
          _cacheNameDetails[key] = details[key];
        }
      });
    },
    getGoogleAnalyticsName: (userCacheName) => {
      return userCacheName || _createCacheName(_cacheNameDetails.googleAnalytics);
    },
    getPrecacheName: (userCacheName) => {
      return userCacheName || _createCacheName(_cacheNameDetails.precache);
    },
    getPrefix: () => {
      return _cacheNameDetails.prefix;
    },
    getRuntimeName: (userCacheName) => {
      return userCacheName || _createCacheName(_cacheNameDetails.runtime);
    },
    getSuffix: () => {
      return _cacheNameDetails.suffix;
    }
  };

  // node_modules/.pnpm/workbox-core@7.4.1/node_modules/workbox-core/_private/cacheMatchIgnoreParams.js
  function stripParams(fullURL, ignoreParams) {
    const strippedURL = new URL(fullURL);
    for (const param of ignoreParams) {
      strippedURL.searchParams.delete(param);
    }
    return strippedURL.href;
  }
  async function cacheMatchIgnoreParams(cache, request, ignoreParams, matchOptions) {
    const strippedRequestURL = stripParams(request.url, ignoreParams);
    if (request.url === strippedRequestURL) {
      return cache.match(request, matchOptions);
    }
    const keysOptions = Object.assign(Object.assign({}, matchOptions), { ignoreSearch: true });
    const cacheKeys = await cache.keys(request, keysOptions);
    for (const cacheKey of cacheKeys) {
      const strippedCacheKeyURL = stripParams(cacheKey.url, ignoreParams);
      if (strippedRequestURL === strippedCacheKeyURL) {
        return cache.match(cacheKey, matchOptions);
      }
    }
    return;
  }

  // node_modules/.pnpm/workbox-core@7.4.1/node_modules/workbox-core/_private/canConstructResponseFromBodyStream.js
  var supportStatus;
  function canConstructResponseFromBodyStream() {
    if (supportStatus === void 0) {
      const testResponse = new Response("");
      if ("body" in testResponse) {
        try {
          new Response(testResponse.body);
          supportStatus = true;
        } catch (error) {
          supportStatus = false;
        }
      }
      supportStatus = false;
    }
    return supportStatus;
  }

  // node_modules/.pnpm/workbox-core@7.4.1/node_modules/workbox-core/_private/dontWaitFor.js
  function dontWaitFor(promise) {
    void promise.then(() => {
    });
  }

  // node_modules/.pnpm/workbox-core@7.4.1/node_modules/workbox-core/_private/Deferred.js
  var Deferred = class {
    /**
     * Creates a promise and exposes its resolve and reject functions as methods.
     */
    constructor() {
      this.promise = new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    }
  };

  // node_modules/.pnpm/workbox-core@7.4.1/node_modules/workbox-core/_private/executeQuotaErrorCallbacks.js
  async function executeQuotaErrorCallbacks() {
    if (true) {
      logger.log(`About to run ${quotaErrorCallbacks.size} callbacks to clean up caches.`);
    }
    for (const callback of quotaErrorCallbacks) {
      await callback();
      if (true) {
        logger.log(callback, "is complete.");
      }
    }
    if (true) {
      logger.log("Finished running callbacks.");
    }
  }

  // node_modules/.pnpm/workbox-core@7.4.1/node_modules/workbox-core/_private/getFriendlyURL.js
  var getFriendlyURL = (url) => {
    const urlObj = new URL(String(url), location.href);
    return urlObj.href.replace(new RegExp(`^${location.origin}`), "");
  };

  // node_modules/.pnpm/workbox-core@7.4.1/node_modules/workbox-core/_private/timeout.js
  function timeout(ms2) {
    return new Promise((resolve) => setTimeout(resolve, ms2));
  }

  // node_modules/.pnpm/workbox-core@7.4.1/node_modules/workbox-core/_private/waitUntil.js
  function waitUntil(event, asyncFn) {
    const returnPromise = asyncFn();
    event.waitUntil(returnPromise);
    return returnPromise;
  }

  // node_modules/.pnpm/workbox-core@7.4.1/node_modules/workbox-core/copyResponse.js
  async function copyResponse(response, modifier) {
    let origin = null;
    if (response.url) {
      const responseURL = new URL(response.url);
      origin = responseURL.origin;
    }
    if (origin !== self.location.origin) {
      throw new WorkboxError("cross-origin-copy-response", { origin });
    }
    const clonedResponse = response.clone();
    const responseInit = {
      headers: new Headers(clonedResponse.headers),
      status: clonedResponse.status,
      statusText: clonedResponse.statusText
    };
    const modifiedResponseInit = modifier ? modifier(responseInit) : responseInit;
    const body = canConstructResponseFromBodyStream() ? clonedResponse.body : await clonedResponse.blob();
    return new Response(body, modifiedResponseInit);
  }

  // node_modules/.pnpm/workbox-core@7.4.1/node_modules/workbox-core/clientsClaim.js
  function clientsClaim() {
    self.addEventListener("activate", () => self.clients.claim());
  }

  // node_modules/.pnpm/workbox-core@7.4.1/node_modules/workbox-core/skipWaiting.js
  function skipWaiting() {
    if (true) {
      logger.warn(`skipWaiting() from workbox-core is no longer recommended and will be removed in Workbox v7. Using self.skipWaiting() instead is equivalent.`);
    }
    void self.skipWaiting();
  }

  // node_modules/.pnpm/workbox-precaching@7.4.1/node_modules/workbox-precaching/_version.js
  try {
    self["workbox:precaching:7.4.0"] && _();
  } catch (e) {
  }

  // node_modules/.pnpm/workbox-precaching@7.4.1/node_modules/workbox-precaching/utils/createCacheKey.js
  var REVISION_SEARCH_PARAM = "__WB_REVISION__";
  function createCacheKey(entry) {
    if (!entry) {
      throw new WorkboxError("add-to-cache-list-unexpected-type", { entry });
    }
    if (typeof entry === "string") {
      const urlObject = new URL(entry, location.href);
      return {
        cacheKey: urlObject.href,
        url: urlObject.href
      };
    }
    const { revision, url } = entry;
    if (!url) {
      throw new WorkboxError("add-to-cache-list-unexpected-type", { entry });
    }
    if (!revision) {
      const urlObject = new URL(url, location.href);
      return {
        cacheKey: urlObject.href,
        url: urlObject.href
      };
    }
    const cacheKeyURL = new URL(url, location.href);
    const originalURL = new URL(url, location.href);
    cacheKeyURL.searchParams.set(REVISION_SEARCH_PARAM, revision);
    return {
      cacheKey: cacheKeyURL.href,
      url: originalURL.href
    };
  }

  // node_modules/.pnpm/workbox-precaching@7.4.1/node_modules/workbox-precaching/utils/PrecacheInstallReportPlugin.js
  var PrecacheInstallReportPlugin = class {
    constructor() {
      this.updatedURLs = [];
      this.notUpdatedURLs = [];
      this.handlerWillStart = async ({ request, state }) => {
        if (state) {
          state.originalRequest = request;
        }
      };
      this.cachedResponseWillBeUsed = async ({ event, state, cachedResponse }) => {
        if (event.type === "install") {
          if (state && state.originalRequest && state.originalRequest instanceof Request) {
            const url = state.originalRequest.url;
            if (cachedResponse) {
              this.notUpdatedURLs.push(url);
            } else {
              this.updatedURLs.push(url);
            }
          }
        }
        return cachedResponse;
      };
    }
  };

  // node_modules/.pnpm/workbox-precaching@7.4.1/node_modules/workbox-precaching/utils/PrecacheCacheKeyPlugin.js
  var PrecacheCacheKeyPlugin = class {
    constructor({ precacheController: precacheController2 }) {
      this.cacheKeyWillBeUsed = async ({ request, params }) => {
        const cacheKey = (params === null || params === void 0 ? void 0 : params.cacheKey) || this._precacheController.getCacheKeyForURL(request.url);
        return cacheKey ? new Request(cacheKey, { headers: request.headers }) : request;
      };
      this._precacheController = precacheController2;
    }
  };

  // node_modules/.pnpm/workbox-precaching@7.4.1/node_modules/workbox-precaching/utils/printCleanupDetails.js
  var logGroup = (groupTitle, deletedURLs) => {
    logger.groupCollapsed(groupTitle);
    for (const url of deletedURLs) {
      logger.log(url);
    }
    logger.groupEnd();
  };
  function printCleanupDetails(deletedURLs) {
    const deletionCount = deletedURLs.length;
    if (deletionCount > 0) {
      logger.groupCollapsed(`During precaching cleanup, ${deletionCount} cached request${deletionCount === 1 ? " was" : "s were"} deleted.`);
      logGroup("Deleted Cache Requests", deletedURLs);
      logger.groupEnd();
    }
  }

  // node_modules/.pnpm/workbox-precaching@7.4.1/node_modules/workbox-precaching/utils/printInstallDetails.js
  function _nestedGroup(groupTitle, urls) {
    if (urls.length === 0) {
      return;
    }
    logger.groupCollapsed(groupTitle);
    for (const url of urls) {
      logger.log(url);
    }
    logger.groupEnd();
  }
  function printInstallDetails(urlsToPrecache, urlsAlreadyPrecached) {
    const precachedCount = urlsToPrecache.length;
    const alreadyPrecachedCount = urlsAlreadyPrecached.length;
    if (precachedCount || alreadyPrecachedCount) {
      let message = `Precaching ${precachedCount} file${precachedCount === 1 ? "" : "s"}.`;
      if (alreadyPrecachedCount > 0) {
        message += ` ${alreadyPrecachedCount} file${alreadyPrecachedCount === 1 ? " is" : "s are"} already cached.`;
      }
      logger.groupCollapsed(message);
      _nestedGroup(`View newly precached URLs.`, urlsToPrecache);
      _nestedGroup(`View previously precached URLs.`, urlsAlreadyPrecached);
      logger.groupEnd();
    }
  }

  // node_modules/.pnpm/workbox-strategies@7.4.1/node_modules/workbox-strategies/_version.js
  try {
    self["workbox:strategies:7.4.0"] && _();
  } catch (e) {
  }

  // node_modules/.pnpm/workbox-strategies@7.4.1/node_modules/workbox-strategies/StrategyHandler.js
  function toRequest(input) {
    return typeof input === "string" ? new Request(input) : input;
  }
  var StrategyHandler = class {
    /**
     * Creates a new instance associated with the passed strategy and event
     * that's handling the request.
     *
     * The constructor also initializes the state that will be passed to each of
     * the plugins handling this request.
     *
     * @param {workbox-strategies.Strategy} strategy
     * @param {Object} options
     * @param {Request|string} options.request A request to run this strategy for.
     * @param {ExtendableEvent} options.event The event associated with the
     *     request.
     * @param {URL} [options.url]
     * @param {*} [options.params] The return value from the
     *     {@link workbox-routing~matchCallback} (if applicable).
     */
    constructor(strategy, options) {
      this._cacheKeys = {};
      if (true) {
        finalAssertExports.isInstance(options.event, ExtendableEvent, {
          moduleName: "workbox-strategies",
          className: "StrategyHandler",
          funcName: "constructor",
          paramName: "options.event"
        });
      }
      Object.assign(this, options);
      this.event = options.event;
      this._strategy = strategy;
      this._handlerDeferred = new Deferred();
      this._extendLifetimePromises = [];
      this._plugins = [...strategy.plugins];
      this._pluginStateMap = /* @__PURE__ */ new Map();
      for (const plugin of this._plugins) {
        this._pluginStateMap.set(plugin, {});
      }
      this.event.waitUntil(this._handlerDeferred.promise);
    }
    /**
     * Fetches a given request (and invokes any applicable plugin callback
     * methods) using the `fetchOptions` (for non-navigation requests) and
     * `plugins` defined on the `Strategy` object.
     *
     * The following plugin lifecycle methods are invoked when using this method:
     * - `requestWillFetch()`
     * - `fetchDidSucceed()`
     * - `fetchDidFail()`
     *
     * @param {Request|string} input The URL or request to fetch.
     * @return {Promise<Response>}
     */
    async fetch(input) {
      const { event } = this;
      let request = toRequest(input);
      if (request.mode === "navigate" && event instanceof FetchEvent && event.preloadResponse) {
        const possiblePreloadResponse = await event.preloadResponse;
        if (possiblePreloadResponse) {
          if (true) {
            logger.log(`Using a preloaded navigation response for '${getFriendlyURL(request.url)}'`);
          }
          return possiblePreloadResponse;
        }
      }
      const originalRequest = this.hasCallback("fetchDidFail") ? request.clone() : null;
      try {
        for (const cb of this.iterateCallbacks("requestWillFetch")) {
          request = await cb({ request: request.clone(), event });
        }
      } catch (err) {
        if (err instanceof Error) {
          throw new WorkboxError("plugin-error-request-will-fetch", {
            thrownErrorMessage: err.message
          });
        }
      }
      const pluginFilteredRequest = request.clone();
      try {
        let fetchResponse;
        fetchResponse = await fetch(request, request.mode === "navigate" ? void 0 : this._strategy.fetchOptions);
        if (true) {
          logger.debug(`Network request for '${getFriendlyURL(request.url)}' returned a response with status '${fetchResponse.status}'.`);
        }
        for (const callback of this.iterateCallbacks("fetchDidSucceed")) {
          fetchResponse = await callback({
            event,
            request: pluginFilteredRequest,
            response: fetchResponse
          });
        }
        return fetchResponse;
      } catch (error) {
        if (true) {
          logger.log(`Network request for '${getFriendlyURL(request.url)}' threw an error.`, error);
        }
        if (originalRequest) {
          await this.runCallbacks("fetchDidFail", {
            error,
            event,
            originalRequest: originalRequest.clone(),
            request: pluginFilteredRequest.clone()
          });
        }
        throw error;
      }
    }
    /**
     * Calls `this.fetch()` and (in the background) runs `this.cachePut()` on
     * the response generated by `this.fetch()`.
     *
     * The call to `this.cachePut()` automatically invokes `this.waitUntil()`,
     * so you do not have to manually call `waitUntil()` on the event.
     *
     * @param {Request|string} input The request or URL to fetch and cache.
     * @return {Promise<Response>}
     */
    async fetchAndCachePut(input) {
      const response = await this.fetch(input);
      const responseClone = response.clone();
      void this.waitUntil(this.cachePut(input, responseClone));
      return response;
    }
    /**
     * Matches a request from the cache (and invokes any applicable plugin
     * callback methods) using the `cacheName`, `matchOptions`, and `plugins`
     * defined on the strategy object.
     *
     * The following plugin lifecycle methods are invoked when using this method:
     * - cacheKeyWillBeUsed()
     * - cachedResponseWillBeUsed()
     *
     * @param {Request|string} key The Request or URL to use as the cache key.
     * @return {Promise<Response|undefined>} A matching response, if found.
     */
    async cacheMatch(key) {
      const request = toRequest(key);
      let cachedResponse;
      const { cacheName, matchOptions } = this._strategy;
      const effectiveRequest = await this.getCacheKey(request, "read");
      const multiMatchOptions = Object.assign(Object.assign({}, matchOptions), { cacheName });
      cachedResponse = await caches.match(effectiveRequest, multiMatchOptions);
      if (true) {
        if (cachedResponse) {
          logger.debug(`Found a cached response in '${cacheName}'.`);
        } else {
          logger.debug(`No cached response found in '${cacheName}'.`);
        }
      }
      for (const callback of this.iterateCallbacks("cachedResponseWillBeUsed")) {
        cachedResponse = await callback({
          cacheName,
          matchOptions,
          cachedResponse,
          request: effectiveRequest,
          event: this.event
        }) || void 0;
      }
      return cachedResponse;
    }
    /**
     * Puts a request/response pair in the cache (and invokes any applicable
     * plugin callback methods) using the `cacheName` and `plugins` defined on
     * the strategy object.
     *
     * The following plugin lifecycle methods are invoked when using this method:
     * - cacheKeyWillBeUsed()
     * - cacheWillUpdate()
     * - cacheDidUpdate()
     *
     * @param {Request|string} key The request or URL to use as the cache key.
     * @param {Response} response The response to cache.
     * @return {Promise<boolean>} `false` if a cacheWillUpdate caused the response
     * not be cached, and `true` otherwise.
     */
    async cachePut(key, response) {
      const request = toRequest(key);
      await timeout(0);
      const effectiveRequest = await this.getCacheKey(request, "write");
      if (true) {
        if (effectiveRequest.method && effectiveRequest.method !== "GET") {
          throw new WorkboxError("attempt-to-cache-non-get-request", {
            url: getFriendlyURL(effectiveRequest.url),
            method: effectiveRequest.method
          });
        }
        const vary = response.headers.get("Vary");
        if (vary) {
          logger.debug(`The response for ${getFriendlyURL(effectiveRequest.url)} has a 'Vary: ${vary}' header. Consider setting the {ignoreVary: true} option on your strategy to ensure cache matching and deletion works as expected.`);
        }
      }
      if (!response) {
        if (true) {
          logger.error(`Cannot cache non-existent response for '${getFriendlyURL(effectiveRequest.url)}'.`);
        }
        throw new WorkboxError("cache-put-with-no-response", {
          url: getFriendlyURL(effectiveRequest.url)
        });
      }
      const responseToCache = await this._ensureResponseSafeToCache(response);
      if (!responseToCache) {
        if (true) {
          logger.debug(`Response '${getFriendlyURL(effectiveRequest.url)}' will not be cached.`, responseToCache);
        }
        return false;
      }
      const { cacheName, matchOptions } = this._strategy;
      const cache = await self.caches.open(cacheName);
      const hasCacheUpdateCallback = this.hasCallback("cacheDidUpdate");
      const oldResponse = hasCacheUpdateCallback ? await cacheMatchIgnoreParams(
        // TODO(philipwalton): the `__WB_REVISION__` param is a precaching
        // feature. Consider into ways to only add this behavior if using
        // precaching.
        cache,
        effectiveRequest.clone(),
        ["__WB_REVISION__"],
        matchOptions
      ) : null;
      if (true) {
        logger.debug(`Updating the '${cacheName}' cache with a new Response for ${getFriendlyURL(effectiveRequest.url)}.`);
      }
      try {
        await cache.put(effectiveRequest, hasCacheUpdateCallback ? responseToCache.clone() : responseToCache);
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === "QuotaExceededError") {
            await executeQuotaErrorCallbacks();
          }
          throw error;
        }
      }
      for (const callback of this.iterateCallbacks("cacheDidUpdate")) {
        await callback({
          cacheName,
          oldResponse,
          newResponse: responseToCache.clone(),
          request: effectiveRequest,
          event: this.event
        });
      }
      return true;
    }
    /**
     * Checks the list of plugins for the `cacheKeyWillBeUsed` callback, and
     * executes any of those callbacks found in sequence. The final `Request`
     * object returned by the last plugin is treated as the cache key for cache
     * reads and/or writes. If no `cacheKeyWillBeUsed` plugin callbacks have
     * been registered, the passed request is returned unmodified
     *
     * @param {Request} request
     * @param {string} mode
     * @return {Promise<Request>}
     */
    async getCacheKey(request, mode) {
      const key = `${request.url} | ${mode}`;
      if (!this._cacheKeys[key]) {
        let effectiveRequest = request;
        for (const callback of this.iterateCallbacks("cacheKeyWillBeUsed")) {
          effectiveRequest = toRequest(await callback({
            mode,
            request: effectiveRequest,
            event: this.event,
            // params has a type any can't change right now.
            params: this.params
            // eslint-disable-line
          }));
        }
        this._cacheKeys[key] = effectiveRequest;
      }
      return this._cacheKeys[key];
    }
    /**
     * Returns true if the strategy has at least one plugin with the given
     * callback.
     *
     * @param {string} name The name of the callback to check for.
     * @return {boolean}
     */
    hasCallback(name) {
      for (const plugin of this._strategy.plugins) {
        if (name in plugin) {
          return true;
        }
      }
      return false;
    }
    /**
     * Runs all plugin callbacks matching the given name, in order, passing the
     * given param object (merged ith the current plugin state) as the only
     * argument.
     *
     * Note: since this method runs all plugins, it's not suitable for cases
     * where the return value of a callback needs to be applied prior to calling
     * the next callback. See
     * {@link workbox-strategies.StrategyHandler#iterateCallbacks}
     * below for how to handle that case.
     *
     * @param {string} name The name of the callback to run within each plugin.
     * @param {Object} param The object to pass as the first (and only) param
     *     when executing each callback. This object will be merged with the
     *     current plugin state prior to callback execution.
     */
    async runCallbacks(name, param) {
      for (const callback of this.iterateCallbacks(name)) {
        await callback(param);
      }
    }
    /**
     * Accepts a callback and returns an iterable of matching plugin callbacks,
     * where each callback is wrapped with the current handler state (i.e. when
     * you call each callback, whatever object parameter you pass it will
     * be merged with the plugin's current state).
     *
     * @param {string} name The name fo the callback to run
     * @return {Array<Function>}
     */
    *iterateCallbacks(name) {
      for (const plugin of this._strategy.plugins) {
        if (typeof plugin[name] === "function") {
          const state = this._pluginStateMap.get(plugin);
          const statefulCallback = (param) => {
            const statefulParam = Object.assign(Object.assign({}, param), { state });
            return plugin[name](statefulParam);
          };
          yield statefulCallback;
        }
      }
    }
    /**
     * Adds a promise to the
     * [extend lifetime promises]{@link https://w3c.github.io/ServiceWorker/#extendableevent-extend-lifetime-promises}
     * of the event associated with the request being handled (usually a
     * `FetchEvent`).
     *
     * Note: you can await
     * {@link workbox-strategies.StrategyHandler~doneWaiting}
     * to know when all added promises have settled.
     *
     * @param {Promise} promise A promise to add to the extend lifetime promises
     *     of the event that triggered the request.
     */
    waitUntil(promise) {
      this._extendLifetimePromises.push(promise);
      return promise;
    }
    /**
     * Returns a promise that resolves once all promises passed to
     * {@link workbox-strategies.StrategyHandler~waitUntil}
     * have settled.
     *
     * Note: any work done after `doneWaiting()` settles should be manually
     * passed to an event's `waitUntil()` method (not this handler's
     * `waitUntil()` method), otherwise the service worker thread may be killed
     * prior to your work completing.
     */
    async doneWaiting() {
      while (this._extendLifetimePromises.length) {
        const promises = this._extendLifetimePromises.splice(0);
        const result = await Promise.allSettled(promises);
        const firstRejection = result.find((i) => i.status === "rejected");
        if (firstRejection) {
          throw firstRejection.reason;
        }
      }
    }
    /**
     * Stops running the strategy and immediately resolves any pending
     * `waitUntil()` promises.
     */
    destroy() {
      this._handlerDeferred.resolve(null);
    }
    /**
     * This method will call cacheWillUpdate on the available plugins (or use
     * status === 200) to determine if the Response is safe and valid to cache.
     *
     * @param {Request} options.request
     * @param {Response} options.response
     * @return {Promise<Response|undefined>}
     *
     * @private
     */
    async _ensureResponseSafeToCache(response) {
      let responseToCache = response;
      let pluginsUsed = false;
      for (const callback of this.iterateCallbacks("cacheWillUpdate")) {
        responseToCache = await callback({
          request: this.request,
          response: responseToCache,
          event: this.event
        }) || void 0;
        pluginsUsed = true;
        if (!responseToCache) {
          break;
        }
      }
      if (!pluginsUsed) {
        if (responseToCache && responseToCache.status !== 200) {
          responseToCache = void 0;
        }
        if (true) {
          if (responseToCache) {
            if (responseToCache.status !== 200) {
              if (responseToCache.status === 0) {
                logger.warn(`The response for '${this.request.url}' is an opaque response. The caching strategy that you're using will not cache opaque responses by default.`);
              } else {
                logger.debug(`The response for '${this.request.url}' returned a status code of '${response.status}' and won't be cached as a result.`);
              }
            }
          }
        }
      }
      return responseToCache;
    }
  };

  // node_modules/.pnpm/workbox-strategies@7.4.1/node_modules/workbox-strategies/Strategy.js
  var Strategy = class {
    /**
     * Creates a new instance of the strategy and sets all documented option
     * properties as public instance properties.
     *
     * Note: if a custom strategy class extends the base Strategy class and does
     * not need more than these properties, it does not need to define its own
     * constructor.
     *
     * @param {Object} [options]
     * @param {string} [options.cacheName] Cache name to store and retrieve
     * requests. Defaults to the cache names provided by
     * {@link workbox-core.cacheNames}.
     * @param {Array<Object>} [options.plugins] [Plugins]{@link https://developers.google.com/web/tools/workbox/guides/using-plugins}
     * to use in conjunction with this caching strategy.
     * @param {Object} [options.fetchOptions] Values passed along to the
     * [`init`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters)
     * of [non-navigation](https://github.com/GoogleChrome/workbox/issues/1796)
     * `fetch()` requests made by this strategy.
     * @param {Object} [options.matchOptions] The
     * [`CacheQueryOptions`]{@link https://w3c.github.io/ServiceWorker/#dictdef-cachequeryoptions}
     * for any `cache.match()` or `cache.put()` calls made by this strategy.
     */
    constructor(options = {}) {
      this.cacheName = cacheNames.getRuntimeName(options.cacheName);
      this.plugins = options.plugins || [];
      this.fetchOptions = options.fetchOptions;
      this.matchOptions = options.matchOptions;
    }
    /**
     * Perform a request strategy and returns a `Promise` that will resolve with
     * a `Response`, invoking all relevant plugin callbacks.
     *
     * When a strategy instance is registered with a Workbox
     * {@link workbox-routing.Route}, this method is automatically
     * called when the route matches.
     *
     * Alternatively, this method can be used in a standalone `FetchEvent`
     * listener by passing it to `event.respondWith()`.
     *
     * @param {FetchEvent|Object} options A `FetchEvent` or an object with the
     *     properties listed below.
     * @param {Request|string} options.request A request to run this strategy for.
     * @param {ExtendableEvent} options.event The event associated with the
     *     request.
     * @param {URL} [options.url]
     * @param {*} [options.params]
     */
    handle(options) {
      const [responseDone] = this.handleAll(options);
      return responseDone;
    }
    /**
     * Similar to {@link workbox-strategies.Strategy~handle}, but
     * instead of just returning a `Promise` that resolves to a `Response` it
     * it will return an tuple of `[response, done]` promises, where the former
     * (`response`) is equivalent to what `handle()` returns, and the latter is a
     * Promise that will resolve once any promises that were added to
     * `event.waitUntil()` as part of performing the strategy have completed.
     *
     * You can await the `done` promise to ensure any extra work performed by
     * the strategy (usually caching responses) completes successfully.
     *
     * @param {FetchEvent|Object} options A `FetchEvent` or an object with the
     *     properties listed below.
     * @param {Request|string} options.request A request to run this strategy for.
     * @param {ExtendableEvent} options.event The event associated with the
     *     request.
     * @param {URL} [options.url]
     * @param {*} [options.params]
     * @return {Array<Promise>} A tuple of [response, done]
     *     promises that can be used to determine when the response resolves as
     *     well as when the handler has completed all its work.
     */
    handleAll(options) {
      if (options instanceof FetchEvent) {
        options = {
          event: options,
          request: options.request
        };
      }
      const event = options.event;
      const request = typeof options.request === "string" ? new Request(options.request) : options.request;
      const params = "params" in options ? options.params : void 0;
      const handler = new StrategyHandler(this, { event, request, params });
      const responseDone = this._getResponse(handler, request, event);
      const handlerDone = this._awaitComplete(responseDone, handler, request, event);
      return [responseDone, handlerDone];
    }
    async _getResponse(handler, request, event) {
      await handler.runCallbacks("handlerWillStart", { event, request });
      let response = void 0;
      try {
        response = await this._handle(request, handler);
        if (!response || response.type === "error") {
          throw new WorkboxError("no-response", { url: request.url });
        }
      } catch (error) {
        if (error instanceof Error) {
          for (const callback of handler.iterateCallbacks("handlerDidError")) {
            response = await callback({ error, event, request });
            if (response) {
              break;
            }
          }
        }
        if (!response) {
          throw error;
        } else if (true) {
          logger.log(`While responding to '${getFriendlyURL(request.url)}', an ${error instanceof Error ? error.toString() : ""} error occurred. Using a fallback response provided by a handlerDidError plugin.`);
        }
      }
      for (const callback of handler.iterateCallbacks("handlerWillRespond")) {
        response = await callback({ event, request, response });
      }
      return response;
    }
    async _awaitComplete(responseDone, handler, request, event) {
      let response;
      let error;
      try {
        response = await responseDone;
      } catch (error2) {
      }
      try {
        await handler.runCallbacks("handlerDidRespond", {
          event,
          request,
          response
        });
        await handler.doneWaiting();
      } catch (waitUntilError) {
        if (waitUntilError instanceof Error) {
          error = waitUntilError;
        }
      }
      await handler.runCallbacks("handlerDidComplete", {
        event,
        request,
        response,
        error
      });
      handler.destroy();
      if (error) {
        throw error;
      }
    }
  };

  // node_modules/.pnpm/workbox-precaching@7.4.1/node_modules/workbox-precaching/PrecacheStrategy.js
  var PrecacheStrategy = class _PrecacheStrategy extends Strategy {
    /**
     *
     * @param {Object} [options]
     * @param {string} [options.cacheName] Cache name to store and retrieve
     * requests. Defaults to the cache names provided by
     * {@link workbox-core.cacheNames}.
     * @param {Array<Object>} [options.plugins] {@link https://developers.google.com/web/tools/workbox/guides/using-plugins|Plugins}
     * to use in conjunction with this caching strategy.
     * @param {Object} [options.fetchOptions] Values passed along to the
     * {@link https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters|init}
     * of all fetch() requests made by this strategy.
     * @param {Object} [options.matchOptions] The
     * {@link https://w3c.github.io/ServiceWorker/#dictdef-cachequeryoptions|CacheQueryOptions}
     * for any `cache.match()` or `cache.put()` calls made by this strategy.
     * @param {boolean} [options.fallbackToNetwork=true] Whether to attempt to
     * get the response from the network if there's a precache miss.
     */
    constructor(options = {}) {
      options.cacheName = cacheNames.getPrecacheName(options.cacheName);
      super(options);
      this._fallbackToNetwork = options.fallbackToNetwork === false ? false : true;
      this.plugins.push(_PrecacheStrategy.copyRedirectedCacheableResponsesPlugin);
    }
    /**
     * @private
     * @param {Request|string} request A request to run this strategy for.
     * @param {workbox-strategies.StrategyHandler} handler The event that
     *     triggered the request.
     * @return {Promise<Response>}
     */
    async _handle(request, handler) {
      const response = await handler.cacheMatch(request);
      if (response) {
        return response;
      }
      if (handler.event && handler.event.type === "install") {
        return await this._handleInstall(request, handler);
      }
      return await this._handleFetch(request, handler);
    }
    async _handleFetch(request, handler) {
      let response;
      const params = handler.params || {};
      if (this._fallbackToNetwork) {
        if (true) {
          logger.warn(`The precached response for ${getFriendlyURL(request.url)} in ${this.cacheName} was not found. Falling back to the network.`);
        }
        const integrityInManifest = params.integrity;
        const integrityInRequest = request.integrity;
        const noIntegrityConflict = !integrityInRequest || integrityInRequest === integrityInManifest;
        response = await handler.fetch(new Request(request, {
          integrity: request.mode !== "no-cors" ? integrityInRequest || integrityInManifest : void 0
        }));
        if (integrityInManifest && noIntegrityConflict && request.mode !== "no-cors") {
          this._useDefaultCacheabilityPluginIfNeeded();
          const wasCached = await handler.cachePut(request, response.clone());
          if (true) {
            if (wasCached) {
              logger.log(`A response for ${getFriendlyURL(request.url)} was used to "repair" the precache.`);
            }
          }
        }
      } else {
        throw new WorkboxError("missing-precache-entry", {
          cacheName: this.cacheName,
          url: request.url
        });
      }
      if (true) {
        const cacheKey = params.cacheKey || await handler.getCacheKey(request, "read");
        logger.groupCollapsed(`Precaching is responding to: ` + getFriendlyURL(request.url));
        logger.log(`Serving the precached url: ${getFriendlyURL(cacheKey instanceof Request ? cacheKey.url : cacheKey)}`);
        logger.groupCollapsed(`View request details here.`);
        logger.log(request);
        logger.groupEnd();
        logger.groupCollapsed(`View response details here.`);
        logger.log(response);
        logger.groupEnd();
        logger.groupEnd();
      }
      return response;
    }
    async _handleInstall(request, handler) {
      this._useDefaultCacheabilityPluginIfNeeded();
      const response = await handler.fetch(request);
      const wasCached = await handler.cachePut(request, response.clone());
      if (!wasCached) {
        throw new WorkboxError("bad-precaching-response", {
          url: request.url,
          status: response.status
        });
      }
      return response;
    }
    /**
     * This method is complex, as there a number of things to account for:
     *
     * The `plugins` array can be set at construction, and/or it might be added to
     * to at any time before the strategy is used.
     *
     * At the time the strategy is used (i.e. during an `install` event), there
     * needs to be at least one plugin that implements `cacheWillUpdate` in the
     * array, other than `copyRedirectedCacheableResponsesPlugin`.
     *
     * - If this method is called and there are no suitable `cacheWillUpdate`
     * plugins, we need to add `defaultPrecacheCacheabilityPlugin`.
     *
     * - If this method is called and there is exactly one `cacheWillUpdate`, then
     * we don't have to do anything (this might be a previously added
     * `defaultPrecacheCacheabilityPlugin`, or it might be a custom plugin).
     *
     * - If this method is called and there is more than one `cacheWillUpdate`,
     * then we need to check if one is `defaultPrecacheCacheabilityPlugin`. If so,
     * we need to remove it. (This situation is unlikely, but it could happen if
     * the strategy is used multiple times, the first without a `cacheWillUpdate`,
     * and then later on after manually adding a custom `cacheWillUpdate`.)
     *
     * See https://github.com/GoogleChrome/workbox/issues/2737 for more context.
     *
     * @private
     */
    _useDefaultCacheabilityPluginIfNeeded() {
      let defaultPluginIndex = null;
      let cacheWillUpdatePluginCount = 0;
      for (const [index, plugin] of this.plugins.entries()) {
        if (plugin === _PrecacheStrategy.copyRedirectedCacheableResponsesPlugin) {
          continue;
        }
        if (plugin === _PrecacheStrategy.defaultPrecacheCacheabilityPlugin) {
          defaultPluginIndex = index;
        }
        if (plugin.cacheWillUpdate) {
          cacheWillUpdatePluginCount++;
        }
      }
      if (cacheWillUpdatePluginCount === 0) {
        this.plugins.push(_PrecacheStrategy.defaultPrecacheCacheabilityPlugin);
      } else if (cacheWillUpdatePluginCount > 1 && defaultPluginIndex !== null) {
        this.plugins.splice(defaultPluginIndex, 1);
      }
    }
  };
  PrecacheStrategy.defaultPrecacheCacheabilityPlugin = {
    async cacheWillUpdate({ response }) {
      if (!response || response.status >= 400) {
        return null;
      }
      return response;
    }
  };
  PrecacheStrategy.copyRedirectedCacheableResponsesPlugin = {
    async cacheWillUpdate({ response }) {
      return response.redirected ? await copyResponse(response) : response;
    }
  };

  // node_modules/.pnpm/workbox-precaching@7.4.1/node_modules/workbox-precaching/PrecacheController.js
  var PrecacheController = class {
    /**
     * Create a new PrecacheController.
     *
     * @param {Object} [options]
     * @param {string} [options.cacheName] The cache to use for precaching.
     * @param {string} [options.plugins] Plugins to use when precaching as well
     * as responding to fetch events for precached assets.
     * @param {boolean} [options.fallbackToNetwork=true] Whether to attempt to
     * get the response from the network if there's a precache miss.
     */
    constructor({ cacheName, plugins = [], fallbackToNetwork = true } = {}) {
      this._urlsToCacheKeys = /* @__PURE__ */ new Map();
      this._urlsToCacheModes = /* @__PURE__ */ new Map();
      this._cacheKeysToIntegrities = /* @__PURE__ */ new Map();
      this._strategy = new PrecacheStrategy({
        cacheName: cacheNames.getPrecacheName(cacheName),
        plugins: [
          ...plugins,
          new PrecacheCacheKeyPlugin({ precacheController: this })
        ],
        fallbackToNetwork
      });
      this.install = this.install.bind(this);
      this.activate = this.activate.bind(this);
    }
    /**
     * @type {workbox-precaching.PrecacheStrategy} The strategy created by this controller and
     * used to cache assets and respond to fetch events.
     */
    get strategy() {
      return this._strategy;
    }
    /**
     * Adds items to the precache list, removing any duplicates and
     * stores the files in the
     * {@link workbox-core.cacheNames|"precache cache"} when the service
     * worker installs.
     *
     * This method can be called multiple times.
     *
     * @param {Array<Object|string>} [entries=[]] Array of entries to precache.
     */
    precache(entries) {
      this.addToCacheList(entries);
      if (!this._installAndActiveListenersAdded) {
        self.addEventListener("install", this.install);
        self.addEventListener("activate", this.activate);
        this._installAndActiveListenersAdded = true;
      }
    }
    /**
     * This method will add items to the precache list, removing duplicates
     * and ensuring the information is valid.
     *
     * @param {Array<workbox-precaching.PrecacheController.PrecacheEntry|string>} entries
     *     Array of entries to precache.
     */
    addToCacheList(entries) {
      if (true) {
        finalAssertExports.isArray(entries, {
          moduleName: "workbox-precaching",
          className: "PrecacheController",
          funcName: "addToCacheList",
          paramName: "entries"
        });
      }
      const urlsToWarnAbout = [];
      for (const entry of entries) {
        if (typeof entry === "string") {
          urlsToWarnAbout.push(entry);
        } else if (entry && entry.revision === void 0) {
          urlsToWarnAbout.push(entry.url);
        }
        const { cacheKey, url } = createCacheKey(entry);
        const cacheMode = typeof entry !== "string" && entry.revision ? "reload" : "default";
        if (this._urlsToCacheKeys.has(url) && this._urlsToCacheKeys.get(url) !== cacheKey) {
          throw new WorkboxError("add-to-cache-list-conflicting-entries", {
            firstEntry: this._urlsToCacheKeys.get(url),
            secondEntry: cacheKey
          });
        }
        if (typeof entry !== "string" && entry.integrity) {
          if (this._cacheKeysToIntegrities.has(cacheKey) && this._cacheKeysToIntegrities.get(cacheKey) !== entry.integrity) {
            throw new WorkboxError("add-to-cache-list-conflicting-integrities", {
              url
            });
          }
          this._cacheKeysToIntegrities.set(cacheKey, entry.integrity);
        }
        this._urlsToCacheKeys.set(url, cacheKey);
        this._urlsToCacheModes.set(url, cacheMode);
        if (urlsToWarnAbout.length > 0) {
          const warningMessage = `Workbox is precaching URLs without revision info: ${urlsToWarnAbout.join(", ")}
This is generally NOT safe. Learn more at https://bit.ly/wb-precache`;
          if (false) {
            console.warn(warningMessage);
          } else {
            logger.warn(warningMessage);
          }
        }
      }
    }
    /**
     * Precaches new and updated assets. Call this method from the service worker
     * install event.
     *
     * Note: this method calls `event.waitUntil()` for you, so you do not need
     * to call it yourself in your event handlers.
     *
     * @param {ExtendableEvent} event
     * @return {Promise<workbox-precaching.InstallResult>}
     */
    install(event) {
      return waitUntil(event, async () => {
        const installReportPlugin = new PrecacheInstallReportPlugin();
        this.strategy.plugins.push(installReportPlugin);
        for (const [url, cacheKey] of this._urlsToCacheKeys) {
          const integrity = this._cacheKeysToIntegrities.get(cacheKey);
          const cacheMode = this._urlsToCacheModes.get(url);
          const request = new Request(url, {
            integrity,
            cache: cacheMode,
            credentials: "same-origin"
          });
          await Promise.all(this.strategy.handleAll({
            params: { cacheKey },
            request,
            event
          }));
        }
        const { updatedURLs, notUpdatedURLs } = installReportPlugin;
        if (true) {
          printInstallDetails(updatedURLs, notUpdatedURLs);
        }
        return { updatedURLs, notUpdatedURLs };
      });
    }
    /**
     * Deletes assets that are no longer present in the current precache manifest.
     * Call this method from the service worker activate event.
     *
     * Note: this method calls `event.waitUntil()` for you, so you do not need
     * to call it yourself in your event handlers.
     *
     * @param {ExtendableEvent} event
     * @return {Promise<workbox-precaching.CleanupResult>}
     */
    activate(event) {
      return waitUntil(event, async () => {
        const cache = await self.caches.open(this.strategy.cacheName);
        const currentlyCachedRequests = await cache.keys();
        const expectedCacheKeys = new Set(this._urlsToCacheKeys.values());
        const deletedURLs = [];
        for (const request of currentlyCachedRequests) {
          if (!expectedCacheKeys.has(request.url)) {
            await cache.delete(request);
            deletedURLs.push(request.url);
          }
        }
        if (true) {
          printCleanupDetails(deletedURLs);
        }
        return { deletedURLs };
      });
    }
    /**
     * Returns a mapping of a precached URL to the corresponding cache key, taking
     * into account the revision information for the URL.
     *
     * @return {Map<string, string>} A URL to cache key mapping.
     */
    getURLsToCacheKeys() {
      return this._urlsToCacheKeys;
    }
    /**
     * Returns a list of all the URLs that have been precached by the current
     * service worker.
     *
     * @return {Array<string>} The precached URLs.
     */
    getCachedURLs() {
      return [...this._urlsToCacheKeys.keys()];
    }
    /**
     * Returns the cache key used for storing a given URL. If that URL is
     * unversioned, like `/index.html', then the cache key will be the original
     * URL with a search parameter appended to it.
     *
     * @param {string} url A URL whose cache key you want to look up.
     * @return {string} The versioned URL that corresponds to a cache key
     * for the original URL, or undefined if that URL isn't precached.
     */
    getCacheKeyForURL(url) {
      const urlObject = new URL(url, location.href);
      return this._urlsToCacheKeys.get(urlObject.href);
    }
    /**
     * @param {string} url A cache key whose SRI you want to look up.
     * @return {string} The subresource integrity associated with the cache key,
     * or undefined if it's not set.
     */
    getIntegrityForCacheKey(cacheKey) {
      return this._cacheKeysToIntegrities.get(cacheKey);
    }
    /**
     * This acts as a drop-in replacement for
     * [`cache.match()`](https://developer.mozilla.org/en-US/docs/Web/API/Cache/match)
     * with the following differences:
     *
     * - It knows what the name of the precache is, and only checks in that cache.
     * - It allows you to pass in an "original" URL without versioning parameters,
     * and it will automatically look up the correct cache key for the currently
     * active revision of that URL.
     *
     * E.g., `matchPrecache('index.html')` will find the correct precached
     * response for the currently active service worker, even if the actual cache
     * key is `'/index.html?__WB_REVISION__=1234abcd'`.
     *
     * @param {string|Request} request The key (without revisioning parameters)
     * to look up in the precache.
     * @return {Promise<Response|undefined>}
     */
    async matchPrecache(request) {
      const url = request instanceof Request ? request.url : request;
      const cacheKey = this.getCacheKeyForURL(url);
      if (cacheKey) {
        const cache = await self.caches.open(this.strategy.cacheName);
        return cache.match(cacheKey);
      }
      return void 0;
    }
    /**
     * Returns a function that looks up `url` in the precache (taking into
     * account revision information), and returns the corresponding `Response`.
     *
     * @param {string} url The precached URL which will be used to lookup the
     * `Response`.
     * @return {workbox-routing~handlerCallback}
     */
    createHandlerBoundToURL(url) {
      const cacheKey = this.getCacheKeyForURL(url);
      if (!cacheKey) {
        throw new WorkboxError("non-precached-url", { url });
      }
      return (options) => {
        options.request = new Request(url);
        options.params = Object.assign({ cacheKey }, options.params);
        return this.strategy.handle(options);
      };
    }
  };

  // node_modules/.pnpm/workbox-precaching@7.4.1/node_modules/workbox-precaching/utils/getOrCreatePrecacheController.js
  var precacheController;
  var getOrCreatePrecacheController = () => {
    if (!precacheController) {
      precacheController = new PrecacheController();
    }
    return precacheController;
  };

  // node_modules/.pnpm/workbox-routing@7.4.1/node_modules/workbox-routing/_version.js
  try {
    self["workbox:routing:7.4.0"] && _();
  } catch (e) {
  }

  // node_modules/.pnpm/workbox-routing@7.4.1/node_modules/workbox-routing/utils/constants.js
  var defaultMethod = "GET";
  var validMethods = [
    "DELETE",
    "GET",
    "HEAD",
    "PATCH",
    "POST",
    "PUT"
  ];

  // node_modules/.pnpm/workbox-routing@7.4.1/node_modules/workbox-routing/utils/normalizeHandler.js
  var normalizeHandler = (handler) => {
    if (handler && typeof handler === "object") {
      if (true) {
        finalAssertExports.hasMethod(handler, "handle", {
          moduleName: "workbox-routing",
          className: "Route",
          funcName: "constructor",
          paramName: "handler"
        });
      }
      return handler;
    } else {
      if (true) {
        finalAssertExports.isType(handler, "function", {
          moduleName: "workbox-routing",
          className: "Route",
          funcName: "constructor",
          paramName: "handler"
        });
      }
      return { handle: handler };
    }
  };

  // node_modules/.pnpm/workbox-routing@7.4.1/node_modules/workbox-routing/Route.js
  var Route = class {
    /**
     * Constructor for Route class.
     *
     * @param {workbox-routing~matchCallback} match
     * A callback function that determines whether the route matches a given
     * `fetch` event by returning a non-falsy value.
     * @param {workbox-routing~handlerCallback} handler A callback
     * function that returns a Promise resolving to a Response.
     * @param {string} [method='GET'] The HTTP method to match the Route
     * against.
     */
    constructor(match, handler, method = defaultMethod) {
      if (true) {
        finalAssertExports.isType(match, "function", {
          moduleName: "workbox-routing",
          className: "Route",
          funcName: "constructor",
          paramName: "match"
        });
        if (method) {
          finalAssertExports.isOneOf(method, validMethods, { paramName: "method" });
        }
      }
      this.handler = normalizeHandler(handler);
      this.match = match;
      this.method = method;
    }
    /**
     *
     * @param {workbox-routing-handlerCallback} handler A callback
     * function that returns a Promise resolving to a Response
     */
    setCatchHandler(handler) {
      this.catchHandler = normalizeHandler(handler);
    }
  };

  // node_modules/.pnpm/workbox-routing@7.4.1/node_modules/workbox-routing/RegExpRoute.js
  var RegExpRoute = class extends Route {
    /**
     * If the regular expression contains
     * [capture groups]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp#grouping-back-references},
     * the captured values will be passed to the
     * {@link workbox-routing~handlerCallback} `params`
     * argument.
     *
     * @param {RegExp} regExp The regular expression to match against URLs.
     * @param {workbox-routing~handlerCallback} handler A callback
     * function that returns a Promise resulting in a Response.
     * @param {string} [method='GET'] The HTTP method to match the Route
     * against.
     */
    constructor(regExp, handler, method) {
      if (true) {
        finalAssertExports.isInstance(regExp, RegExp, {
          moduleName: "workbox-routing",
          className: "RegExpRoute",
          funcName: "constructor",
          paramName: "pattern"
        });
      }
      const match = ({ url }) => {
        const result = regExp.exec(url.href);
        if (!result) {
          return;
        }
        if (url.origin !== location.origin && result.index !== 0) {
          if (true) {
            logger.debug(`The regular expression '${regExp.toString()}' only partially matched against the cross-origin URL '${url.toString()}'. RegExpRoute's will only handle cross-origin requests if they match the entire URL.`);
          }
          return;
        }
        return result.slice(1);
      };
      super(match, handler, method);
    }
  };

  // node_modules/.pnpm/workbox-routing@7.4.1/node_modules/workbox-routing/Router.js
  var Router = class {
    /**
     * Initializes a new Router.
     */
    constructor() {
      this._routes = /* @__PURE__ */ new Map();
      this._defaultHandlerMap = /* @__PURE__ */ new Map();
    }
    /**
     * @return {Map<string, Array<workbox-routing.Route>>} routes A `Map` of HTTP
     * method name ('GET', etc.) to an array of all the corresponding `Route`
     * instances that are registered.
     */
    get routes() {
      return this._routes;
    }
    /**
     * Adds a fetch event listener to respond to events when a route matches
     * the event's request.
     */
    addFetchListener() {
      self.addEventListener("fetch", ((event) => {
        const { request } = event;
        const responsePromise = this.handleRequest({ request, event });
        if (responsePromise) {
          event.respondWith(responsePromise);
        }
      }));
    }
    /**
     * Adds a message event listener for URLs to cache from the window.
     * This is useful to cache resources loaded on the page prior to when the
     * service worker started controlling it.
     *
     * The format of the message data sent from the window should be as follows.
     * Where the `urlsToCache` array may consist of URL strings or an array of
     * URL string + `requestInit` object (the same as you'd pass to `fetch()`).
     *
     * ```
     * {
     *   type: 'CACHE_URLS',
     *   payload: {
     *     urlsToCache: [
     *       './script1.js',
     *       './script2.js',
     *       ['./script3.js', {mode: 'no-cors'}],
     *     ],
     *   },
     * }
     * ```
     */
    addCacheListener() {
      self.addEventListener("message", ((event) => {
        if (event.data && event.data.type === "CACHE_URLS") {
          const { payload } = event.data;
          if (true) {
            logger.debug(`Caching URLs from the window`, payload.urlsToCache);
          }
          const requestPromises = Promise.all(payload.urlsToCache.map((entry) => {
            if (typeof entry === "string") {
              entry = [entry];
            }
            const request = new Request(...entry);
            return this.handleRequest({ request, event });
          }));
          event.waitUntil(requestPromises);
          if (event.ports && event.ports[0]) {
            void requestPromises.then(() => event.ports[0].postMessage(true));
          }
        }
      }));
    }
    /**
     * Apply the routing rules to a FetchEvent object to get a Response from an
     * appropriate Route's handler.
     *
     * @param {Object} options
     * @param {Request} options.request The request to handle.
     * @param {ExtendableEvent} options.event The event that triggered the
     *     request.
     * @return {Promise<Response>|undefined} A promise is returned if a
     *     registered route can handle the request. If there is no matching
     *     route and there's no `defaultHandler`, `undefined` is returned.
     */
    handleRequest({ request, event }) {
      if (true) {
        finalAssertExports.isInstance(request, Request, {
          moduleName: "workbox-routing",
          className: "Router",
          funcName: "handleRequest",
          paramName: "options.request"
        });
      }
      const url = new URL(request.url, location.href);
      if (!url.protocol.startsWith("http")) {
        if (true) {
          logger.debug(`Workbox Router only supports URLs that start with 'http'.`);
        }
        return;
      }
      const sameOrigin = url.origin === location.origin;
      const { params, route } = this.findMatchingRoute({
        event,
        request,
        sameOrigin,
        url
      });
      let handler = route && route.handler;
      const debugMessages = [];
      if (true) {
        if (handler) {
          debugMessages.push([`Found a route to handle this request:`, route]);
          if (params) {
            debugMessages.push([
              `Passing the following params to the route's handler:`,
              params
            ]);
          }
        }
      }
      const method = request.method;
      if (!handler && this._defaultHandlerMap.has(method)) {
        if (true) {
          debugMessages.push(`Failed to find a matching route. Falling back to the default handler for ${method}.`);
        }
        handler = this._defaultHandlerMap.get(method);
      }
      if (!handler) {
        if (true) {
          logger.debug(`No route found for: ${getFriendlyURL(url)}`);
        }
        return;
      }
      if (true) {
        logger.groupCollapsed(`Router is responding to: ${getFriendlyURL(url)}`);
        debugMessages.forEach((msg) => {
          if (Array.isArray(msg)) {
            logger.log(...msg);
          } else {
            logger.log(msg);
          }
        });
        logger.groupEnd();
      }
      let responsePromise;
      try {
        responsePromise = handler.handle({ url, request, event, params });
      } catch (err) {
        responsePromise = Promise.reject(err);
      }
      const catchHandler = route && route.catchHandler;
      if (responsePromise instanceof Promise && (this._catchHandler || catchHandler)) {
        responsePromise = responsePromise.catch(async (err) => {
          if (catchHandler) {
            if (true) {
              logger.groupCollapsed(`Error thrown when responding to:  ${getFriendlyURL(url)}. Falling back to route's Catch Handler.`);
              logger.error(`Error thrown by:`, route);
              logger.error(err);
              logger.groupEnd();
            }
            try {
              return await catchHandler.handle({ url, request, event, params });
            } catch (catchErr) {
              if (catchErr instanceof Error) {
                err = catchErr;
              }
            }
          }
          if (this._catchHandler) {
            if (true) {
              logger.groupCollapsed(`Error thrown when responding to:  ${getFriendlyURL(url)}. Falling back to global Catch Handler.`);
              logger.error(`Error thrown by:`, route);
              logger.error(err);
              logger.groupEnd();
            }
            return this._catchHandler.handle({ url, request, event });
          }
          throw err;
        });
      }
      return responsePromise;
    }
    /**
     * Checks a request and URL (and optionally an event) against the list of
     * registered routes, and if there's a match, returns the corresponding
     * route along with any params generated by the match.
     *
     * @param {Object} options
     * @param {URL} options.url
     * @param {boolean} options.sameOrigin The result of comparing `url.origin`
     *     against the current origin.
     * @param {Request} options.request The request to match.
     * @param {Event} options.event The corresponding event.
     * @return {Object} An object with `route` and `params` properties.
     *     They are populated if a matching route was found or `undefined`
     *     otherwise.
     */
    findMatchingRoute({ url, sameOrigin, request, event }) {
      const routes = this._routes.get(request.method) || [];
      for (const route of routes) {
        let params;
        const matchResult = route.match({ url, sameOrigin, request, event });
        if (matchResult) {
          if (true) {
            if (matchResult instanceof Promise) {
              logger.warn(`While routing ${getFriendlyURL(url)}, an async matchCallback function was used. Please convert the following route to use a synchronous matchCallback function:`, route);
            }
          }
          params = matchResult;
          if (Array.isArray(params) && params.length === 0) {
            params = void 0;
          } else if (matchResult.constructor === Object && // eslint-disable-line
          Object.keys(matchResult).length === 0) {
            params = void 0;
          } else if (typeof matchResult === "boolean") {
            params = void 0;
          }
          return { route, params };
        }
      }
      return {};
    }
    /**
     * Define a default `handler` that's called when no routes explicitly
     * match the incoming request.
     *
     * Each HTTP method ('GET', 'POST', etc.) gets its own default handler.
     *
     * Without a default handler, unmatched requests will go against the
     * network as if there were no service worker present.
     *
     * @param {workbox-routing~handlerCallback} handler A callback
     * function that returns a Promise resulting in a Response.
     * @param {string} [method='GET'] The HTTP method to associate with this
     * default handler. Each method has its own default.
     */
    setDefaultHandler(handler, method = defaultMethod) {
      this._defaultHandlerMap.set(method, normalizeHandler(handler));
    }
    /**
     * If a Route throws an error while handling a request, this `handler`
     * will be called and given a chance to provide a response.
     *
     * @param {workbox-routing~handlerCallback} handler A callback
     * function that returns a Promise resulting in a Response.
     */
    setCatchHandler(handler) {
      this._catchHandler = normalizeHandler(handler);
    }
    /**
     * Registers a route with the router.
     *
     * @param {workbox-routing.Route} route The route to register.
     */
    registerRoute(route) {
      if (true) {
        finalAssertExports.isType(route, "object", {
          moduleName: "workbox-routing",
          className: "Router",
          funcName: "registerRoute",
          paramName: "route"
        });
        finalAssertExports.hasMethod(route, "match", {
          moduleName: "workbox-routing",
          className: "Router",
          funcName: "registerRoute",
          paramName: "route"
        });
        finalAssertExports.isType(route.handler, "object", {
          moduleName: "workbox-routing",
          className: "Router",
          funcName: "registerRoute",
          paramName: "route"
        });
        finalAssertExports.hasMethod(route.handler, "handle", {
          moduleName: "workbox-routing",
          className: "Router",
          funcName: "registerRoute",
          paramName: "route.handler"
        });
        finalAssertExports.isType(route.method, "string", {
          moduleName: "workbox-routing",
          className: "Router",
          funcName: "registerRoute",
          paramName: "route.method"
        });
      }
      if (!this._routes.has(route.method)) {
        this._routes.set(route.method, []);
      }
      this._routes.get(route.method).push(route);
    }
    /**
     * Unregisters a route with the router.
     *
     * @param {workbox-routing.Route} route The route to unregister.
     */
    unregisterRoute(route) {
      if (!this._routes.has(route.method)) {
        throw new WorkboxError("unregister-route-but-not-found-with-method", {
          method: route.method
        });
      }
      const routeIndex = this._routes.get(route.method).indexOf(route);
      if (routeIndex > -1) {
        this._routes.get(route.method).splice(routeIndex, 1);
      } else {
        throw new WorkboxError("unregister-route-route-not-registered");
      }
    }
  };

  // node_modules/.pnpm/workbox-routing@7.4.1/node_modules/workbox-routing/utils/getOrCreateDefaultRouter.js
  var defaultRouter;
  var getOrCreateDefaultRouter = () => {
    if (!defaultRouter) {
      defaultRouter = new Router();
      defaultRouter.addFetchListener();
      defaultRouter.addCacheListener();
    }
    return defaultRouter;
  };

  // node_modules/.pnpm/workbox-routing@7.4.1/node_modules/workbox-routing/registerRoute.js
  function registerRoute(capture, handler, method) {
    let route;
    if (typeof capture === "string") {
      const captureUrl = new URL(capture, location.href);
      if (true) {
        if (!(capture.startsWith("/") || capture.startsWith("http"))) {
          throw new WorkboxError("invalid-string", {
            moduleName: "workbox-routing",
            funcName: "registerRoute",
            paramName: "capture"
          });
        }
        const valueToCheck = capture.startsWith("http") ? captureUrl.pathname : capture;
        const wildcards = "[*:?+]";
        if (new RegExp(`${wildcards}`).exec(valueToCheck)) {
          logger.debug(`The '$capture' parameter contains an Express-style wildcard character (${wildcards}). Strings are now always interpreted as exact matches; use a RegExp for partial or wildcard matches.`);
        }
      }
      const matchCallback = ({ url }) => {
        if (true) {
          if (url.pathname === captureUrl.pathname && url.origin !== captureUrl.origin) {
            logger.debug(`${capture} only partially matches the cross-origin URL ${url.toString()}. This route will only handle cross-origin requests if they match the entire URL.`);
          }
        }
        return url.href === captureUrl.href;
      };
      route = new Route(matchCallback, handler, method);
    } else if (capture instanceof RegExp) {
      route = new RegExpRoute(capture, handler, method);
    } else if (typeof capture === "function") {
      route = new Route(capture, handler, method);
    } else if (capture instanceof Route) {
      route = capture;
    } else {
      throw new WorkboxError("unsupported-route-type", {
        moduleName: "workbox-routing",
        funcName: "registerRoute",
        paramName: "capture"
      });
    }
    const defaultRouter2 = getOrCreateDefaultRouter();
    defaultRouter2.registerRoute(route);
    return route;
  }

  // node_modules/.pnpm/workbox-precaching@7.4.1/node_modules/workbox-precaching/utils/removeIgnoredSearchParams.js
  function removeIgnoredSearchParams(urlObject, ignoreURLParametersMatching = []) {
    for (const paramName of [...urlObject.searchParams.keys()]) {
      if (ignoreURLParametersMatching.some((regExp) => regExp.test(paramName))) {
        urlObject.searchParams.delete(paramName);
      }
    }
    return urlObject;
  }

  // node_modules/.pnpm/workbox-precaching@7.4.1/node_modules/workbox-precaching/utils/generateURLVariations.js
  function* generateURLVariations(url, { ignoreURLParametersMatching = [/^utm_/, /^fbclid$/], directoryIndex = "index.html", cleanURLs = true, urlManipulation } = {}) {
    const urlObject = new URL(url, location.href);
    urlObject.hash = "";
    yield urlObject.href;
    const urlWithoutIgnoredParams = removeIgnoredSearchParams(urlObject, ignoreURLParametersMatching);
    yield urlWithoutIgnoredParams.href;
    if (directoryIndex && urlWithoutIgnoredParams.pathname.endsWith("/")) {
      const directoryURL = new URL(urlWithoutIgnoredParams.href);
      directoryURL.pathname += directoryIndex;
      yield directoryURL.href;
    }
    if (cleanURLs) {
      const cleanURL = new URL(urlWithoutIgnoredParams.href);
      cleanURL.pathname += ".html";
      yield cleanURL.href;
    }
    if (urlManipulation) {
      const additionalURLs = urlManipulation({ url: urlObject });
      for (const urlToAttempt of additionalURLs) {
        yield urlToAttempt.href;
      }
    }
  }

  // node_modules/.pnpm/workbox-precaching@7.4.1/node_modules/workbox-precaching/PrecacheRoute.js
  var PrecacheRoute = class extends Route {
    /**
     * @param {PrecacheController} precacheController A `PrecacheController`
     * instance used to both match requests and respond to fetch events.
     * @param {Object} [options] Options to control how requests are matched
     * against the list of precached URLs.
     * @param {string} [options.directoryIndex=index.html] The `directoryIndex` will
     * check cache entries for a URLs ending with '/' to see if there is a hit when
     * appending the `directoryIndex` value.
     * @param {Array<RegExp>} [options.ignoreURLParametersMatching=[/^utm_/, /^fbclid$/]] An
     * array of regex's to remove search params when looking for a cache match.
     * @param {boolean} [options.cleanURLs=true] The `cleanURLs` option will
     * check the cache for the URL with a `.html` added to the end of the end.
     * @param {workbox-precaching~urlManipulation} [options.urlManipulation]
     * This is a function that should take a URL and return an array of
     * alternative URLs that should be checked for precache matches.
     */
    constructor(precacheController2, options) {
      const match = ({ request }) => {
        const urlsToCacheKeys = precacheController2.getURLsToCacheKeys();
        for (const possibleURL of generateURLVariations(request.url, options)) {
          const cacheKey = urlsToCacheKeys.get(possibleURL);
          if (cacheKey) {
            const integrity = precacheController2.getIntegrityForCacheKey(cacheKey);
            return { cacheKey, integrity };
          }
        }
        if (true) {
          logger.debug(`Precaching did not find a match for ` + getFriendlyURL(request.url));
        }
        return;
      };
      super(match, precacheController2.strategy);
    }
  };

  // node_modules/.pnpm/workbox-precaching@7.4.1/node_modules/workbox-precaching/addRoute.js
  function addRoute(options) {
    const precacheController2 = getOrCreatePrecacheController();
    const precacheRoute = new PrecacheRoute(precacheController2, options);
    registerRoute(precacheRoute);
  }

  // node_modules/.pnpm/workbox-precaching@7.4.1/node_modules/workbox-precaching/precache.js
  function precache(entries) {
    const precacheController2 = getOrCreatePrecacheController();
    precacheController2.precache(entries);
  }

  // node_modules/.pnpm/workbox-precaching@7.4.1/node_modules/workbox-precaching/precacheAndRoute.js
  function precacheAndRoute(entries, options) {
    precache(entries);
    addRoute(options);
  }

  // node_modules/.pnpm/workbox-strategies@7.4.1/node_modules/workbox-strategies/utils/messages.js
  var messages2 = {
    strategyStart: (strategyName, request) => `Using ${strategyName} to respond to '${getFriendlyURL(request.url)}'`,
    printFinalResponse: (response) => {
      if (response) {
        logger.groupCollapsed(`View the final response here.`);
        logger.log(response || "[No response returned]");
        logger.groupEnd();
      }
    }
  };

  // node_modules/.pnpm/workbox-strategies@7.4.1/node_modules/workbox-strategies/plugins/cacheOkAndOpaquePlugin.js
  var cacheOkAndOpaquePlugin = {
    /**
     * Returns a valid response (to allow caching) if the status is 200 (OK) or
     * 0 (opaque).
     *
     * @param {Object} options
     * @param {Response} options.response
     * @return {Response|null}
     *
     * @private
     */
    cacheWillUpdate: async ({ response }) => {
      if (response.status === 200 || response.status === 0) {
        return response;
      }
      return null;
    }
  };

  // node_modules/.pnpm/workbox-strategies@7.4.1/node_modules/workbox-strategies/StaleWhileRevalidate.js
  var StaleWhileRevalidate = class extends Strategy {
    /**
     * @param {Object} [options]
     * @param {string} [options.cacheName] Cache name to store and retrieve
     * requests. Defaults to cache names provided by
     * {@link workbox-core.cacheNames}.
     * @param {Array<Object>} [options.plugins] [Plugins]{@link https://developers.google.com/web/tools/workbox/guides/using-plugins}
     * to use in conjunction with this caching strategy.
     * @param {Object} [options.fetchOptions] Values passed along to the
     * [`init`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters)
     * of [non-navigation](https://github.com/GoogleChrome/workbox/issues/1796)
     * `fetch()` requests made by this strategy.
     * @param {Object} [options.matchOptions] [`CacheQueryOptions`](https://w3c.github.io/ServiceWorker/#dictdef-cachequeryoptions)
     */
    constructor(options = {}) {
      super(options);
      if (!this.plugins.some((p) => "cacheWillUpdate" in p)) {
        this.plugins.unshift(cacheOkAndOpaquePlugin);
      }
    }
    /**
     * @private
     * @param {Request|string} request A request to run this strategy for.
     * @param {workbox-strategies.StrategyHandler} handler The event that
     *     triggered the request.
     * @return {Promise<Response>}
     */
    async _handle(request, handler) {
      const logs = [];
      if (true) {
        finalAssertExports.isInstance(request, Request, {
          moduleName: "workbox-strategies",
          className: this.constructor.name,
          funcName: "handle",
          paramName: "request"
        });
      }
      const fetchAndCachePromise = handler.fetchAndCachePut(request).catch(() => {
      });
      void handler.waitUntil(fetchAndCachePromise);
      let response = await handler.cacheMatch(request);
      let error;
      if (response) {
        if (true) {
          logs.push(`Found a cached response in the '${this.cacheName}' cache. Will update with the network response in the background.`);
        }
      } else {
        if (true) {
          logs.push(`No response found in the '${this.cacheName}' cache. Will wait for the network response.`);
        }
        try {
          response = await fetchAndCachePromise;
        } catch (err) {
          if (err instanceof Error) {
            error = err;
          }
        }
      }
      if (true) {
        logger.groupCollapsed(messages2.strategyStart(this.constructor.name, request));
        for (const log of logs) {
          logger.log(log);
        }
        messages2.printFinalResponse(response);
        logger.groupEnd();
      }
      if (!response) {
        throw new WorkboxError("no-response", { url: request.url, error });
      }
      return response;
    }
  };

  // node_modules/.pnpm/idb@7.1.1/node_modules/idb/build/wrap-idb-value.js
  var instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);
  var idbProxyableTypes;
  var cursorAdvanceMethods;
  function getIdbProxyableTypes() {
    return idbProxyableTypes || (idbProxyableTypes = [
      IDBDatabase,
      IDBObjectStore,
      IDBIndex,
      IDBCursor,
      IDBTransaction
    ]);
  }
  function getCursorAdvanceMethods() {
    return cursorAdvanceMethods || (cursorAdvanceMethods = [
      IDBCursor.prototype.advance,
      IDBCursor.prototype.continue,
      IDBCursor.prototype.continuePrimaryKey
    ]);
  }
  var cursorRequestMap = /* @__PURE__ */ new WeakMap();
  var transactionDoneMap = /* @__PURE__ */ new WeakMap();
  var transactionStoreNamesMap = /* @__PURE__ */ new WeakMap();
  var transformCache = /* @__PURE__ */ new WeakMap();
  var reverseTransformCache = /* @__PURE__ */ new WeakMap();
  function promisifyRequest(request) {
    const promise = new Promise((resolve, reject) => {
      const unlisten = () => {
        request.removeEventListener("success", success);
        request.removeEventListener("error", error);
      };
      const success = () => {
        resolve(wrap(request.result));
        unlisten();
      };
      const error = () => {
        reject(request.error);
        unlisten();
      };
      request.addEventListener("success", success);
      request.addEventListener("error", error);
    });
    promise.then((value) => {
      if (value instanceof IDBCursor) {
        cursorRequestMap.set(value, request);
      }
    }).catch(() => {
    });
    reverseTransformCache.set(promise, request);
    return promise;
  }
  function cacheDonePromiseForTransaction(tx) {
    if (transactionDoneMap.has(tx))
      return;
    const done = new Promise((resolve, reject) => {
      const unlisten = () => {
        tx.removeEventListener("complete", complete);
        tx.removeEventListener("error", error);
        tx.removeEventListener("abort", error);
      };
      const complete = () => {
        resolve();
        unlisten();
      };
      const error = () => {
        reject(tx.error || new DOMException("AbortError", "AbortError"));
        unlisten();
      };
      tx.addEventListener("complete", complete);
      tx.addEventListener("error", error);
      tx.addEventListener("abort", error);
    });
    transactionDoneMap.set(tx, done);
  }
  var idbProxyTraps = {
    get(target, prop, receiver) {
      if (target instanceof IDBTransaction) {
        if (prop === "done")
          return transactionDoneMap.get(target);
        if (prop === "objectStoreNames") {
          return target.objectStoreNames || transactionStoreNamesMap.get(target);
        }
        if (prop === "store") {
          return receiver.objectStoreNames[1] ? void 0 : receiver.objectStore(receiver.objectStoreNames[0]);
        }
      }
      return wrap(target[prop]);
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
    has(target, prop) {
      if (target instanceof IDBTransaction && (prop === "done" || prop === "store")) {
        return true;
      }
      return prop in target;
    }
  };
  function replaceTraps(callback) {
    idbProxyTraps = callback(idbProxyTraps);
  }
  function wrapFunction(func) {
    if (func === IDBDatabase.prototype.transaction && !("objectStoreNames" in IDBTransaction.prototype)) {
      return function(storeNames, ...args) {
        const tx = func.call(unwrap(this), storeNames, ...args);
        transactionStoreNamesMap.set(tx, storeNames.sort ? storeNames.sort() : [storeNames]);
        return wrap(tx);
      };
    }
    if (getCursorAdvanceMethods().includes(func)) {
      return function(...args) {
        func.apply(unwrap(this), args);
        return wrap(cursorRequestMap.get(this));
      };
    }
    return function(...args) {
      return wrap(func.apply(unwrap(this), args));
    };
  }
  function transformCachableValue(value) {
    if (typeof value === "function")
      return wrapFunction(value);
    if (value instanceof IDBTransaction)
      cacheDonePromiseForTransaction(value);
    if (instanceOfAny(value, getIdbProxyableTypes()))
      return new Proxy(value, idbProxyTraps);
    return value;
  }
  function wrap(value) {
    if (value instanceof IDBRequest)
      return promisifyRequest(value);
    if (transformCache.has(value))
      return transformCache.get(value);
    const newValue = transformCachableValue(value);
    if (newValue !== value) {
      transformCache.set(value, newValue);
      reverseTransformCache.set(newValue, value);
    }
    return newValue;
  }
  var unwrap = (value) => reverseTransformCache.get(value);

  // node_modules/.pnpm/idb@7.1.1/node_modules/idb/build/index.js
  function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
    const request = indexedDB.open(name, version);
    const openPromise = wrap(request);
    if (upgrade) {
      request.addEventListener("upgradeneeded", (event) => {
        upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
      });
    }
    if (blocked) {
      request.addEventListener("blocked", (event) => blocked(
        // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
        event.oldVersion,
        event.newVersion,
        event
      ));
    }
    openPromise.then((db) => {
      if (terminated)
        db.addEventListener("close", () => terminated());
      if (blocking) {
        db.addEventListener("versionchange", (event) => blocking(event.oldVersion, event.newVersion, event));
      }
    }).catch(() => {
    });
    return openPromise;
  }
  function deleteDB(name, { blocked } = {}) {
    const request = indexedDB.deleteDatabase(name);
    if (blocked) {
      request.addEventListener("blocked", (event) => blocked(
        // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
        event.oldVersion,
        event
      ));
    }
    return wrap(request).then(() => void 0);
  }
  var readMethods = ["get", "getKey", "getAll", "getAllKeys", "count"];
  var writeMethods = ["put", "add", "delete", "clear"];
  var cachedMethods = /* @__PURE__ */ new Map();
  function getMethod(target, prop) {
    if (!(target instanceof IDBDatabase && !(prop in target) && typeof prop === "string")) {
      return;
    }
    if (cachedMethods.get(prop))
      return cachedMethods.get(prop);
    const targetFuncName = prop.replace(/FromIndex$/, "");
    const useIndex = prop !== targetFuncName;
    const isWrite = writeMethods.includes(targetFuncName);
    if (
      // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
      !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) || !(isWrite || readMethods.includes(targetFuncName))
    ) {
      return;
    }
    const method = async function(storeName, ...args) {
      const tx = this.transaction(storeName, isWrite ? "readwrite" : "readonly");
      let target2 = tx.store;
      if (useIndex)
        target2 = target2.index(args.shift());
      return (await Promise.all([
        target2[targetFuncName](...args),
        isWrite && tx.done
      ]))[0];
    };
    cachedMethods.set(prop, method);
    return method;
  }
  replaceTraps((oldTraps) => ({
    ...oldTraps,
    get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
    has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop)
  }));

  // node_modules/.pnpm/workbox-expiration@7.4.1/node_modules/workbox-expiration/_version.js
  try {
    self["workbox:expiration:7.4.0"] && _();
  } catch (e) {
  }

  // node_modules/.pnpm/workbox-expiration@7.4.1/node_modules/workbox-expiration/models/CacheTimestampsModel.js
  var DB_NAME = "workbox-expiration";
  var CACHE_OBJECT_STORE = "cache-entries";
  var normalizeURL = (unNormalizedUrl) => {
    const url = new URL(unNormalizedUrl, location.href);
    url.hash = "";
    return url.href;
  };
  var CacheTimestampsModel = class {
    /**
     *
     * @param {string} cacheName
     *
     * @private
     */
    constructor(cacheName) {
      this._db = null;
      this._cacheName = cacheName;
    }
    /**
     * Performs an upgrade of indexedDB.
     *
     * @param {IDBPDatabase<CacheDbSchema>} db
     *
     * @private
     */
    _upgradeDb(db) {
      const objStore = db.createObjectStore(CACHE_OBJECT_STORE, { keyPath: "id" });
      objStore.createIndex("cacheName", "cacheName", { unique: false });
      objStore.createIndex("timestamp", "timestamp", { unique: false });
    }
    /**
     * Performs an upgrade of indexedDB and deletes deprecated DBs.
     *
     * @param {IDBPDatabase<CacheDbSchema>} db
     *
     * @private
     */
    _upgradeDbAndDeleteOldDbs(db) {
      this._upgradeDb(db);
      if (this._cacheName) {
        void deleteDB(this._cacheName);
      }
    }
    /**
     * @param {string} url
     * @param {number} timestamp
     *
     * @private
     */
    async setTimestamp(url, timestamp) {
      url = normalizeURL(url);
      const entry = {
        url,
        timestamp,
        cacheName: this._cacheName,
        // Creating an ID from the URL and cache name won't be necessary once
        // Edge switches to Chromium and all browsers we support work with
        // array keyPaths.
        id: this._getId(url)
      };
      const db = await this.getDb();
      const tx = db.transaction(CACHE_OBJECT_STORE, "readwrite", {
        durability: "relaxed"
      });
      await tx.store.put(entry);
      await tx.done;
    }
    /**
     * Returns the timestamp stored for a given URL.
     *
     * @param {string} url
     * @return {number | undefined}
     *
     * @private
     */
    async getTimestamp(url) {
      const db = await this.getDb();
      const entry = await db.get(CACHE_OBJECT_STORE, this._getId(url));
      return entry === null || entry === void 0 ? void 0 : entry.timestamp;
    }
    /**
     * Iterates through all the entries in the object store (from newest to
     * oldest) and removes entries once either `maxCount` is reached or the
     * entry's timestamp is less than `minTimestamp`.
     *
     * @param {number} minTimestamp
     * @param {number} maxCount
     * @return {Array<string>}
     *
     * @private
     */
    async expireEntries(minTimestamp, maxCount) {
      const db = await this.getDb();
      let cursor = await db.transaction(CACHE_OBJECT_STORE).store.index("timestamp").openCursor(null, "prev");
      const entriesToDelete = [];
      let entriesNotDeletedCount = 0;
      while (cursor) {
        const result = cursor.value;
        if (result.cacheName === this._cacheName) {
          if (minTimestamp && result.timestamp < minTimestamp || maxCount && entriesNotDeletedCount >= maxCount) {
            entriesToDelete.push(cursor.value);
          } else {
            entriesNotDeletedCount++;
          }
        }
        cursor = await cursor.continue();
      }
      const urlsDeleted = [];
      for (const entry of entriesToDelete) {
        await db.delete(CACHE_OBJECT_STORE, entry.id);
        urlsDeleted.push(entry.url);
      }
      return urlsDeleted;
    }
    /**
     * Takes a URL and returns an ID that will be unique in the object store.
     *
     * @param {string} url
     * @return {string}
     *
     * @private
     */
    _getId(url) {
      return this._cacheName + "|" + normalizeURL(url);
    }
    /**
     * Returns an open connection to the database.
     *
     * @private
     */
    async getDb() {
      if (!this._db) {
        this._db = await openDB(DB_NAME, 1, {
          upgrade: this._upgradeDbAndDeleteOldDbs.bind(this)
        });
      }
      return this._db;
    }
  };

  // node_modules/.pnpm/workbox-expiration@7.4.1/node_modules/workbox-expiration/CacheExpiration.js
  var CacheExpiration = class {
    /**
     * To construct a new CacheExpiration instance you must provide at least
     * one of the `config` properties.
     *
     * @param {string} cacheName Name of the cache to apply restrictions to.
     * @param {Object} config
     * @param {number} [config.maxEntries] The maximum number of entries to cache.
     * Entries used the least will be removed as the maximum is reached.
     * @param {number} [config.maxAgeSeconds] The maximum age of an entry before
     * it's treated as stale and removed.
     * @param {Object} [config.matchOptions] The [`CacheQueryOptions`](https://developer.mozilla.org/en-US/docs/Web/API/Cache/delete#Parameters)
     * that will be used when calling `delete()` on the cache.
     */
    constructor(cacheName, config = {}) {
      this._isRunning = false;
      this._rerunRequested = false;
      if (true) {
        finalAssertExports.isType(cacheName, "string", {
          moduleName: "workbox-expiration",
          className: "CacheExpiration",
          funcName: "constructor",
          paramName: "cacheName"
        });
        if (!(config.maxEntries || config.maxAgeSeconds)) {
          throw new WorkboxError("max-entries-or-age-required", {
            moduleName: "workbox-expiration",
            className: "CacheExpiration",
            funcName: "constructor"
          });
        }
        if (config.maxEntries) {
          finalAssertExports.isType(config.maxEntries, "number", {
            moduleName: "workbox-expiration",
            className: "CacheExpiration",
            funcName: "constructor",
            paramName: "config.maxEntries"
          });
        }
        if (config.maxAgeSeconds) {
          finalAssertExports.isType(config.maxAgeSeconds, "number", {
            moduleName: "workbox-expiration",
            className: "CacheExpiration",
            funcName: "constructor",
            paramName: "config.maxAgeSeconds"
          });
        }
      }
      this._maxEntries = config.maxEntries;
      this._maxAgeSeconds = config.maxAgeSeconds;
      this._matchOptions = config.matchOptions;
      this._cacheName = cacheName;
      this._timestampModel = new CacheTimestampsModel(cacheName);
    }
    /**
     * Expires entries for the given cache and given criteria.
     */
    async expireEntries() {
      if (this._isRunning) {
        this._rerunRequested = true;
        return;
      }
      this._isRunning = true;
      const minTimestamp = this._maxAgeSeconds ? Date.now() - this._maxAgeSeconds * 1e3 : 0;
      const urlsExpired = await this._timestampModel.expireEntries(minTimestamp, this._maxEntries);
      const cache = await self.caches.open(this._cacheName);
      for (const url of urlsExpired) {
        await cache.delete(url, this._matchOptions);
      }
      if (true) {
        if (urlsExpired.length > 0) {
          logger.groupCollapsed(`Expired ${urlsExpired.length} ${urlsExpired.length === 1 ? "entry" : "entries"} and removed ${urlsExpired.length === 1 ? "it" : "them"} from the '${this._cacheName}' cache.`);
          logger.log(`Expired the following ${urlsExpired.length === 1 ? "URL" : "URLs"}:`);
          urlsExpired.forEach((url) => logger.log(`    ${url}`));
          logger.groupEnd();
        } else {
          logger.debug(`Cache expiration ran and found no entries to remove.`);
        }
      }
      this._isRunning = false;
      if (this._rerunRequested) {
        this._rerunRequested = false;
        dontWaitFor(this.expireEntries());
      }
    }
    /**
     * Update the timestamp for the given URL. This ensures the when
     * removing entries based on maximum entries, most recently used
     * is accurate or when expiring, the timestamp is up-to-date.
     *
     * @param {string} url
     */
    async updateTimestamp(url) {
      if (true) {
        finalAssertExports.isType(url, "string", {
          moduleName: "workbox-expiration",
          className: "CacheExpiration",
          funcName: "updateTimestamp",
          paramName: "url"
        });
      }
      await this._timestampModel.setTimestamp(url, Date.now());
    }
    /**
     * Can be used to check if a URL has expired or not before it's used.
     *
     * This requires a look up from IndexedDB, so can be slow.
     *
     * Note: This method will not remove the cached entry, call
     * `expireEntries()` to remove indexedDB and Cache entries.
     *
     * @param {string} url
     * @return {boolean}
     */
    async isURLExpired(url) {
      if (!this._maxAgeSeconds) {
        if (true) {
          throw new WorkboxError(`expired-test-without-max-age`, {
            methodName: "isURLExpired",
            paramName: "maxAgeSeconds"
          });
        }
        return false;
      } else {
        const timestamp = await this._timestampModel.getTimestamp(url);
        const expireOlderThan = Date.now() - this._maxAgeSeconds * 1e3;
        return timestamp !== void 0 ? timestamp < expireOlderThan : true;
      }
    }
    /**
     * Removes the IndexedDB object store used to keep track of cache expiration
     * metadata.
     */
    async delete() {
      this._rerunRequested = false;
      await this._timestampModel.expireEntries(Infinity);
    }
  };

  // node_modules/.pnpm/workbox-expiration@7.4.1/node_modules/workbox-expiration/ExpirationPlugin.js
  var ExpirationPlugin = class {
    /**
     * @param {ExpirationPluginOptions} config
     * @param {number} [config.maxEntries] The maximum number of entries to cache.
     * Entries used the least will be removed as the maximum is reached.
     * @param {number} [config.maxAgeSeconds] The maximum age of an entry before
     * it's treated as stale and removed.
     * @param {Object} [config.matchOptions] The [`CacheQueryOptions`](https://developer.mozilla.org/en-US/docs/Web/API/Cache/delete#Parameters)
     * that will be used when calling `delete()` on the cache.
     * @param {boolean} [config.purgeOnQuotaError] Whether to opt this cache in to
     * automatic deletion if the available storage quota has been exceeded.
     */
    constructor(config = {}) {
      this.cachedResponseWillBeUsed = async ({ event, request, cacheName, cachedResponse }) => {
        if (!cachedResponse) {
          return null;
        }
        const isFresh = this._isResponseDateFresh(cachedResponse);
        const cacheExpiration = this._getCacheExpiration(cacheName);
        dontWaitFor(cacheExpiration.expireEntries());
        const updateTimestampDone = cacheExpiration.updateTimestamp(request.url);
        if (event) {
          try {
            event.waitUntil(updateTimestampDone);
          } catch (error) {
            if (true) {
              if ("request" in event) {
                logger.warn(`Unable to ensure service worker stays alive when updating cache entry for '${getFriendlyURL(event.request.url)}'.`);
              }
            }
          }
        }
        return isFresh ? cachedResponse : null;
      };
      this.cacheDidUpdate = async ({ cacheName, request }) => {
        if (true) {
          finalAssertExports.isType(cacheName, "string", {
            moduleName: "workbox-expiration",
            className: "Plugin",
            funcName: "cacheDidUpdate",
            paramName: "cacheName"
          });
          finalAssertExports.isInstance(request, Request, {
            moduleName: "workbox-expiration",
            className: "Plugin",
            funcName: "cacheDidUpdate",
            paramName: "request"
          });
        }
        const cacheExpiration = this._getCacheExpiration(cacheName);
        await cacheExpiration.updateTimestamp(request.url);
        await cacheExpiration.expireEntries();
      };
      if (true) {
        if (!(config.maxEntries || config.maxAgeSeconds)) {
          throw new WorkboxError("max-entries-or-age-required", {
            moduleName: "workbox-expiration",
            className: "Plugin",
            funcName: "constructor"
          });
        }
        if (config.maxEntries) {
          finalAssertExports.isType(config.maxEntries, "number", {
            moduleName: "workbox-expiration",
            className: "Plugin",
            funcName: "constructor",
            paramName: "config.maxEntries"
          });
        }
        if (config.maxAgeSeconds) {
          finalAssertExports.isType(config.maxAgeSeconds, "number", {
            moduleName: "workbox-expiration",
            className: "Plugin",
            funcName: "constructor",
            paramName: "config.maxAgeSeconds"
          });
        }
      }
      this._config = config;
      this._maxAgeSeconds = config.maxAgeSeconds;
      this._cacheExpirations = /* @__PURE__ */ new Map();
      if (config.purgeOnQuotaError) {
        registerQuotaErrorCallback(() => this.deleteCacheAndMetadata());
      }
    }
    /**
     * A simple helper method to return a CacheExpiration instance for a given
     * cache name.
     *
     * @param {string} cacheName
     * @return {CacheExpiration}
     *
     * @private
     */
    _getCacheExpiration(cacheName) {
      if (cacheName === cacheNames.getRuntimeName()) {
        throw new WorkboxError("expire-custom-caches-only");
      }
      let cacheExpiration = this._cacheExpirations.get(cacheName);
      if (!cacheExpiration) {
        cacheExpiration = new CacheExpiration(cacheName, this._config);
        this._cacheExpirations.set(cacheName, cacheExpiration);
      }
      return cacheExpiration;
    }
    /**
     * @param {Response} cachedResponse
     * @return {boolean}
     *
     * @private
     */
    _isResponseDateFresh(cachedResponse) {
      if (!this._maxAgeSeconds) {
        return true;
      }
      const dateHeaderTimestamp = this._getDateHeaderTimestamp(cachedResponse);
      if (dateHeaderTimestamp === null) {
        return true;
      }
      const now = Date.now();
      return dateHeaderTimestamp >= now - this._maxAgeSeconds * 1e3;
    }
    /**
     * This method will extract the data header and parse it into a useful
     * value.
     *
     * @param {Response} cachedResponse
     * @return {number|null}
     *
     * @private
     */
    _getDateHeaderTimestamp(cachedResponse) {
      if (!cachedResponse.headers.has("date")) {
        return null;
      }
      const dateHeader = cachedResponse.headers.get("date");
      const parsedDate = new Date(dateHeader);
      const headerTime = parsedDate.getTime();
      if (isNaN(headerTime)) {
        return null;
      }
      return headerTime;
    }
    /**
     * This is a helper method that performs two operations:
     *
     * - Deletes *all* the underlying Cache instances associated with this plugin
     * instance, by calling caches.delete() on your behalf.
     * - Deletes the metadata from IndexedDB used to keep track of expiration
     * details for each Cache instance.
     *
     * When using cache expiration, calling this method is preferable to calling
     * `caches.delete()` directly, since this will ensure that the IndexedDB
     * metadata is also cleanly removed and open IndexedDB instances are deleted.
     *
     * Note that if you're *not* using cache expiration for a given cache, calling
     * `caches.delete()` and passing in the cache's name should be sufficient.
     * There is no Workbox-specific method needed for cleanup in that case.
     */
    async deleteCacheAndMetadata() {
      for (const [cacheName, cacheExpiration] of this._cacheExpirations) {
        await self.caches.delete(cacheName);
        await cacheExpiration.delete();
      }
      this._cacheExpirations = /* @__PURE__ */ new Map();
    }
  };

  // node_modules/.pnpm/@c4h+weiwudi@1.2.0-rc.1_workbox-routing@7.4.1/node_modules/@c4h/weiwudi/dist/weiwudi-sw.es.js
  var Xt = "weiwudi.example.com";
  var xe = "map:";
  var rn = 1440 * 60 * 1e3;
  var Dn = "/v2/";
  var Eo = ["content-encoding", "content-length", "transfer-encoding", "set-cookie"];
  var _o = "x-weiwudi-";
  var jo = "WeiwudiStore";
  var ls = 1;
  var ds = (e) => Object.prototype.toString.call(e) === "[object ArrayBuffer]";
  var Ft = (e) => {
    const t = e;
    return !!t && typeof t == "object" && typeof t.key == "string" && ds(t.data) && typeof t.type == "string" && !!t.headers && typeof t.headers == "object";
  };
  var To = async (e) => ({
    data: await e.arrayBuffer(),
    type: e.type
  });
  var us = async (e) => ({
    key: e.key,
    ...await To(e.blob),
    headers: e.headers,
    ...e.parts ? { parts: e.parts } : {}
  });
  var fs = (e) => {
    if (Ft(e))
      return {
        key: e.key,
        blob: new Blob([e.data], e.type ? { type: e.type } : void 0),
        headers: e.headers,
        ...e.parts ? { parts: e.parts } : {}
      };
  };
  var Mo = (e) => e.kind === "legacy" || e.id.startsWith(xe);
  var bt = (e) => e.kind === "child" || e.parentId !== void 0;
  var Oe = (e) => {
    if (e.kind === "legacy" || e.kind === "style" || !("templates" in e.spec)) return;
    const t = e.spec;
    return t.type === void 0 ? { ...t, type: "tile" } : t;
  };
  var le = (e) => {
    if (e.kind !== "style" || !("templates" in e.spec)) return;
    const t = e.spec;
    return Array.isArray(t.children) ? t : { ...t, children: [] };
  };
  var $o = (e) => Oe(e)?.templates ?? [];
  var sn = async (e) => (await e.listSources()).reduce((t, n) => Math.max(t, n.order), 0) + 1;
  var Po = (e, t, n) => {
    const o = {
      id: e.id,
      type: e.type,
      templates: e.templates.slice(),
      count: e.count,
      bytes: e.bytes
    };
    return e.corslessUntil !== void 0 && e.corslessUntil > t && (o.corsless = true), o;
  };
  var Cn = "totals";
  var Lo = "limits";
  var Zt = "userAgent";
  var ps = (e) => {
    const t = e;
    return !!t && typeof t == "object" && typeof t.bytes == "number" && typeof t.pinnedBytes == "number" && typeof t.count == "number";
  };
  var ge = "sources";
  var Y = "resources";
  var Z = "entries";
  var Q = "bodies";
  var re = "regions";
  var Ae = "credentials";
  var ee = "kv";
  var Bo = "sourceIds";
  var Do = "rangeOnlySourceIds";
  var Co = "resourceId_pinned_accessedAt";
  var Yt = "pinned_accessedAt";
  var Uo = "pinned_fetchedAt";
  var zo = "resourceId_z";
  var Wt = "sourceId";
  var Un = () => {
    const e = new Error(`Opening database "${jo}" is blocked by another connection`);
    return e.name = "BlockedError", e;
  };
  var ms = (e) => {
    const t = (n) => e.objectStoreNames.contains(n);
    if (t(ge) || e.createObjectStore(ge, { keyPath: "id" }), !t(Y)) {
      const n = e.createObjectStore(Y, { keyPath: "id" });
      n.createIndex(Bo, "sourceIds", { multiEntry: true }), n.createIndex(Do, "rangeOnlySourceIds", { multiEntry: true });
    }
    if (!t(Z)) {
      const n = e.createObjectStore(Z, { keyPath: "key" });
      n.createIndex(Co, ["resourceId", "pinned", "accessedAt"]), n.createIndex(Yt, ["pinned", "accessedAt"]), n.createIndex(Uo, ["pinned", "fetchedAt"]), n.createIndex(zo, ["resourceId", "z"]);
    }
    t(Q) || e.createObjectStore(Q, { keyPath: "key" }), t(re) || e.createObjectStore(re, { keyPath: "id" }).createIndex(Wt, "sourceId"), t(Ae) || e.createObjectStore(Ae, { keyPath: "sourceId" }), t(ee) || e.createObjectStore(ee, { keyPath: "key" });
  };
  var F = (e) => new Promise((t, n) => {
    e.onsuccess = () => t(e.result), e.onerror = () => n(e.error);
  });
  var ye = (e) => new Promise((t, n) => {
    e.onsuccess = () => t(e.result), e.onerror = () => n(e.error);
  });
  var hs = (e, t) => e.accessedAt - t.accessedAt || (e.key < t.key ? -1 : e.key > t.key ? 1 : 0);
  var zn = (e, t, n) => {
    const o = [], r = {};
    let s = 0;
    for (const [c, d] of [...t].sort((l, u) => l[1].offset - u[1].offset))
      o.push(new Uint8Array(e, d.offset, d.length)), r[c] = { offset: s, length: d.length, fetchedAt: d.fetchedAt }, s += d.length;
    for (const c of n)
      o.push(new Uint8Array(c.data)), r[c.part] = { offset: s, length: c.data.byteLength, fetchedAt: c.fetchedAt }, s += c.data.byteLength;
    const i = new Uint8Array(s);
    let a = 0;
    for (const c of o)
      i.set(c, a), a += c.byteLength;
    return { data: i.buffer, parts: r };
  };
  var Nn = (e) => Object.values(e).reduce((t, n) => Math.max(t, n.fetchedAt), -1 / 0);
  var Ze = (e) => IDBKeyRange.bound(`${e}\0`, `${e}`, false, true);
  var Xn = (e, t) => {
    if (!e.key.startsWith(`${e.resourceId}\0`))
      return Promise.reject(new DOMException(`Entry key does not start with the id of resource "${e.resourceId}"`, "DataError"));
    if (t !== e.key)
      return Promise.reject(new DOMException("Entry body key does not match the entry key", "DataError"));
  };
  var Fn = (e, t, n, o) => new Promise((r, s) => {
    const i = e.transaction(t, n);
    let a, c = false, d;
    const l = (u) => {
      if (!c) {
        c = true, d = u;
        try {
          i.abort();
        } catch {
        }
      }
    };
    i.oncomplete = () => {
      c ? s(d) : r(a);
    }, i.onabort = () => {
      s(i.error ?? (c ? d : new DOMException("Transaction was aborted", "AbortError")));
    };
    try {
      Promise.resolve(o(i)).then((u) => {
        a = u;
      }, l);
    } catch (u) {
      l(u);
    }
  });
  var ys = async () => {
    let e, t, n = false;
    const o = () => {
      if (e) return Promise.resolve(e);
      if (n) return Promise.reject(Un());
      if (t) return t;
      const f = new Promise((h, v) => {
        const A = indexedDB.open(jo, ls);
        A.onupgradeneeded = () => ms(A.result), A.onsuccess = () => {
          const O = A.result;
          n = false, t = void 0, O.onversionchange = () => {
            O.close(), e === O && (e = void 0);
          }, O.onclose = () => {
            e === O && (e = void 0);
          }, e = O, h(O);
        }, A.onerror = () => {
          n = false, t = void 0, v(A.error);
        }, A.onblocked = () => {
          n = true, v(Un());
        };
      });
      return t = f, f;
    }, r = (f, h, v) => e ? Fn(e, f, h, v) : o().then((A) => Fn(A, f, h, v));
    let s = Promise.resolve(), i = 0;
    const a = (f, h, v, A) => {
      i++;
      const O = f.then(
        (g) => ({ ok: true, value: g }),
        (g) => ({ ok: false, error: g })
      ), R = s.then(() => O), L = R.then((g) => {
        if (i--, !g.ok) throw g.error;
        return r(h, v, (p) => A(p, g.value));
      });
      return s = R.then(() => {
      }, () => {
      }), L;
    }, c = (f, h, v) => i === 0 ? r(f, h, v) : a(Promise.resolve(void 0), f, h, (A) => v(A)), d = IDBKeyRange.bound([0], [0, []]), l = (f, h) => c([f], "readonly", (v) => F(v.objectStore(f).get(h))), u = (f, h, v, A, O) => {
      const R = f.get(h) ?? { count: 0, bytes: 0, pinnedBytes: 0 };
      R.count += v, R.bytes += A, R.pinnedBytes += O, f.set(h, R);
    }, m = { count: 0, bytes: 0, pinnedBytes: 0 }, k = async (f) => {
      const h = await F(f.objectStore(ee).get(Cn));
      if (h && ps(h.value)) return { bytes: h.value.bytes, pinnedBytes: h.value.pinnedBytes, count: h.value.count };
      const v = { bytes: 0, pinnedBytes: 0, count: 0 }, A = f.objectStore(Y).openCursor();
      let O = await ye(A);
      for (; O; ) {
        const R = O.value;
        v.bytes += R.bytes, v.pinnedBytes += R.pinnedBytes, v.count += R.count;
        const L = ye(A);
        O.continue(), O = await L;
      }
      return v;
    }, w = (f, h, v) => {
      f.objectStore(ee).put({
        key: Cn,
        value: { bytes: h.bytes + v.bytes, pinnedBytes: h.pinnedBytes + v.pinnedBytes, count: h.count + v.count }
      });
    }, b = async (f, h, v = [], A) => {
      const O = A ?? await k(f), R = f.objectStore(Y), L = { count: 0, bytes: 0, pinnedBytes: 0 };
      for (const [g, p] of h) {
        const y = v.find((S) => S.id === g) ?? await F(R.get(g));
        y && (R.put({
          ...y,
          count: y.count + p.count,
          bytes: y.bytes + p.bytes,
          pinnedBytes: y.pinnedBytes + p.pinnedBytes
        }), L.count += p.count, L.bytes += p.bytes, L.pinnedBytes += p.pinnedBytes);
      }
      w(f, O, L);
    }, I = async (f, h, v, A, O, R) => {
      const L = f.objectStore(Z), g = f.objectStore(Q), p = await Promise.all(h.map(async (x) => {
        const _2 = L.index(x.index).openCursor(x.range);
        return { req: _2, cursor: await ye(_2) };
      })), y = async (x) => {
        const _2 = ye(x.req);
        x.cursor.continue(), x.cursor = await _2;
      }, S = async () => {
        for (const x of p)
          for (; x.cursor && O !== void 0 && x.cursor.value.key === O; ) await y(x);
      };
      for (await S(); v > A; ) {
        let x;
        for (const U of p)
          U.cursor && (!x || hs(U.cursor.value, x.cursor.value) < 0) && (x = U);
        if (!x) break;
        const _2 = x.cursor.value;
        L.delete(_2.key), g.delete(_2.key), u(R, _2.resourceId, -1, -_2.size, 0), v -= _2.size, await y(x), await S();
      }
      return v;
    }, M = async (f, h, v, A, O, R) => {
      const L = f.objectStore(Y), g = f.objectStore(Z), p = f.objectStore(Q), y = A.size, S = A.pinned === 1 || v?.pinned === 1 ? 1 : 0, x = R.every((W) => W.maxBytes > 0 && y <= W.maxBytes), _2 = /* @__PURE__ */ new Map(), U = [h], K = await k(f);
      for (const W of R) {
        if (W.resourceIds === void 0) {
          let j = K.bytes - K.pinnedBytes;
          for (const z of _2.values()) j += z.bytes;
          x && v && v.pinned === 0 && (j -= v.size);
          const P = x ? W.maxBytes - y : W.maxBytes;
          if (j <= P) continue;
          await I(
            f,
            [{ index: Yt, range: d }],
            j,
            P,
            x ? A.key : void 0,
            _2
          );
          continue;
        }
        const G = W.resourceIds.filter((j, P, z) => z.indexOf(j) === P);
        let q = 0;
        for (const j of G) {
          let P = U.find((z) => z.id === j);
          P || (P = await F(L.get(j)), P && U.push(P)), P && (q += P.bytes - P.pinnedBytes), q += _2.get(j)?.bytes ?? 0;
        }
        x && v && v.pinned === 0 && G.indexOf(v.resourceId) >= 0 && (q -= v.size);
        const E = x ? W.maxBytes - y : W.maxBytes;
        q <= E || await I(
          f,
          G.map((j) => ({ index: Co, range: IDBKeyRange.bound([j, 0], [j, 0, []]) })),
          q,
          E,
          x ? A.key : void 0,
          _2
        );
      }
      return x && (v ? u(
        _2,
        A.resourceId,
        0,
        y - v.size,
        (S === 1 ? y : 0) - (v.pinned === 1 ? v.size : 0)
      ) : u(_2, A.resourceId, 1, y, S === 1 ? y : 0), g.put({ ...A, pinned: S }), p.put(O)), await b(f, _2, U, K), { saved: x };
    }, N = {
      getSource: (f) => l(ge, f),
      putSource: (f) => c([ge], "readwrite", (h) => {
        h.objectStore(ge).put(f);
      }),
      listSources: () => c([ge], "readonly", async (f) => (await F(f.objectStore(ge).getAll())).sort((v, A) => v.order - A.order || (v.id < A.id ? -1 : v.id > A.id ? 1 : 0))),
      deleteSource: (f) => c([ge, Ae, re], "readwrite", async (h) => {
        h.objectStore(ge).delete(f), h.objectStore(Ae).delete(f);
        const v = h.objectStore(re), A = await F(v.index(Wt).getAllKeys(f));
        for (const O of A) v.delete(O);
      }),
      getResource: (f) => l(Y, f),
      listResources: () => c([Y], "readonly", (f) => F(f.objectStore(Y).getAll())),
      resourcesBySource: (f) => c([Y], "readonly", (h) => F(h.objectStore(Y).index(Bo).getAll(f))),
      resourcesByRangeOnlySource: (f) => c([Y], "readonly", (h) => F(h.objectStore(Y).index(Do).getAll(f))),
      createResource: (f) => c([Y], "readwrite", async (h) => {
        await F(h.objectStore(Y).add({ ...f, count: 0, bytes: 0, pinnedBytes: 0 }));
      }),
      replaceResource: (f) => c([Y], "readwrite", async (h) => {
        const v = h.objectStore(Y), A = await F(v.get(f.id));
        if (!A) throw new DOMException(`Resource "${f.id}" not found`, "NotFoundError");
        v.put({ ...f, count: A.count, bytes: A.bytes, pinnedBytes: A.pinnedBytes });
      }),
      patchResource: (f, h) => c([Y], "readwrite", async (v) => {
        const A = v.objectStore(Y), O = await F(A.get(f));
        if (!O) return;
        const R = h(O);
        if (!R) return;
        const L = { ...R, id: O.id, count: O.count, bytes: O.bytes, pinnedBytes: O.pinnedBytes };
        return A.put(L), L;
      }),
      // 消す前に同じ tx で Resource を読み、その数を totals から引く
      deleteResource: (f) => c([Y, Z, Q, ee], "readwrite", async (h) => {
        const v = await k(h), A = await F(h.objectStore(Y).get(f));
        h.objectStore(Y).delete(f), h.objectStore(Z).delete(Ze(f)), h.objectStore(Q).delete(Ze(f)), w(h, v, A ? { count: -A.count, bytes: -A.bytes, pinnedBytes: -A.pinnedBytes } : m);
      }),
      clearEntries: (f) => c([Y, Z, Q, ee], "readwrite", async (h) => {
        const v = await k(h);
        h.objectStore(Z).delete(Ze(f)), h.objectStore(Q).delete(Ze(f));
        const A = h.objectStore(Y), O = await F(A.get(f));
        O && A.put({ ...O, count: 0, bytes: 0, pinnedBytes: 0 }), w(h, v, O ? { count: -O.count, bytes: -O.bytes, pinnedBytes: -O.pinnedBytes } : m);
      }),
      getEntry: (f) => c([Z, Q], "readonly", async (h) => {
        const [v, A] = await Promise.all([
          F(h.objectStore(Z).get(f)),
          F(h.objectStore(Q).get(f))
        ]), O = fs(A);
        return v && O ? { meta: v, body: O } : void 0;
      }),
      hasEntries: (f) => c([Z], "readonly", (h) => {
        const v = h.objectStore(Z);
        return Promise.all(f.map(async (A) => await F(v.getKey(A)) !== void 0));
      }),
      touch: (f, h) => c([Z], "readwrite", async (v) => {
        const A = v.objectStore(Z), O = await F(A.get(f));
        O && A.put({ ...O, accessedAt: h });
      }),
      putEntry: (f, h, v) => Xn(f, h.key) ?? a(us(h), [Y, Z, Q, ee], "readwrite", async (A, O) => {
        const R = await F(A.objectStore(Y).get(f.resourceId));
        if (!R) return { saved: false };
        const L = await F(A.objectStore(Z).get(f.key));
        return M(A, R, L, f, O, v);
      }),
      putGlyphPart: (f, h, v, A, O) => N.putGlyphParts(f, [{ part: h, blob: v, fetchedAt: f.fetchedAt }], A, O),
      putGlyphParts: (f, h, v, A) => {
        const O = h.filter((g, p) => h.findIndex((y, S) => S > p && y.part === g.part) < 0);
        if (O.length === 0) return Promise.resolve({ saved: false });
        const R = Xn(f, f.key);
        if (R) return R;
        const L = Promise.all(O.map(async (g) => ({ ...g, ...await To(g.blob) })));
        return a(L, [Y, Z, Q, ee], "readwrite", async (g, p) => {
          const y = await F(g.objectStore(Y).get(f.resourceId));
          if (!y) return { saved: false };
          const [S, x] = await Promise.all([
            F(g.objectStore(Z).get(f.key)),
            F(g.objectStore(Q).get(f.key))
          ]), _2 = Ft(x) ? x : void 0, U = new Set(p.map((C) => C.part)), K = _2?.parts && S ? Object.entries(_2.parts).filter(([C]) => !U.has(C)) : [];
          let W = K.every(([, C]) => C.offset + C.length <= _2.data.byteLength) ? K : [];
          const G = A.reduce((C, T) => Math.min(C, T.maxBytes), 1 / 0), q = p.reduce((C, T) => C + T.data.byteLength, 0);
          let E = W.reduce((C, [, T]) => C + T.length, 0);
          if (q + E > G && q <= G) {
            const C = [...W].sort((T, D) => T[1].fetchedAt - D[1].fetchedAt || T[1].offset - D[1].offset);
            for (; q + E > G && C.length > 0; ) E -= C.shift()[1].length;
            W = C;
          }
          const j = zn(_2?.data, W, p), P = p[p.length - 1].type, z = {
            ...f,
            size: j.data.byteLength,
            // 最も新しい部分の fetchedAt（新しい部分がある間はレコードを掃除の対象にしない）
            fetchedAt: Nn(j.parts)
          };
          return M(g, y, S, z, { key: f.key, data: j.data, type: P, headers: v, parts: j.parts }, A);
        });
      },
      deleteEntries: (f, h = {}) => c([Y, Z, Q, ee], "readwrite", async (v) => {
        const A = v.objectStore(Z), O = v.objectStore(Q), R = /* @__PURE__ */ new Map();
        let L = 0;
        const g = f.filter((y, S, x) => x.indexOf(y) === S), p = await Promise.all(g.map((y) => F(A.get(y))));
        for (const y of p)
          y && (h.unpinnedOnly && y.pinned === 1 || h.fetchedBefore !== void 0 && y.fetchedAt >= h.fetchedBefore || (A.delete(y.key), O.delete(y.key), u(R, y.resourceId, -1, -y.size, y.pinned === 1 ? -y.size : 0), L++));
        return await b(v, R), L;
      }),
      setPinned: (f, h) => c([Y, Z, ee], "readwrite", async (v) => {
        const A = v.objectStore(Z), O = /* @__PURE__ */ new Map();
        let R = 0;
        const L = f.filter((p, y, S) => S.indexOf(p) === y), g = await Promise.all(L.map((p) => F(A.get(p))));
        for (const p of g)
          !p || p.pinned === h || (A.put({ ...p, pinned: h }), u(O, p.resourceId, 0, 0, h === 1 ? p.size : -p.size), R++);
        return await b(v, O), R;
      }),
      listUnpinnedBefore: (f, h, v) => c([Z], "readonly", async (A) => {
        const O = [];
        if (h <= 0) return { metas: O };
        const R = Array.isArray(v) ? v : void 0, L = R ? [0, R[0]] : [0, -1 / 0], g = A.objectStore(Z).index(Uo).openCursor(IDBKeyRange.bound(L, [0, f], false, true));
        let p = await ye(g);
        for (; p && R && p.value.fetchedAt === R[0] && String(p.primaryKey) <= R[1]; ) {
          const S = ye(g);
          String(p.primaryKey) === R[1] ? p.continue() : p.continuePrimaryKey([0, R[0]], R[1]), p = await S;
        }
        for (; p && O.length < h && (O.push(p.value), !(O.length >= h)); ) {
          const S = ye(g);
          p.continue(), p = await S;
        }
        const y = O[O.length - 1];
        return O.length >= h && y ? { metas: O, next: [y.fetchedAt, y.key] } : { metas: O };
      }),
      entriesOf: (f, h, v) => c([Z], "readonly", async (A) => {
        if (h <= 0) return { metas: [] };
        const O = v === void 0 ? Ze(f) : IDBKeyRange.bound(v, `${f}`, true, true), R = await F(A.objectStore(Z).getAll(O, h));
        return R.length >= h ? { metas: R, next: R[R.length - 1].key } : { metas: R };
      }),
      entriesAtZoom: (f, h) => c([Z], "readonly", (v) => F(v.objectStore(Z).index(zo).getAll([f, h]))),
      pruneGlyphParts: (f, h) => c([Y, Z, Q, ee], "readwrite", async (v) => {
        const A = v.objectStore(Z), O = v.objectStore(Q), [R, L] = await Promise.all([
          F(A.get(f)),
          F(O.get(f))
        ]);
        if (!R || R.pinned === 1 || !Ft(L) || !L.parts) return 0;
        const g = Object.entries(L.parts);
        if (!g.every(([, x]) => x.offset + x.length <= L.data.byteLength)) return 0;
        const p = g.filter(([, x]) => x.fetchedAt >= h), y = g.length - p.length;
        if (y === 0) return 0;
        const S = /* @__PURE__ */ new Map();
        if (p.length === 0)
          A.delete(f), O.delete(f), u(S, R.resourceId, -1, -R.size, 0);
        else {
          const x = zn(L.data, p, []), _2 = x.data.byteLength;
          A.put({ ...R, size: _2, fetchedAt: Nn(x.parts) }), O.put({ ...L, data: x.data, parts: x.parts }), u(S, R.resourceId, 0, _2 - R.size, 0);
        }
        return await b(v, S), y;
      }),
      getRegion: (f) => l(re, f),
      putRegion: (f) => c([re], "readwrite", (h) => {
        h.objectStore(re).put(f);
      }),
      patchRegion: (f, h) => c([re], "readwrite", async (v) => {
        const A = v.objectStore(re), O = await F(A.get(f));
        if (!O) return;
        const R = h(O);
        if (!R) return;
        const L = { ...R, id: O.id };
        return A.put(L), L;
      }),
      listRegions: (f) => c([re], "readonly", (h) => F(h.objectStore(re).index(Wt).getAll(f))),
      deleteRegion: (f) => c([re], "readwrite", (h) => {
        h.objectStore(re).delete(f);
      }),
      getCredentials: (f) => c([Ae], "readonly", async (h) => {
        const v = await F(h.objectStore(Ae).get(f));
        if (!v) return;
        const A = {};
        return v.query && (A.query = v.query), v.headers && (A.headers = v.headers), A;
      }),
      putCredentials: (f, h) => c([Ae], "readwrite", (v) => {
        v.objectStore(Ae).put({ ...h, sourceId: f });
      }),
      kvGet: (f) => c([ee], "readonly", async (h) => (await F(h.objectStore(ee).get(f)))?.value),
      kvPut: (f, h) => c([ee], "readwrite", (v) => {
        v.objectStore(ee).put({ key: f, value: h });
      }),
      getTotals: () => c([Y, ee], "readonly", (f) => k(f)),
      evictGlobal: (f) => f > 0 ? c([Y, Z, Q, ee], "readwrite", async (h) => {
        const v = await k(h), A = /* @__PURE__ */ new Map(), O = h.objectStore(Z).index(Yt).openCursor(d);
        let R = await ye(O), L = 0, g = 0;
        for (; R && L < f; ) {
          const p = R.value;
          h.objectStore(Z).delete(p.key), h.objectStore(Q).delete(p.key), u(A, p.resourceId, -1, -p.size, 0), L += p.size, g++;
          const y = ye(O);
          R.continue(), R = await y;
        }
        return await b(h, A, [], v), g;
      }) : Promise.resolve(0),
      close: () => {
        e && e.close(), e = void 0;
      }
    };
    try {
      await o();
    } catch (f) {
      if (!n) throw f;
    }
    return N;
  };
  var gs = [
    "sw-unsupported",
    "sw-register-failed",
    "sw-not-controlling",
    "sw-not-implemented",
    "map-id-required",
    "instance-released",
    "attribute-missing",
    "attribute-invalid",
    "unknown-type",
    "map-not-found",
    "map-busy",
    "no-fetch-process",
    "cache-path-invalid",
    "cannot-fetch-all",
    "fetch-busy",
    "api-not-found"
  ];
  var ws = ["db-blocked", "quota", "network", "upstream", "storage", "internal"];
  var bs = [
    "unsupported-template",
    "invalid-style",
    "opaque",
    "sw-outdated",
    "credential-rejected",
    "source-not-found",
    "resource-conflict",
    // その版がまだ扱わない kind（旧い版では style・asset）
    "unsupported-kind",
    // WeiwudiSource.removeResource の id がその Source の Resource でない
    "resource-not-found"
  ];
  var vs = /* @__PURE__ */ new Set([...gs, ...ws, ...bs]);
  var As = /^[a-z][a-z0-9-]*$/;
  var No = /* @__PURE__ */ Symbol.for("@c4h/weiwudi/error");
  var Xo = [
    ["sw-unsupported", "Error: Service worker is not supported"],
    ["sw-register-failed", "Error: Service worker registration failed with ${error}"],
    ["sw-not-controlling", "Error: Service worker did not control this page within 10000 ms"],
    ["sw-not-implemented", "Weiwudi service worker is not implemented."],
    ["map-id-required", "MapID is necessary."],
    ["instance-released", "This instance is already released."],
    ["attribute-missing", 'Error: Attribute "${target}" is missing'],
    ["attribute-invalid", 'Error: Attribute "cacheMaxBytes" is not a valid non-negative integer'],
    ["unknown-type", 'Error: Unknown "type" value'],
    ["map-not-found", 'Error: MapID "${mapID}" not found'],
    ["map-busy", "Error: ${mapID} is under fetching process. Please cancel it first"],
    ["no-fetch-process", "Error: There are no fetching process of ${mapID}"],
    ["cache-path-invalid", 'Error: "cache" api needs mapID, zoom, x, y settings'],
    ["cannot-fetch-all", 'Error: Map "${mapID}" cannot fetch all tiles'],
    ["fetch-busy", 'Error: Another fetching process is running: "${mapID}" (${count} / ${total})'],
    ["api-not-found", "Error: API ${apiName} not found"]
  ];
  var Fo = /\$\{(\w+)\}/g;
  var Ss = new Map(Xo.map(([e, t]) => [e, t]));
  var ks = Xo.map(([e, t], n) => {
    const o = t.split(Fo), r = o.filter((a, c) => c % 2 === 1), s = o.filter((a, c) => c % 2 === 0), i = s.reduce((a, c) => a + c.length, 0);
    return { code: e, names: r, fixed: s, fixedLength: i, order: n };
  });
  var xs = (e, t) => {
    const { fixed: n } = e, o = n[0], r = n[n.length - 1];
    if (n.length === 1) return t === o ? [] : void 0;
    if (t.length < o.length + r.length || !t.startsWith(o) || !t.endsWith(r)) return;
    const s = o.length;
    let i = t.length - r.length;
    const a = [];
    for (let c = n.length - 2; c >= 1; c--) {
      const d = n[c], l = i - d.length < s ? -1 : t.lastIndexOf(d, i - d.length);
      if (l < s) return;
      a.unshift(t.slice(l + d.length, i)), i = l;
    }
    return a.unshift(t.slice(s, i)), a;
  };
  var Os = (e) => {
    let t;
    for (const n of ks) {
      const o = xs(n, e);
      if (!o) continue;
      const r = n.names.length === 0 ? void 0 : Object.fromEntries(n.names.map((s, i) => [s, o[i]]));
      te(n.code, r) === e && (!t || Is(n, t.m)) && (t = { m: n, detail: r });
    }
    if (t)
      return t.detail ? { code: t.m.code, detail: t.detail } : { code: t.m.code };
  };
  var Is = (e, t) => e.fixed[0].length !== t.fixed[0].length ? e.fixed[0].length > t.fixed[0].length : e.fixedLength !== t.fixedLength ? e.fixedLength > t.fixedLength : e.order < t.order;
  var te = (e, t) => {
    const n = Ss.get(e);
    if (n === void 0) throw new Error(`Unknown legacy error code: ${e}`);
    return n.replace(Fo, (o, r) => String(t?.[r]));
  };
  var Zn = (e) => e === "QuotaExceededError" ? "quota" : e === "BlockedError" ? "db-blocked" : "internal";
  var Rs = () => {
    const e = Error.isError;
    return typeof e == "function" ? e : void 0;
  };
  var Yn = (e) => typeof DOMException == "function" && e instanceof DOMException;
  var Zo = (e) => {
    const t = Rs();
    return t ? t(e) || Yn(e) : e instanceof Error || Yn(e);
  };
  var Gt = (e) => {
    try {
      return String(e);
    } catch {
      return "[unprintable]";
    }
  };
  var Tt = (e, t) => {
    const n = Object.getOwnPropertyDescriptor(e, t);
    if (!(!n || !("value" in n)))
      return { value: n.value, enumerable: !!n.enumerable };
  };
  var Es = (e) => {
    if (typeof e != "object" || e === null || !Zo(e)) return false;
    const t = Tt(e, "code");
    if (!t || typeof t.value != "string") return false;
    const n = Tt(e, No);
    return n && n.value === true && !n.enumerable ? As.test(t.value) : vs.has(t.value) ? (Tt(e, "name")?.value ?? e.name) === "WeiwudiError" : false;
  };
  var _s = (e) => {
    if (Es(e)) return e;
    if (typeof e == "string") {
      const t = Os(e);
      if (t) return new $(t.code, e, t.detail);
      const n = e.match(/^Error: (\w+)(?::|$)/);
      return new $(Zn(n ? n[1] : void 0), e);
    }
    if (Zo(e)) {
      const t = e.name, n = e.message;
      return new $(
        Zn(typeof t == "string" ? t : void 0),
        typeof n == "string" ? n : Gt(e)
      );
    }
    return new $("internal", Gt(e));
  };
  var $ = class _$ extends Error {
    constructor(t, n, o) {
      super(n), this.name = "WeiwudiError", this.code = t, o !== void 0 && (this.detail = o), Object.defineProperty(this, No, { value: true, enumerable: false, writable: false, configurable: false });
    }
    /**
     * 文字列・Error・その他から作る。どんな値を渡しても throw しない。
     * そのまま返すのは、本物の Error で、code を自前の文字列として持ち、印があって code が書式（/^[a-z][a-z0-9-]*$/）に
     * 合うもの（未知の code も保つ）か、name が 'WeiwudiError' で code が既知のものだけ（別のコピーの WeiwudiError を含む）。
     * 読み取りの途中で例外が起きる値（throw する getter・Proxy など）は internal で作り直す
     */
    static from(t) {
      try {
        return _s(t);
      } catch {
        return new _$("internal", Gt(t));
      }
    }
  };
  var Wn = 200;
  var js = () => "Weiwudi/1.2.0-rc.1";
  var Ye = (e) => new $("attribute-invalid", `Attribute "userAgent" ${e}`, { attribute: "userAgent" });
  function Yo(e) {
    if (typeof e != "string") throw Ye("must be a string");
    const t = e.trim();
    if (t === "") throw Ye("must not be blank");
    if (/[\u0000-\u001f\u007f]/.test(t)) throw Ye("must not contain a control character");
    if (/[^ -~]/.test(t)) throw Ye("must contain only printable ASCII characters");
    if (t.length > Wn) throw Ye(`must not be longer than ${Wn} characters`);
    return t;
  }
  function Ts(e, t) {
    return [e, t, js()].filter((n) => typeof n == "string" && n !== "").join(" ");
  }
  var Ms = (e, t, n) => {
    try {
      return typeof e == "string" ? { url: new URL(e, n), mode: t?.mode ?? "cors" } : { url: new URL(e.url), mode: t?.mode ?? e.mode };
    } catch {
      return;
    }
  };
  function $s(e, t, n) {
    if (!n) return false;
    const o = Ms(e, t, n.href);
    return o ? o.url.origin === n.origin && (o.mode === "cors" || o.mode === "same-origin") : false;
  }
  function Ps(e, t, n) {
    let o;
    try {
      if (o = t === void 0 ? typeof e == "string" ? new Request(e) : e : new Request(e, t), o.headers.has("user-agent")) return;
      const r = new Headers(o.headers);
      return r.set("user-agent", n), new Request(o, { headers: r, referrer: o.referrer, referrerPolicy: o.referrerPolicy });
    } catch {
      return;
    }
  }
  var Ls = 1e3;
  var Wo = (e) => {
    const t = e !== null && typeof e == "object" ? e.userAgent : void 0;
    return typeof t == "string" && t !== "" ? t : void 0;
  };
  var Bs = () => {
    const e = typeof self < "u" ? self.location : void 0;
    return e && typeof e.origin == "string" && typeof e.href == "string" ? { origin: e.origin, href: e.href } : void 0;
  };
  var Ds = () => typeof navigator < "u" && typeof navigator.userAgent == "string" ? navigator.userAgent : void 0;
  function Cs(e = {}) {
    const t = typeof e == "function" ? { open: e } : e, n = t.open ?? ys, o = t.providers ?? (() => []), r = t.userAgent ?? (() => {
    });
    let s;
    const i = () => {
      if (!s) {
        const u = n();
        s = u, u.catch(() => {
          s === u && (s = void 0);
        });
      }
      return s;
    }, a = {}, c = async () => {
      if (!a.loaded) {
        const w = i().then((I) => I.kvGet(Zt)).then(Wo);
        a.loaded = w;
        const b = () => {
          a.stalledOn === w && (a.stalledOn = void 0);
        };
        w.then(b, () => {
          b(), a.loaded === w && (a.loaded = void 0);
        });
      }
      const u = a.loaded;
      if (a.stalledOn === u) return;
      let m;
      const k = /* @__PURE__ */ Symbol("timeout");
      try {
        const w = await Promise.race([
          u,
          new Promise((b) => {
            m = setTimeout(() => b(k), Ls);
          })
        ]);
        if (w === k) {
          a.loaded === u && (a.stalledOn = u);
          return;
        }
        return w;
      } catch {
        return;
      } finally {
        m !== void 0 && clearTimeout(m);
      }
    }, d = (u, m) => m === void 0 ? fetch(u) : fetch(u, m);
    return {
      store: i,
      upstreamFetch: async (u, m) => {
        if (!$s(u, m, Bs())) return d(u, m);
        let k = await c();
        if (k === void 0)
          try {
            k = r();
          } catch {
            k = void 0;
          }
        const w = Ps(u, m, Ts(Ds(), k));
        if (!w) return d(u, m);
        try {
          return await fetch(w);
        } catch (b) {
          if (b?.name === "AbortError" || w.signal?.aborted === true || w.method !== "GET" && w.method !== "HEAD") throw b;
          return d(u, m);
        }
      },
      userAgent: a,
      inflight: /* @__PURE__ */ new Map(),
      maintenance: { swept: false },
      table: { generation: 0, failures: 0, retryAt: 0 },
      corslessStreak: /* @__PURE__ */ new Map(),
      providers: () => o(),
      ...t.acceptsMember ? { acceptsMember: t.acceptsMember } : {}
    };
  }
  var Kt = [];
  var ct = [];
  var Go;
  function Us() {
    return Kt.slice();
  }
  function zs() {
    return ct.slice();
  }
  function Ns() {
    return Go;
  }
  var ve = 20037508342789244e-9;
  var Gn = (e) => 6378137 * e * Math.PI / 180;
  var Kn = (e) => 6378137 * Math.log(Math.tan(Math.PI / 360 * (90 + e)));
  var an = (e, t) => {
    const n = Gn(e.maxLng), o = Gn(e.minLng), r = Kn(e.maxLat), s = Kn(e.minLat);
    return {
      minX: Math.floor((ve + o) / (2 * ve) * Math.pow(2, t)),
      maxX: Math.floor((ve + n) / (2 * ve) * Math.pow(2, t)),
      minY: Math.floor((ve - r) / (2 * ve) * Math.pow(2, t)),
      maxY: Math.floor((ve - s) / (2 * ve) * Math.pow(2, t))
    };
  };
  var Ie = (e, t, n) => {
    const o = Math.pow(2, t - n);
    return {
      minX: Math.floor(e.minX / o),
      maxX: Math.floor(e.maxX / o),
      minY: Math.floor(e.minY / o),
      maxY: Math.floor(e.maxY / o)
    };
  };
  var Ko = (e, t, n) => !(t < e.minX || t > e.maxX || n < e.minY || n > e.maxY);
  var qo = (e, t, n) => {
    let o = 0;
    for (let r = t; r <= n; r++) {
      const s = Ie(e, n, r);
      o += (s.maxX - s.minX + 1) * (s.maxY - s.minY + 1);
    }
    return o;
  };
  function* Xs(e, t, n) {
    for (let o = t; o <= n; o++) {
      const r = Ie(e, n, o);
      for (let s = r.minX; s <= r.maxX; s++)
        for (let i = r.minY; i <= r.maxY; i++)
          yield [o, s, i];
    }
  }
  var Fs = (e, t, n) => {
    const o = (r) => Math.ceil(Math.log(r / n) / Math.log(2));
    return Math.max(o(e), o(t));
  };
  var Zs = (e, t, n) => ({
    minX: 0,
    maxX: Math.ceil(e / n) - 1,
    minY: 0,
    maxY: Math.ceil(t / n) - 1
  });
  var Ys = (e, t, n) => {
    let o = "";
    for (let r = e; r > 0; r--) {
      const s = 1 << r - 1;
      o += String(((t & s) !== 0 ? 1 : 0) + ((n & s) !== 0 ? 2 : 0));
    }
    return o;
  };
  var Ho = (e, t) => (e % 16).toString(16) + (t % 16).toString(16);
  var Ws = (e, t, n, o) => o ? e.split(t).join(n) : e.replace(t, () => n);
  var Jo = (e, t, n, o, r) => {
    if (!r)
      return e.replace("{z}", String(t)).replace("{x}", String(n)).replace("{y}", String(o)).replace("{-y}", String(Math.pow(2, t) - o - 1));
    const s = r.all === true;
    return [
      ["{z}", String(t)],
      ["{x}", String(n)],
      ["{y}", String(o)],
      ["{-y}", String(Math.pow(2, t) - o - 1)],
      ["{quadkey}", Ys(t, n, o)],
      ["{prefix}", Ho(n, o)],
      ["{ratio}", r.ratio ?? ""]
    ].reduce((a, [c, d]) => Ws(a, c, d, s), e);
  };
  var Vo = (e, t, n, o) => `${e}_${t}_${n}${o === "@2x" ? "@2x" : ""}`;
  var Gs = Uint8Array.from(atob(
    "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAMAAABrrFhUAAAAB3RJTUUH3QgIBToaSbAjlwAAABd0RVh0U29mdHdhcmUAR0xEUE5HIHZlciAzLjRxhaThAAAACHRwTkdHTEQzAAAAAEqAKR8AAAAEZ0FNQQAAsY8L/GEFAAAAA1BMVEX///+nxBvIAAAAAXRSTlMAQObYZgAAAFRJREFUeNrtwQEBAAAAgJD+r+4ICgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgBDwABHHIJwwAAAABJRU5ErkJggg=="
  ), (e) => e.charCodeAt(0));
  var Ks = "application/vnd.mapbox-vector-tile";
  var Qo = "x-weiwudi-status";
  var er = "x-weiwudi-error";
  var qn = "access-control-expose-headers";
  var qs = `${Qo}, ${er}`;
  var Hs = 5;
  var tr = (e) => Eo.indexOf(e) >= 0 || e.startsWith(_o);
  var nr = (e) => {
    const t = {};
    return e.forEach((n, o) => {
      const r = o.toLowerCase();
      tr(r) || (t[r] = n);
    }), t;
  };
  var Js = (e) => (e["content-type"] ?? "").split(";")[0].trim().toLowerCase() === "text/html";
  var de = (e, t, n) => {
    const o = new Headers();
    for (const [r, s] of Object.entries(e.headers)) {
      const i = r.toLowerCase();
      tr(i) || i === qn || o.set(i, s);
    }
    return o.set(Qo, t), n && o.set(er, n), o.set(qn, qs), new Response(e.body, { status: e.status, statusText: e.statusText, headers: o });
  };
  var Hn = async (e) => ({
    body: await e.blob(),
    status: e.status,
    statusText: e.statusText,
    headers: nr(e.headers)
  });
  var Qe = async (e, t, n) => {
    try {
      return await n();
    } catch (o) {
      console.error(`Weiwudi plugin ${String(t)} failed:`, o);
      return;
    }
  };
  var cn = (e, t) => {
    let n = e.states.get(t);
    return n || (n = {}, e.states.set(t, n)), n;
  };
  var Vs = async (e, t) => {
    let n = t;
    for (const o of e.plugins) {
      if (!o.requestWillFetch) continue;
      const r = await Qe(o, "requestWillFetch", () => o.requestWillFetch({ request: n, resource: e.info, state: cn(e, o) }));
      r instanceof Request && (n = r);
    }
    return n;
  };
  var Qs = async (e, t, n) => {
    let o = n;
    for (const r of e.plugins) {
      if (!r.fetchDidSucceed) continue;
      const s = o.clone(), i = await Qe(r, "fetchDidSucceed", () => r.fetchDidSucceed({ request: t, response: o, resource: e.info, state: cn(e, r) })), a = i instanceof Response ? i : o;
      a.bodyUsed ? (console.error("Weiwudi plugin fetchDidSucceed consumed the response body without returning a new Response; the response before the hook is used"), o = s) : o = a;
    }
    return o;
  };
  var ei = async (e, t, n) => {
    for (const o of e.plugins)
      o.fetchDidFail && await Qe(o, "fetchDidFail", () => o.fetchDidFail({ request: t, error: n, resource: e.info, state: cn(e, o) }));
  };
  var ti = async (e, t, n) => {
    let o = n;
    for (const r of e.plugins) {
      if (!r.cacheWillUpdate) continue;
      const s = await Qe(r, "cacheWillUpdate", () => r.cacheWillUpdate({ request: t, response: o, resource: e.info }));
      if (s === null) return null;
      s instanceof Response && (o = s);
    }
    return o;
  };
  var ni = async (e, t, n) => {
    let o = n;
    for (const r of e.plugins) {
      if (!r.cachedResponseWillBeUsed) continue;
      const s = await Qe(r, "cachedResponseWillBeUsed", () => r.cachedResponseWillBeUsed({ request: t, cachedResponse: o, resource: e.info }));
      if (s === null) return null;
      s instanceof Response && (o = s);
    }
    return o;
  };
  var oi = (e, t) => {
    const n = e.extents;
    if (!t || !n || n.length === 0) return;
    const { z: o, x: r, y: s } = t;
    let i = true;
    for (const a of n)
      if (!(o < a.minZoom || o > a.maxZoom) && (i = false, !a.box || Ko(Ie(a.box, a.maxZoom, o), r, s)))
        return;
    return i ? "zoom" : "extent";
  };
  var ri = (e, t) => {
    const n = e.policy.outOfRange[t];
    return de(n === "transparent" ? { body: Gs.slice(), status: 200, statusText: "OK", headers: { "content-type": "image/png" } } : n === "empty" ? { body: new Uint8Array(0), status: 200, statusText: "OK", headers: { "content-type": Ks } } : { body: null, status: 404, statusText: "Not Found", headers: {} }, "out-of-range");
  };
  var si = (e) => {
    const t = e.kind === "legacy" ? e.legacy?.cacheMaxBytes : (Oe(e) ?? le(e))?.cacheMaxBytes;
    return typeof t == "number" && Number.isFinite(t) ? t : void 0;
  };
  async function vt(e, t) {
    const n = t.rangeOnlySourceIds ?? [], o = [], r = [];
    for (const i of t.sourceIds) {
      if (n.indexOf(i) >= 0) continue;
      const a = await e.getSource(i);
      let c = a, d = i, l = [i];
      if (a && bt(a)) {
        if (a.parentId === void 0) continue;
        d = a.parentId, c = await e.getSource(d), l = (c ? le(c)?.children ?? [] : []).map((k) => k.id);
      }
      if (r.indexOf(d) >= 0) continue;
      r.push(d);
      const u = c ? si(c) : void 0;
      if (u === void 0) continue;
      const m = [];
      for (const k of l)
        for (const w of await e.resourcesBySource(k))
          m.indexOf(w.id) < 0 && m.push(w.id);
      m.indexOf(t.id) < 0 && m.push(t.id), o.push({ resourceIds: m, maxBytes: u });
    }
    const s = ii(await e.kvGet(Lo));
    return s !== void 0 && o.push({ maxBytes: s }), o;
  }
  var ii = (e) => {
    const t = e !== null && typeof e == "object" ? e.maxBytes : void 0;
    return typeof t == "number" && Number.isInteger(t) && t >= 0 ? t : void 0;
  };
  var ai = 0.1;
  var or = async (e, t) => {
    const n = (o) => $.from(o).code === "quota" ? "quota" : "storage";
    try {
      await t();
      return;
    } catch (o) {
      if (n(o) !== "quota") return "storage";
    }
    try {
      const o = await e.getTotals();
      await e.evictGlobal(Math.ceil(Math.max(0, o.bytes - o.pinnedBytes) * ai));
    } catch {
      return "quota";
    }
    try {
      await t();
      return;
    } catch (o) {
      return n(o);
    }
  };
  function rr(e, t, n) {
    if (t.request.headers.has("range")) return ci(t);
    const o = Us();
    if (!t.storable) return Jn(e, t, n(), o);
    const r = t.part === void 0 ? t.key : `${t.key}\0${t.part}`, s = t.revalidate === true ? `${r}\0revalidate` : r, i = e.inflight.get(s);
    if (i) return i.then((d) => d.clone());
    const a = Jn(e, t, n(), o);
    e.inflight.set(s, a);
    const c = () => {
      e.inflight.get(s) === a && e.inflight.delete(s);
    };
    return a.then(c, c), a.then((d) => d.clone());
  }
  var ln = async (e) => {
    try {
      return await e();
    } catch {
      return de({ body: null, status: 404, statusText: "Not Found", headers: {} }, "offline-miss", "network");
    }
  };
  var ci = (e) => ln(async () => {
    const t = await e.upstream(e.request, { hasEntry: false, requestChanged: false });
    if (t.kind === "network") throw t.error;
    return t.response;
  });
  var li = (e, t, n) => {
    if (n === void 0) return { meta: e, blob: t.blob, headers: t.headers };
    const o = t.parts?.[n];
    if (o)
      return {
        meta: { ...e, fetchedAt: o.fetchedAt, size: o.length },
        blob: t.blob.slice(o.offset, o.offset + o.length),
        headers: t.headers
      };
  };
  var Jn = async (e, t, n, o) => {
    const r = await e.store(), s = await r.getResource(t.resourceId), i = s ? { plugins: o, info: Po(s, n), states: /* @__PURE__ */ new Map() } : void 0;
    if (s) {
      const I = oi(s, t.coord);
      if (I) return ri(s, I);
    }
    let a;
    if (s) {
      const I = await r.getEntry(t.key), M = I && li(I.meta, I.body, t.part), N = s.policy.cacheRetention;
      M && !(N !== void 0 && M.meta.pinned !== 1 && n - M.meta.fetchedAt > N) && (a = M);
    }
    const c = async (I) => {
      const M = { body: I.blob, status: 200, statusText: "OK", headers: I.headers };
      if (!i || !i.plugins.some((h) => h.cachedResponseWillBeUsed)) return M;
      const N = new Response(I.blob, { status: 200, statusText: "OK", headers: I.headers }), f = await ni(i, t.request, N);
      return f === null ? null : f === N ? M : Hn(f);
    };
    if (s && a && t.storable && t.revalidate !== true && n - a.meta.fetchedAt <= s.policy.cacheTtl) {
      r.touch(t.key, n).catch(() => {
      });
      const I = await c(a);
      if (I) return de(I, "hit");
      a = void 0;
    }
    const d = async (I) => {
      if (!a) return;
      const M = await c(a);
      return M ? de(M, "stale", I) : void 0;
    }, l = i ? await Vs(i, t.request) : t.request;
    let u;
    try {
      u = await t.upstream(l, { hasEntry: !!a, requestChanged: l !== t.request });
    } catch (I) {
      u = { kind: "network", error: I };
    }
    if (u.kind === "network")
      return i && await ei(i, l, u.error), await d("network") ?? de({ body: null, status: 404, statusText: "Not Found", headers: {} }, "offline-miss", "network");
    const m = i ? await Qs(i, l, u.response) : u.response;
    if (u.kind === "opaque" || m.type === "opaque")
      return await d("upstream") ?? m;
    let k = await Hn(m);
    if (!m.ok || !t.isStyleLike && m.status === 200 && Js(k.headers))
      return await d("upstream") ?? de(k, "upstream-error", "upstream");
    if (t.transform)
      try {
        k = { ...k, body: await t.transform(k.body) };
      } catch {
        return await d("upstream") ?? de(k, "upstream-error", "upstream");
      }
    const w = a && t.storable ? "refresh" : "miss";
    let b;
    return s && t.storable && (b = await di(r, s, t, i, k, n)), de({ ...k, status: 200, statusText: "OK" }, w, b);
  };
  var di = async (e, t, n, o, r, s) => {
    let i = r.body, a = r.headers;
    if (o.plugins.some((l) => l.cacheWillUpdate)) {
      const l = new Response(i, { status: r.status, statusText: r.statusText, headers: a }), u = await ti(o, n.request, l);
      if (u === null) return;
      if (u !== l) {
        try {
          i = await u.blob();
        } catch {
          return "storage";
        }
        a = nr(u.headers);
      }
    }
    const c = {
      key: n.key,
      resourceId: t.id,
      // putEntry は meta.size で数えるので、保存する本体の大きさと揃える
      size: i.size,
      fetchedAt: s,
      accessedAt: s,
      pinned: n.pin === true ? 1 : 0
    };
    n.coord && (c.z = n.coord.z, c.x = n.coord.x, c.y = n.coord.y), a["content-type"] !== void 0 && (c.contentType = a["content-type"]);
    let d;
    if (n.part !== void 0 && n.collect) {
      n.collect.add({ part: n.part, body: i, fetchedAt: s, headers: a });
      return;
    }
    try {
      d = await vt(e, t);
    } catch {
      return "storage";
    }
    return or(e, () => n.part === void 0 ? e.putEntry(c, { key: n.key, blob: i, headers: a }, d) : e.putGlyphPart(c, n.part, i, a, d));
  };
  function ui(e, t, n) {
    let o = [];
    return {
      add: (r) => {
        o.push(r);
      },
      flush: async () => {
        const r = o;
        if (o = [], r.length !== 0)
          try {
            const s = await e.store(), i = await s.getResource(t.id) ?? t, a = await vt(s, i), c = r[r.length - 1], d = r.reduce((u, m) => Math.max(u, m.fetchedAt), -1 / 0), l = {
              key: n,
              resourceId: t.id,
              size: r.reduce((u, m) => u + m.body.size, 0),
              fetchedAt: d,
              accessedAt: d,
              pinned: 0
            };
            return c.headers["content-type"] !== void 0 && (l.contentType = c.headers["content-type"]), await or(s, () => s.putGlyphParts(l, r.map((u) => ({ part: u.part, blob: u.body, fetchedAt: u.fetchedAt })), c.headers, a));
          } catch (s) {
            return $.from(s).code === "quota" ? "quota" : "storage";
          }
      }
    };
  }
  async function qt(e) {
    const t = e.batchSize ?? Hs, n = e.tasks[Symbol.iterator](), o = () => {
      const i = [];
      for (; i.length < t; ) {
        const a = n.next();
        if (a.done) break;
        i.push(a.value);
      }
      return i;
    };
    let r = 0, s = false;
    try {
      for (let i = o(); i.length > 0; i = o()) {
        if (!await e.isAlive()) return "gone";
        if (await e.isCanceled()) return "canceled";
        await Promise.all(i.map((a) => e.run(a))), r += i.length, e.onBatch && await e.onBatch(r);
      }
      return s = true, "finished";
    } finally {
      s || n.return?.();
    }
  }
  function dn(e, t = {}) {
    const n = e.maintenance;
    if (n.sweeping) return n.sweeping;
    if (e.job || n.swept && !t.force) return Promise.resolve();
    n.swept = false;
    const r = (async () => {
      const s = await e.store();
      if (!n.sweep) {
        const l = (await s.listResources()).filter((u) => u.policy.cacheRetention !== void 0);
        n.sweep = { now: Date.now(), resources: l, tilesDone: false, glyphIndex: 0 };
      }
      const i = n.sweep, a = new Map(i.resources.filter((l) => l.type !== "glyph").map((l) => [l.id, l])), c = i.resources.filter((l) => l.type === "glyph");
      let d = 2e3;
      if (a.size === 0 && (i.tilesDone = true), !i.tilesDone) {
        const l = i.now - Math.min(...[...a.values()].map((u) => u.policy.cacheRetention));
        for (; d > 0 && !i.tilesDone; ) {
          if (e.job) return;
          const u = await s.listUnpinnedBefore(l, Math.min(200, d), i.after);
          d -= u.metas.length;
          const m = /* @__PURE__ */ new Map();
          for (const k of u.metas) {
            const w = a.get(k.resourceId);
            if (!w || i.now - k.fetchedAt <= w.policy.cacheRetention) continue;
            const b = m.get(w.id) ?? [];
            b.push(k.key), m.set(w.id, b);
          }
          for (const [k, w] of m) {
            if (e.job) return;
            await s.deleteEntries(w, { unpinnedOnly: true, fetchedBefore: i.now - a.get(k).policy.cacheRetention });
          }
          i.after = u.next, i.tilesDone = u.next === void 0;
        }
      }
      for (; d > 0 && i.tilesDone && i.glyphIndex < c.length; ) {
        if (e.job) return;
        const l = c[i.glyphIndex], u = await s.entriesOf(l.id, Math.min(200, d), i.glyphAfter);
        d -= u.metas.length;
        for (const m of u.metas) {
          if (e.job) return;
          m.pinned === 0 && await s.pruneGlyphParts(m.key, i.now - l.policy.cacheRetention);
        }
        i.glyphAfter = u.next, u.next === void 0 && i.glyphIndex++;
      }
      i.tilesDone && i.glyphIndex === c.length && (n.swept = true, n.sweep = void 0);
    })().finally(() => {
      n.sweeping = void 0;
    });
    return n.sweeping = r, r;
  }
  var fi = 3;
  var pi = rn;
  var mi = ["if-none-match", "if-modified-since", "if-match", "if-unmodified-since", "if-range"];
  function un(e) {
    return e.headers.has("authorization") || e.mode === "cors" && e.credentials === "include";
  }
  function hi(e, t) {
    return !un(e) || t.store;
  }
  function et(e) {
    return !!e && (Object.keys(e.query ?? {}).length > 0 || Object.keys(e.headers ?? {}).length > 0);
  }
  function sr(e, t) {
    const n = new Set([...e.searchParams.keys()].map((r) => r.toLowerCase()));
    let o = e.search;
    for (const [r, s] of Object.entries(t))
      n.has(r.toLowerCase()) || (o += `${o === "" ? "?" : "&"}${encodeURIComponent(r)}=${encodeURIComponent(s)}`);
    e.search = o;
  }
  var yi = (e, t, n) => {
    const o = new URL(e.href);
    try {
      t.applyCredentials(o, { ...n });
    } catch (r) {
      return console.error(`weiwudi: applyCredentials of provider "${t.id}" threw ${r instanceof Error ? r.name : typeof r}`), e;
    }
    return o.origin === e.origin ? o : e;
  };
  var gi = (e, t, n) => {
    const o = new Headers(e.headers);
    for (const i of mi) o.delete(i);
    let r = new URL(e.url), s = false;
    if (t) {
      n ? r = yi(r, n, t) : sr(r, t.query ?? {});
      for (const [i, a] of Object.entries(t.headers ?? {}))
        o.has(i) || (o.set(i, a), s = true);
    }
    return { url: r.href, headers: o, addedHeader: s };
  };
  var Vn = (e, t, n, o, r) => {
    const { url: s, headers: i, addedHeader: a } = gi(e, t, n), c = a && o !== "no-cors" ? { redirect: "error" } : { redirect: e.redirect };
    return new Request(s, {
      method: e.method,
      headers: i,
      mode: o,
      credentials: r,
      ...c,
      referrer: e.referrer,
      referrerPolicy: e.referrerPolicy
    });
  };
  var Qn = async (e, t) => {
    try {
      const n = await e.upstreamFetch(t);
      return { kind: n.type === "opaque" ? "opaque" : "response", response: n };
    } catch (n) {
      return { kind: "network", error: n };
    }
  };
  var ir = (e) => !!e && (e.count > 0 || e.corsOk === true);
  var wi = async (e, t, n) => {
    if (e.corslessStreak.delete(n.resourceId), !(t && t.corsOk === true && t.corslessUntil === void 0))
      try {
        await (await e.store()).patchResource(n.resourceId, (r) => {
          if (r.corsOk === true && r.corslessUntil === void 0) return;
          const s = { ...r, corsOk: true };
          return delete s.corslessUntil, s;
        });
      } catch {
      }
  };
  var bi = async (e, t, n) => {
    const o = (e.corslessStreak.get(t.resourceId) ?? 0) + 1;
    if (o < fi) {
      e.corslessStreak.set(t.resourceId, o);
      return;
    }
    e.corslessStreak.delete(t.resourceId);
    try {
      const s = await (await e.store()).patchResource(t.resourceId, (i) => ir(i) ? void 0 : { ...i, corslessUntil: n + pi });
      if (s)
        try {
          e.notify?.({ type: "opaque", resourceId: s.id, sourceIds: s.sourceIds.slice() });
        } catch {
        }
    } catch {
    }
  };
  async function eo(e, t) {
    let n;
    try {
      n = await e.upstreamFetch(t, { mode: "no-cors", credentials: "omit" });
    } catch {
      return "network";
    }
    if (n.type === "opaque") return "opaque";
    try {
      await n.body?.cancel();
    } catch {
    }
    return "response";
  }
  var vi = async (e, t) => {
    try {
      return await (await e.store()).getResource(t);
    } catch {
      return;
    }
  };
  function Ai(e, t) {
    return async (n, { hasEntry: o, requestChanged: r }) => {
      if (un(t.original)) return Qn(e, n);
      const s = r && new URL(n.url).origin !== new URL(t.original.url).origin ? void 0 : t.credentials, i = t.now(), a = await vi(e, t.resourceId), c = n.mode === "no-cors", d = () => Qn(e, Vn(n, s, t.provider, n.mode, n.credentials));
      if (c && a?.corslessUntil !== void 0 && a.corslessUntil > i) return d();
      let l;
      try {
        l = await e.upstreamFetch(Vn(n, s, t.provider, "cors", "same-origin"));
      } catch (u) {
        if (!c) return { kind: "network", error: u };
        const m = await d();
        return m.kind === "opaque" && !ir(a) && await bi(e, t, i), m;
      }
      if (await wi(e, a, t), c && (l.status === 401 || l.status === 403) && !o) {
        const u = await d();
        return u.kind === "network" ? { kind: "response", response: l } : u;
      }
      return { kind: l.type === "opaque" ? "opaque" : "response", response: l };
    };
  }
  var Si = Object.freeze([
    "access_token",
    "token",
    "key",
    "api_key",
    "apikey",
    "sku"
  ]);
  var ce = 30;
  var to = "{spriteSuffix}";
  var ki = Object.freeze(["z", "x", "y", "-y", "quadkey", "ratio", "prefix"]);
  var no = (e) => {
    switch (e) {
      case "z":
      case "x":
      case "y":
      case "-y":
        return "(\\d{1,10})";
      case "quadkey":
        return `([0-3]{0,${ce}})`;
      case "ratio":
        return "(@2x)?";
      case "prefix":
        return "([0-9a-fA-F]{2})";
      case "fontstack":
        return "([^/]+)";
      case "range":
        return "(\\d+-\\d+)";
      case "spriteSuffix":
        return "((?:@2x)?\\.(?:json|png))";
    }
  };
  var xi = (e) => e === "z" || e === "x" || e === "y" || e === "-y" || e === "quadkey" || e === "ratio" || e === "prefix" || e === "fontstack" || e === "range" || e === "spriteSuffix";
  function ar(e, t) {
    const n = e === "tile" ? ki : e === "glyph" ? ["fontstack", "range"] : e === "sprite" ? ["spriteSuffix"] : [];
    for (const o of t.tokens)
      if (!(n.indexOf(o) >= 0))
        return e === "tile" ? `{${o}} is not a tile token` : `{${o}} is not allowed in a ${e} URL`;
    if (e === "tile" && !t.tile) return "needs {z}, {x} and {y} (or {-y} / {quadkey})";
    if (e === "glyph" && !(t.tokens.has("fontstack") && t.tokens.has("range"))) return "needs {fontstack} and {range}";
  }
  var ae = (e) => new $("unsupported-template", `Unsupported URL template: ${e}`);
  var At = (e) => {
    const t = [];
    return { text: e.replace(/\{[^{}]*\}/g, (o) => (t.push(o), `__weiwudi${t.length - 1}__`)), tokens: t };
  };
  var fn = (e, t) => e.replace(/__weiwudi(\d+)__/gi, (n, o) => t[Number(o)] ?? n);
  var Oi = (e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var cr = (e) => {
    try {
      return new URL(e);
    } catch {
      throw ae("not an absolute URL");
    }
  };
  var pn = (e) => new Set(e.map((t) => t.toLowerCase()));
  var mn = (e) => {
    const t = e.indexOf("="), n = t < 0 ? e : e.slice(0, t), o = new URLSearchParams(`${n}=`).keys().next();
    return o.done ? "" : o.value;
  };
  var Ii = (e) => {
    const t = e.indexOf("=");
    return t < 0 ? "" : new URLSearchParams(`=${e.slice(t + 1)}`).get("") ?? "";
  };
  var Ri = (e) => {
    const t = /^([A-Za-z][A-Za-z0-9+.-]*:)(\/\/[^/?#]*)?([^?#]*)(?:\?([^#]*))?(#[\s\S]*)?$/.exec(e);
    if (!t) throw ae("not an absolute URL");
    return { scheme: t[1], authority: t[2] ?? "", path: t[3], query: t[4], hash: t[5] };
  };
  var Ei = (e) => `${e.scheme}${e.authority}${e.path}${e.query !== void 0 && e.query !== "" ? `?${e.query}` : ""}${e.hash ?? ""}`;
  var _i = (e, t) => e.split("&").filter((n) => n !== "" && !t.has(mn(n).toLowerCase()));
  function He(e, t) {
    const n = At(e);
    cr(n.text);
    const o = Ri(n.text);
    o.scheme = o.scheme.toLowerCase();
    const r = o.authority.lastIndexOf("@");
    if (o.authority = r < 0 ? o.authority.toLowerCase() : o.authority.slice(0, r + 1) + o.authority.slice(r + 1).toLowerCase(), o.query !== void 0) {
      const s = _i(o.query, pn(t)).map((i) => ({ p: i, name: mn(i) })).sort((i, a) => i.name < a.name ? -1 : i.name > a.name ? 1 : 0);
      o.query = s.map((i) => i.p).join("&");
    }
    return fn(Ei(o), n.tokens);
  }
  function hn(e) {
    const t = e.search(/[?#]/);
    return t < 0 ? `${e}${to}` : `${e.slice(0, t)}${to}${e.slice(t)}`;
  }
  function lr(e, t, n) {
    const o = At(e), r = /^([^?#]*)(?:\?([^#]*))?(#[\s\S]*)?$/.exec(o.text);
    if (!r || r[2] === void 0) return e;
    const s = pn(t), i = n === void 0 ? void 0 : new Map(Object.entries(n).map(([c, d]) => [c.toLowerCase(), d])), a = r[2].split("&").filter((c) => {
      if (c === "") return false;
      const d = mn(c).toLowerCase();
      if (!s.has(d)) return true;
      if (i === void 0) return false;
      const l = i.get(d);
      return l === void 0 || Ii(c) !== l;
    }).join("&");
    return fn(`${r[1]}${a !== "" ? `?${a}` : ""}${r[3] ?? ""}`, o.tokens);
  }
  var oo = (e, t) => {
    let n;
    try {
      n = De(He(e, t));
    } catch {
      return;
    }
    return JSON.stringify([
      n.origin,
      n.pathRe.source,
      n.pathTokens,
      n.queryTokens.map((o) => [o.name, o.token]).sort(),
      n.queryFixed.map((o) => [o.name, o.value]).sort()
    ]);
  };
  function ji(e, t, n) {
    const o = new Set(e.map((s) => He(s, n))), r = new Set(e.map((s) => oo(s, n)).filter((s) => s !== void 0));
    return t.some((s) => {
      if (o.has(He(s, n))) return true;
      const i = oo(s, n);
      return i !== void 0 && r.has(i);
    });
  }
  function Ti(e, t) {
    const n = At(e);
    let o;
    try {
      o = new URL(n.text, t).href;
    } catch {
      throw ae("cannot be resolved");
    }
    return fn(o, n.tokens);
  }
  function De(e) {
    const t = At(e), n = t.tokens.map((w) => {
      const b = w.slice(1, -1);
      if (!xi(b)) throw ae("unknown token");
      return b;
    }), o = cr(t.text);
    if (o.protocol !== "http:" && o.protocol !== "https:") throw ae("only http: and https: are supported");
    let r = 0;
    const s = o.pathname.split(/__weiwudi(\d+)__/i), i = [];
    let a = "^";
    s.forEach((w, b) => {
      if (b % 2 === 0)
        a += Oi(w);
      else {
        const I = n[Number(w)];
        if (I === void 0) throw ae("unknown token");
        i.push(I), a += no(I), r++;
      }
    }), a += "$";
    const c = [], d = [];
    for (const [w, b] of o.searchParams) {
      if (/__weiwudi\d+__/i.test(w)) throw ae("a token in a query parameter name");
      const I = /^__weiwudi(\d+)__$/i.exec(b);
      if (I) {
        const M = n[Number(I[1])];
        if (M === void 0) throw ae("unknown token");
        c.push({ name: w, token: M, re: new RegExp(`^${no(M)}$`) }), r++;
      } else {
        if (/__weiwudi\d+__/i.test(b))
          throw ae("a token in a part of a query value");
        d.push({ name: w, value: b });
      }
    }
    if (r !== t.tokens.length) throw ae("a token outside the path and query values");
    const l = new Set(n), u = l.has("z") || l.has("quadkey"), m = l.has("x") || l.has("quadkey"), k = l.has("y") || l.has("quadkey") || l.has("-y") && u;
    if (l.has("-y") && !u) throw ae("{-y} needs {z}");
    if (l.has("prefix") && !(m && k)) throw ae("{prefix} needs {x} and {y}");
    return {
      template: e,
      origin: o.origin,
      pathRe: new RegExp(a),
      pathTokens: i,
      queryTokens: c,
      queryFixed: d,
      tokens: l,
      tile: u && m && k
    };
  }
  var Mi = (e) => {
    try {
      return decodeURIComponent(e);
    } catch {
      return e;
    }
  };
  var $i = (e) => {
    const t = /* @__PURE__ */ new Map();
    for (const [b, I] of e) t.set(b, [...t.get(b) ?? [], I]);
    const n = (b) => {
      const I = t.get(b);
      if (I)
        return I.every((M) => M === I[0]) ? I[0] : null;
    }, o = (b) => {
      const I = n(b);
      return I == null ? I : Number(I);
    }, r = {};
    let s = o("z"), i = o("x"), a = o("y");
    if (s === null || i === null || a === null) return null;
    const c = n("quadkey");
    if (c === null) return null;
    if (c !== void 0) {
      let b = 0, I = 0;
      for (const M of c) {
        const N = Number(M);
        b = b * 2 + (N & 1), I = I * 2 + (N >> 1 & 1);
      }
      if (s !== void 0 && s !== c.length || i !== void 0 && i !== b || a !== void 0 && a !== I) return null;
      s = c.length, i = b, a = I;
    }
    const d = o("-y");
    if (d === null || s !== void 0 && s > ce) return null;
    if (d !== void 0 && s !== void 0) {
      const b = Math.pow(2, s) - 1 - d;
      if (a !== void 0 && a !== b) return null;
      a = b;
    }
    if (s !== void 0) {
      const b = Math.pow(2, s);
      if (i !== void 0 && i >= b || a !== void 0 && (a < 0 || a >= b)) return null;
    }
    const l = n("prefix");
    if (l === null || l !== void 0 && (i === void 0 || a === void 0 || l.toLowerCase() !== Ho(i, a))) return null;
    const u = n("ratio");
    if (u === null) return null;
    const m = n("fontstack"), k = n("range"), w = n("spriteSuffix");
    return m === null || k === null || w === null ? null : (s !== void 0 && (r.z = s), i !== void 0 && (r.x = i), a !== void 0 && (r.y = a), u !== void 0 && (r.ratio = u), m !== void 0 && (r.fontstack = Mi(m)), k !== void 0 && (r.range = k), w !== void 0 && (r.suffix = w), r);
  };
  var ot = (e, t, n) => e.split(t).join(n);
  function Pi(e, t) {
    let n = t.z !== void 0 && t.x !== void 0 && t.y !== void 0 ? Jo(e, t.z, t.x, t.y, { all: true, ratio: t.ratio ?? "" }) : ot(e, "{ratio}", t.ratio ?? "");
    return t.fontstack !== void 0 && (n = ot(n, "{fontstack}", encodeURIComponent(t.fontstack))), t.range !== void 0 && (n = ot(n, "{range}", t.range)), t.spriteSuffix !== void 0 && (n = ot(n, "{spriteSuffix}", t.spriteSuffix)), n;
  }
  function yn(e, t) {
    if (t.origin !== e.origin) return null;
    const n = e.pathRe.exec(t.pathname);
    if (!n) return null;
    const o = e.pathTokens.map((c, d) => [c, n[d + 1] ?? ""]), r = t.searchParams;
    for (const c of e.queryTokens) {
      const d = r.getAll(c.name);
      if (d.length !== 1) return null;
      const l = c.re.exec(d[0]);
      if (!l) return null;
      o.push([c.token, l[1] ?? ""]);
    }
    const s = e.queryFixed.map((c) => c.name).filter((c, d, l) => l.indexOf(c) === d);
    for (const c of s) {
      const d = e.queryFixed.filter((u) => u.name === c).map((u) => u.value).sort(), l = r.getAll(c).sort();
      if (d.length !== l.length || d.some((u, m) => u !== l[m])) return null;
    }
    const i = $i(o);
    if (!i) return null;
    const a = [...e.queryTokens.map((c) => c.name), ...e.queryFixed.map((c) => c.name)].filter((c, d, l) => l.indexOf(c) === d);
    return { ...i, queryParams: a };
  }
  var dt = (e) => /^sk\./i.test(e.replace(/^\s*(?:(?:bearer|token|basic)\s+)?\s*/i, ""));
  var Li = (e, t) => /^sk\./i.test(e) || dt(t);
  var Bi = (e, t, n) => {
    const o = pn(n), r = [...e.searchParams].filter(([s, i]) => t.indexOf(s) < 0 && !o.has(s.toLowerCase()) && !Li(s, i)).sort((s, i) => s[0] < i[0] ? -1 : s[0] > i[0] ? 1 : s[1] < i[1] ? -1 : s[1] > i[1] ? 1 : 0);
    return r.length === 0 ? "" : `?${new URLSearchParams(r).toString()}`;
  };
  function dr(e, t, n, o, r) {
    if (t === "glyph") return `${e}\0${n.fontstack ?? ""}`;
    const s = Bi(o, n.queryParams, r);
    if (t === "tile") {
      if (n.z === void 0 || n.x === void 0 || n.y === void 0)
        throw new $("internal", "A tile key needs z, x and y");
      return `${e}\0${Vo(n.z, n.x, n.y, n.ratio)}${s}`;
    }
    return t === "sprite" ? `${e}\0${n.suffix ?? ""}${s}` : `${e}\0${s}`;
  }
  var Di = class {
    constructor(t = []) {
      this.byOrigin = /* @__PURE__ */ new Map(), this.count = 0;
      for (const n of t) this.add(n);
    }
    add(t) {
      const n = this.byOrigin.get(t.compiled.origin);
      n ? n.push(t) : this.byOrigin.set(t.compiled.origin, [t]), this.count++;
    }
    get size() {
      return this.count;
    }
    match(t) {
      const n = this.byOrigin.get(t.origin);
      if (!n) return null;
      for (const o of n) {
        const r = yn(o.compiled, t);
        if (r) return { resourceId: o.resourceId, type: o.type, m: r };
      }
      return null;
    }
  };
  var we = (e) => typeof e == "object" && e !== null && !Array.isArray(e);
  var Je = (e) => new $("invalid-style", e === "style" ? "The style is not readable" : "The TileJSON is not readable", { type: e });
  var St = (e) => {
    try {
      return JSON.parse(e);
    } catch {
      return;
    }
  };
  var ut = (e) => we(e) && Object.prototype.hasOwnProperty.call(e, "version") && we(e.sources);
  var gn = (e, t) => {
    try {
      return Ti(e, t);
    } catch {
      return;
    }
  };
  var wn = (e) => Array.isArray(e) && e.length > 0 && e.every((t) => typeof t == "string");
  var Mt = (e) => typeof e == "number" && Number.isFinite(e);
  var ur = (e) => {
    const t = {};
    return (e.scheme === "xyz" || e.scheme === "tms") && (t.scheme = e.scheme), Array.isArray(e.bounds) && e.bounds.length === 4 && e.bounds.every(Mt) && (t.bounds = e.bounds.slice()), Mt(e.minzoom) && (t.minzoom = e.minzoom), Mt(e.maxzoom) && (t.maxzoom = e.maxzoom), t;
  };
  var Ci = Object.freeze({
    tilejson: "tilejson",
    tiles: "tile",
    glyphs: "glyph",
    sprite: "sprite",
    data: "data"
  });
  var fr = (e, t) => {
    try {
      const n = new URL(t.replace(/\{[^{}]*\}/g, "0"));
      return n.username !== "" || n.password !== "" ? false : ar(e, De(e === "sprite" ? hn(t) : t)) === void 0;
    } catch {
      return false;
    }
  };
  var ro = Object.freeze({
    vector: "vector",
    raster: "raster",
    "raster-dem": "raster"
  });
  var Ui = (e) => {
    const t = [], n = [];
    for (const [r, s] of Object.entries(e.sources)) {
      if (!we(s)) {
        n.push(r);
        continue;
      }
      const i = typeof s.type == "string" ? s.type : "", a = Object.prototype.hasOwnProperty.call(ro, i) ? ro[i] : void 0;
      a ? (typeof s.url == "string" && t.push({ slot: "tilejson", name: r, urls: [s.url], set: ([c]) => {
        s.url = c;
      } }), wn(s.tiles) && t.push({ slot: "tiles", name: r, urls: s.tiles.slice(), set: (c) => {
        s.tiles = c;
      }, source: s, encoding: a })) : i === "geojson" ? typeof s.data == "string" && t.push({ slot: "data", name: r, urls: [s.data], set: ([c]) => {
        s.data = c;
      } }) : i === "image" ? typeof s.url == "string" && t.push({ slot: "data", name: r, urls: [s.url], set: ([c]) => {
        s.url = c;
      } }) : n.push(r);
    }
    typeof e.glyphs == "string" && t.push({ slot: "glyphs", urls: [e.glyphs], set: ([r]) => {
      e.glyphs = r;
    } });
    const o = e.sprite;
    if (typeof o == "string")
      t.push({ slot: "sprite", urls: [o], set: ([r]) => {
        e.sprite = r;
      } });
    else if (Array.isArray(o))
      for (const r of o)
        we(r) && typeof r.url == "string" && t.push({
          slot: "sprite",
          urls: [r.url],
          set: ([s]) => {
            r.url = s;
          },
          ...typeof r.id == "string" ? { spriteId: r.id } : {}
        });
    return { groups: t, unsupported: n };
  };
  var pr = (e, t, n) => {
    const { groups: o, unsupported: r } = Ui(e), s = r.slice(), i = [], a = [];
    for (const c of o) {
      const d = c.urls.map((u) => gn(u, t)), l = Ci[c.slot];
      d.every((u) => u !== void 0 && fr(l, u)) && (!n || n(l, d.map((u) => l === "sprite" ? hn(u) : u))) ? a.push({ ...c, abs: d }) : c.name !== void 0 ? s.indexOf(c.name) < 0 && s.push(c.name) : (c.slot === "glyphs" || c.slot === "sprite") && i.push(c.slot === "glyphs" ? { slot: c.slot } : { slot: c.slot, ...c.spriteId !== void 0 ? { spriteId: c.spriteId } : {} });
    }
    return { groups: a.filter((c) => c.name === void 0 || s.indexOf(c.name) < 0), skipped: s, dropped: i };
  };
  function ft(e) {
    const t = St(e);
    if (!ut(t)) throw Je("style");
    return t;
  }
  function zi(e, t, n) {
    if (!ut(e)) throw Je("style");
    const { groups: o, skipped: r, dropped: s } = pr(e, t, n), i = {
      tilejson: [],
      tiles: [],
      sprites: [],
      spriteIds: [],
      data: [],
      skipped: r.map((a) => ({ name: a, reason: "unsupported-source" })),
      dropped: s
    };
    for (const a of o) {
      const { abs: c } = a;
      switch (a.slot) {
        case "tilejson":
          i.tilejson.push({ name: a.name, url: c[0] });
          break;
        case "tiles":
          i.tiles.push({ name: a.name, encoding: a.encoding, urls: c, ...ur(a.source) });
          break;
        case "glyphs":
          i.glyphs = c[0];
          break;
        case "sprite":
          i.sprites.push(c[0]), i.spriteIds.push(a.spriteId);
          break;
        case "data":
          i.data.push({ name: a.name, url: c[0] });
          break;
      }
    }
    return i;
  }
  function Ni(e, t) {
    const n = St(e);
    return !we(n) || !Array.isArray(n.tiles) ? void 0 : { urls: n.tiles.map((r) => typeof r == "string" ? gn(r, t) : void 0).filter((r) => r !== void 0), ...ur(n) };
  }
  var mr = (e, t, n) => {
    if (t.some((r) => !n.shouldStrip(r))) return;
    const o = e.map((r) => lr(r, n.credentialParams, n.credentialValues));
    return o.some((r, s) => r !== e[s]) ? o : void 0;
  };
  function Xi(e, t, n) {
    let o = ft(e), r = false;
    if (n.rewriteStyle) {
      const s = n.rewriteStyle(o);
      if (!ut(s) || (o = St(JSON.stringify(s)), !ut(o))) throw Je("style");
      r = true;
    }
    if (n.strip)
      for (const s of pr(o, t, n.strip.accepts).groups) {
        const i = mr(s.urls, s.abs, n.strip);
        i && (s.set(i), r = true);
      }
    return r ? JSON.stringify(o) : e;
  }
  function Fi(e, t, n) {
    const o = St(e);
    if (!we(o) || !Array.isArray(o.tiles)) throw Je("tilejson");
    if (!n.strip || !wn(o.tiles)) return e;
    const r = o.tiles.map((i) => gn(i, t));
    if (!r.every((i) => i !== void 0 && fr("tile", i)) || n.strip.accepts && !n.strip.accepts("tile", r)) return e;
    const s = mr(o.tiles, r, n.strip);
    return s ? (o.tiles = s, JSON.stringify(o)) : e;
  }
  function hr(e) {
    return (t) => {
      let n;
      try {
        n = new URL(t.replace(/\{[^{}]*\}/g, "0")).origin;
      } catch {
        n = void 0;
      }
      if (n !== void 0 && n !== "null" && n === e.styleOrigin) return true;
      if (!e.providerMatches) return false;
      try {
        return e.providerMatches(t) === true;
      } catch {
        return false;
      }
    };
  }
  var Zi = /* @__PURE__ */ new Set([
    "array",
    "boolean",
    "collator",
    "format",
    "image",
    "literal",
    "number",
    "number-format",
    "object",
    "string",
    "to-boolean",
    "to-color",
    "to-number",
    "to-string",
    "typeof",
    "accumulated",
    "feature-state",
    "geometry-type",
    "id",
    "line-progress",
    "properties",
    "at",
    "config",
    "get",
    "has",
    "in",
    "index-of",
    "length",
    "slice",
    "split",
    "join",
    "!",
    "!=",
    "<",
    "<=",
    "==",
    ">",
    ">=",
    "all",
    "any",
    "case",
    "coalesce",
    "match",
    "within",
    "distance",
    "global-state",
    "interpolate",
    "interpolate-hcl",
    "interpolate-lab",
    "step",
    "let",
    "var",
    "concat",
    "downcase",
    "is-supported-script",
    "resolved-locale",
    "upcase",
    "rgb",
    "rgba",
    "to-rgba",
    "-",
    "*",
    "/",
    "%",
    "^",
    "+",
    "abs",
    "acos",
    "asin",
    "atan",
    "ceil",
    "cos",
    "e",
    "floor",
    "ln",
    "ln2",
    "log10",
    "log2",
    "max",
    "min",
    "pi",
    "round",
    "sin",
    "sqrt",
    "tan",
    "zoom",
    "heatmap-density",
    "elevation"
  ]);
  var Yi = (e) => {
    let t = e;
    if (Array.isArray(e) && e.length === 2 && e[0] === "literal" && Array.isArray(e[1])) t = e[1];
    else if (Array.isArray(e) && typeof e[0] == "string" && Zi.has(e[0])) return;
    return wn(t) ? t.join(",") : void 0;
  };
  function Wi(e) {
    const t = [], n = we(e) && Array.isArray(e.layers) ? e.layers : [];
    for (const o of n) {
      const r = we(o) ? o.layout : void 0, s = we(r) ? Yi(r["text-font"]) : void 0;
      s !== void 0 && t.indexOf(s) < 0 && t.push(s);
    }
    return t;
  }
  var Gi = "weiwudi";
  var yr = Object.freeze({ type: "table" });
  var gr = 3e3;
  var Ki = 100;
  var qi = 1e3;
  var Hi = 3e4;
  var so = (e) => e.method === "GET" && e.mode !== "navigate" && (e.destination === "" || e.destination === "image");
  var Ji = (e) => {
    try {
      return De(e).origin;
    } catch {
      return;
    }
  };
  var Vi = (e, t) => t.compiled.queryFixed.length - e.compiled.queryFixed.length || t.compiled.queryTokens.length - e.compiled.queryTokens.length || e.rank - t.rank || (e.resourceId < t.resourceId ? -1 : e.resourceId > t.resourceId ? 1 : 0) || e.index - t.index;
  var Qi = (e) => JSON.stringify([
    e.origin,
    e.pathRe.source,
    e.queryTokens.map((t) => [t.name, t.re.source]).sort(),
    e.queryFixed.map((t) => [t.name, t.value]).sort()
  ]);
  var ea = (e) => {
    const t = /* @__PURE__ */ new Map(), n = [];
    for (const o of e) {
      const r = Qi(o.compiled), s = t.get(r);
      if (s === void 0) t.set(r, o.resourceId);
      else if (s !== o.resourceId) {
        const i = `template-shadowed: ${o.resourceId}`;
        n.indexOf(i) < 0 && n.push(i);
      }
    }
    return n;
  };
  var ta = async (e) => {
    const t = await e.store(), [n, o] = await Promise.all([t.listResources(), t.listSources()]), r = o.filter((l) => !Mo(l)), s = await Promise.all(r.map((l) => t.getCredentials(l.id))), i = r.filter((l, u) => et(s[u])).map((l) => l.id), a = new Map(r.map((l) => [l.id, l.order])), c = [], d = /* @__PURE__ */ new Map();
    for (const l of n) {
      if (l.id.startsWith(xe)) continue;
      const u = Math.min(1 / 0, ...l.sourceIds.map((b) => a.get(b) ?? 1 / 0)), m = [];
      l.templates.forEach((b, I) => {
        let M;
        try {
          M = De(b);
        } catch {
          return;
        }
        new URL(M.origin).hostname !== Xt && (c.push({ resourceId: l.id, type: l.type, compiled: M, rank: u, index: I }), m.indexOf(M.origin) < 0 && m.push(M.origin));
      });
      const k = e.table.pickCredentialSource;
      if (!k || i.length === 0) continue;
      const w = /* @__PURE__ */ new Map();
      for (const b of m) {
        const I = r.filter((N) => $o(N).some((f) => Ji(f) === b)), M = k(l, I, i);
        M !== void 0 && w.set(b, M);
      }
      w.size > 0 && d.set(l.id, w);
    }
    return c.sort(Vi), { table: new Di(c), credentialSources: d, warnings: ea(c) };
  };
  var wr = (e, t) => {
    e.failures++, e.retryAt = t + Math.min(qi * Math.pow(2, e.failures - 1), Hi);
  };
  var bn = (e) => {
    const t = e.table, n = t.generation, o = ta(e).then((r) => (t.loading === o && (t.loading = void 0), t.generation !== n ? t.loading ?? bn(e) : (t.current = r, t.failures = 0, t.retryAt = 0, r)), (r) => {
      throw t.loading === o && (t.loading = void 0, wr(t, Date.now())), r;
    });
    return t.loading = o, o.catch(() => {
    }), o;
  };
  var br = (e, t) => {
    const n = e.table;
    if (n.current) return Promise.resolve(n.current);
    if (n.loading) return n.loading;
    if (!(t < n.retryAt))
      return bn(e);
  };
  var vr = (e, t) => new Promise((n, o) => {
    const r = setTimeout(() => o(new Error("timeout")), t);
    e.then((s) => {
      clearTimeout(r), n(s);
    }, (s) => {
      clearTimeout(r), o(s);
    });
  });
  var Ar = (e) => (e.table.generation++, e.table.loading ?? bn(e));
  async function na(e) {
    const t = Ar(e), n = e.table;
    return n.notifyTimer !== void 0 && clearTimeout(n.notifyTimer), n.notifyTimer = setTimeout(() => {
      n.notifyTimer = void 0;
      try {
        Sr(e)?.postMessage(yr);
      } catch {
      }
    }, Ki), (await t).warnings.slice();
  }
  var Sr = (e) => {
    if (!e.table.channel && typeof BroadcastChannel < "u") {
      const t = new BroadcastChannel(Gi);
      t.onmessage = (n) => {
        const o = n.data;
        o && o.type === yr.type && Ar(e).catch(() => {
        });
      }, e.table.channel = t;
    }
    return e.table.channel;
  };
  async function kr(e, t, n, o) {
    let r = o ?? e.table.current;
    if (!r) {
      const a = br(e, Date.now());
      if (!a) return {};
      try {
        r = await a;
      } catch {
        return {};
      }
    }
    const s = r.credentialSources.get(t.id)?.get(n);
    if (s === void 0) return {};
    const i = await (await e.store()).getCredentials(s);
    return et(i) ? { credentials: i, credentialSourceId: s } : { credentialSourceId: s };
  }
  var oa = (e, t) => t.provider === void 0 ? void 0 : e.providers().find((n) => n.id === t.provider);
  var ra = (e, t) => e.order - t.order || (e.id < t.id ? -1 : e.id > t.id ? 1 : 0);
  var sa = async (e, t, n) => {
    const o = await e.store();
    if (n !== void 0) return o.getSource(n);
    const r = (await Promise.all(t.sourceIds.map((s) => o.getSource(s)))).filter((s) => s !== void 0).sort(ra);
    for (const s of r)
      if (et(await o.getCredentials(s.id))) return s;
  };
  var ia = async (e, t, n) => {
    const o = await sa(e, t, n);
    if (!o || o.parentId === void 0) return;
    const r = await (await e.store()).getCredentials(o.id);
    if (!et(r)) return;
    const s = await (await e.store()).getSource(o.parentId), i = s ? le(s) : void 0;
    return i ? xr(e, t, i, r) : void 0;
  };
  var xr = (e, t, n, o) => {
    let r;
    try {
      r = new URL(n.url).origin;
    } catch {
      return;
    }
    const s = n.provider === void 0 ? void 0 : e.providers().find((c) => c.id === n.provider), i = t.policy.credentialParams, a = e.acceptsMember;
    return {
      credentialParams: i,
      credentialValues: o.query ?? {},
      shouldStrip: hr({ styleOrigin: r, ...s ? { providerMatches: (c) => s.matches(c) } : {} }),
      ...a ? { accepts: (c, d) => a(c, d, n.policy.credentialParams) } : {}
    };
  };
  var aa = (e, t, n, o) => async (r) => {
    const s = await o(), i = await r.text(), a = e === "style" ? Xi(i, t, { ...n ? { rewriteStyle: n } : {}, ...s ? { strip: s } : {} }) : Fi(i, t, s ? { strip: s } : {});
    return a === i ? r : new Blob([a], { type: r.type });
  };
  async function vn(e, t, n, o, r, s, i = {}) {
    const a = () => Date.now(), c = oa(e, t);
    let d = {};
    if (t.type === "style" || t.type === "tilejson") {
      const u = i.parent, m = u ? async () => et(s) ? xr(e, t, u, s) : void 0 : () => ia(e, t, i.credentialSourceId), k = t.type === "style" && c?.rewriteStyle ? (w) => c.rewriteStyle(w) : void 0;
      d = { isStyleLike: true, transform: aa(t.type, o.href, k, m) };
    }
    const l = {
      resourceId: t.id,
      // 鍵は読み直した Resource の credentialParams で作る（資格情報をキーに残さない）。sprite は {spriteSuffix} の値で作る
      key: dr(t.id, t.type, r, o, t.policy.credentialParams),
      ...t.type === "tile" && r.z !== void 0 && r.x !== void 0 && r.y !== void 0 ? { coord: { z: r.z, x: r.x, y: r.y } } : {},
      // グリフは範囲を渡す（同じ fontstack の範囲を 1 レコードへ束ねるのは core と store）
      ...t.type === "glyph" && r.range !== void 0 ? { part: r.range, ...i.collect ? { collect: i.collect } : {} } : {},
      ...d,
      ...i.revalidate === true ? { revalidate: true } : {},
      request: n,
      storable: hi(n, t.policy),
      upstream: Ai(e, { resourceId: t.id, original: n, credentials: s, provider: c, now: a })
    };
    return rr(e, l, a);
  }
  var io = async (e, t, n, o, r) => {
    if (t.headers.has("range")) return ln(() => e.upstreamFetch(t));
    let s, i, a;
    try {
      if (s = await (await e.store()).getResource(o.resourceId), s) {
        const d = await kr(e, s, n.origin, r);
        a = d.credentialSourceId, un(t) || (i = d.credentials);
      }
    } catch {
      return e.upstreamFetch(t);
    }
    if (!s) return e.upstreamFetch(t);
    try {
      return await vn(e, s, t, n, o.m, i, a === void 0 ? {} : { credentialSourceId: a });
    } catch {
      return e.upstreamFetch(t);
    }
  };
  function ca(e, t, n) {
    e.table.pickCredentialSource = n.pickCredentialSource, Sr(e), t(({ url: a, request: c }) => {
      const d = e.table.current;
      return !d || !so(c) ? false : d.table.match(a) ?? false;
    }, async ({ url: a, request: c, params: d, event: l }) => {
      const u = d ?? e.table.current?.table.match(a) ?? void 0;
      return u ? (e.maintain?.(l), io(e, c, a, u, e.table.current)) : e.upstreamFetch(c);
    }, "GET");
    const s = ({ request: a }) => {
      const c = e.table;
      return c.current || !so(a) ? false : !!c.loading || Date.now() >= c.retryAt;
    }, i = async ({ url: a, request: c, event: d }) => {
      const l = br(e, Date.now());
      if (!l) return e.upstreamFetch(c);
      let u;
      try {
        u = await vr(l, gr);
      } catch {
        const w = e.table;
        return w.loading === l && (w.loading = void 0, wr(w, Date.now())), e.upstreamFetch(c);
      }
      const m = u.table.match(a);
      return m ? (e.maintain?.(d), io(e, c, a, m, u)) : e.upstreamFetch(c);
    };
    queueMicrotask(() => t(s, i, "GET"));
  }
  var la = (e) => e.id.startsWith(xe);
  var Or = (e) => `resource-conflict: ${e}`;
  var lt = (e, t) => (e ?? []).filter((n) => n !== t);
  var An = (e) => e.filter((t, n) => e.indexOf(t) === n);
  var Ir = (...e) => {
    const t = /* @__PURE__ */ new Set(), n = [];
    for (const o of e)
      for (const r of o) {
        const s = r.toLowerCase();
        t.has(s) || (t.add(s), n.push(r));
      }
    return n;
  };
  var Rr = (e, t) => e.order - t.order || (e.id < t.id ? -1 : e.id > t.id ? 1 : 0);
  var Ht = (e) => e.slice().sort(Rr).map(Oe).filter((t) => t !== void 0);
  var Er = (e) => e.type === "tile" ? e.encoding ?? (e.kind === "raster" || e.kind === "vector" ? e.kind : void 0) : void 0;
  var kt = (e) => e.type === "tile";
  var _r = (e, t, n) => `${e}\0${t}:${n}`;
  function jr(e, t) {
    const n = encodeURIComponent(t ?? "");
    switch (e) {
      case "source":
        return n;
      case "tilejson-tiles":
        return `${n}/tiles`;
      case "glyphs":
        return "glyphs";
      case "sprite":
        return t === void 0 ? "sprite" : `sprite/${n}`;
      case "data":
        return `sources/${n}/data`;
      case "style":
        return "style";
    }
  }
  var da = (e) => e === "vector" ? "empty" : "transparent";
  var ua = (e, t) => {
    const n = e.extent ? { ...e.extent, sourceId: e.id } : { minZoom: 0, maxZoom: ce, sourceId: e.id };
    if (n.box) {
      const o = { ...n.box };
      if ((e.scheme ?? "xyz") !== (t ?? "xyz")) {
        const r = Math.pow(2, n.maxZoom) - 1;
        o.minY = r - n.box.maxY, o.maxY = r - n.box.minY;
      }
      n.box = o;
    }
    return n;
  };
  function ao(e, t, n, o = []) {
    const r = Ht(t), s = [...r, ...Ht(n)].filter(kt).map((l) => ua(l, e.scheme));
    if (r.length === 0) return { policy: e.policy, extents: s };
    const i = [...r.map((l) => l.policy), ...o], a = (l) => {
      const u = i.map((m) => m.outOfRange[l]);
      return u.every((m) => m === u[0]) ? u[0] : da(e.encoding);
    }, c = {
      cacheTtl: Math.min(...i.map((l) => l.cacheTtl)),
      store: i.every((l) => l.store),
      outOfRange: { extent: a("extent"), zoom: a("zoom") },
      credentialParams: e.count > 0 ? e.policy.credentialParams.slice() : Ir(...i.map((l) => l.credentialParams))
    }, d = i.map((l) => l.cacheRetention);
    return d.every((l) => l !== void 0) && (c.cacheRetention = Math.max(...d)), { policy: c, extents: s };
  }
  var co = (e, t) => {
    const n = An([].concat(...Ht(t).map((o) => o.templates)));
    return n.length > 0 ? n : e.templates.slice();
  };
  function fa(e, t, n) {
    return t.filter((r) => e.sourceIds.indexOf(r.id) >= 0 && n.indexOf(r.id) >= 0).sort(Rr)[0]?.id;
  }
  function xt(e, t) {
    const n = typeof t == "string" ? [t] : t;
    return e.sourceIds.length > 0 && e.sourceIds.every((o) => n.indexOf(o) >= 0) && (e.rangeOnlySourceIds ?? []).every((o) => n.indexOf(o) >= 0);
  }
  var pa = (e, t) => {
    if (e.type !== t.type) return "type";
    if (kt(t)) {
      const n = Er(t);
      if ((e.encoding ?? n) !== n) return "encoding";
      if ((e.scheme ?? "xyz") !== (t.scheme ?? "xyz")) return "scheme";
    }
    if (e.provider !== t.provider) return "provider";
    if (e.count > 0) {
      const n = new Set(e.policy.credentialParams.map((o) => o.toLowerCase()));
      if (t.policy.credentialParams.some((o) => !n.has(o.toLowerCase()))) return "credentialParams";
    }
  };
  var ma = (e, t) => {
    const n = e.find((o) => !t.has(o));
    if (n !== void 0) return n;
    for (let o = 2; ; o++) {
      const r = `${e[0]}#${o}`;
      if (!t.has(r)) return r;
    }
  };
  function ha(e, t, n) {
    const o = e.spec, r = o.id, s = n.filter((c) => !la(c)), i = s.filter((c) => ji(c.templates, o.templates, Ir(o.policy.credentialParams, c.policy.credentialParams))), a = { sourceId: r, rangeOnly: [], keep: [], leave: [], conflicts: [], warnings: [] };
    if (i.length === 0)
      a.join = { resourceId: ma(o.templates, new Set(n.map((c) => c.id))), create: true };
    else if (i.length === 1 && pa(i[0], o) === void 0)
      a.join = { resourceId: i[0].id, create: false };
    else
      for (const c of i)
        a.conflicts.push(c.id), a.warnings.push(Or(c.id)), t !== void 0 && c.sourceIds.indexOf(r) >= 0 ? a.keep.push(c.id) : c.type === "tile" && kt(o) && a.rangeOnly.push(c.id);
    return a.leave = s.filter((c) => i.indexOf(c) < 0 && (c.sourceIds.indexOf(r) >= 0 || (c.rangeOnlySourceIds ?? []).indexOf(r) >= 0)).map((c) => c.id), a;
  }
  var Tr = (e) => {
    const t = new Map(e.map((n) => [n.id, n]));
    return (n) => (n ?? []).map((o) => t.get(o)).filter((o) => o !== void 0);
  };
  var lo = (e, t) => e.warnings.indexOf(Or(t)) >= 0;
  var Mr = (e, t) => {
    const n = t(e.sourceIds), o = n.filter((l) => !lo(l, e.id)), r = n.filter((l) => lo(l, e.id)).map((l) => l.id), s = o.length > 0 ? ao(e, o, [], r.length > 0 ? [e.policy] : []) : { policy: e.policy, extents: [] }, i = (e.extents ?? []).filter((l) => r.indexOf(l.sourceId) >= 0).map((l) => ({ ...l })), a = ao(e, [], t(e.rangeOnlySourceIds)).extents ?? [], c = r.length === 0 ? co(e, o) : [...e.templates, ...co(e, o)], d = An(c.map((l) => He(l, s.policy.credentialParams)));
    return { policy: s.policy, extents: [...s.extents ?? [], ...i, ...a], templates: d };
  };
  var $r = (e) => (e.type === "tile" || delete e.extents, e);
  var Jt = (e, t) => {
    const n = { ...e, ...Mr(e, t) };
    return n.policy.cacheRetention === void 0 && delete n.policy.cacheRetention, $r(n);
  };
  var Pr = (e, t) => $r({ ...e, extents: Mr(e, t).extents });
  var Vt = (e, t) => {
    const n = { ...e };
    return t.length > 0 ? n.rangeOnlySourceIds = t : delete n.rangeOnlySourceIds, n;
  };
  var Lr = async (e, t, n, o) => {
    const r = await e.getResource(t);
    if (r) {
      if (lt(r.sourceIds, n).length === 0) {
        await e.deleteResource(t);
        return;
      }
      await e.patchResource(t, (s) => {
        const i = s.sourceIds.indexOf(n) >= 0, a = Vt({ ...s, sourceIds: lt(s.sourceIds, n) }, lt(s.rangeOnlySourceIds, n));
        return i ? Jt(a, o) : Pr(a, o);
      });
    }
  };
  var Sn = async (e, t, n, o) => {
    const r = t.spec, s = r.id;
    if (n && n.kind !== r.kind)
      throw new $(
        "attribute-invalid",
        'Attribute "kind" must not change for the same id (remove() it first)',
        { attribute: "kind" }
      );
    const i = ha(t, n, await e.listResources());
    if (o.throwOnConflict && i.conflicts.length > 0)
      throw new $(
        "resource-conflict",
        `Source "${s}" conflicts with ${i.conflicts.length} resource(s)`,
        { resourceIds: i.conflicts.slice() }
      );
    const a = o.order ?? (n ? n.order : await sn(e)), c = {
      id: s,
      kind: r.kind,
      spec: r,
      order: a,
      warnings: i.warnings.slice(),
      createdAt: n?.createdAt ?? Date.now()
    };
    o.parentId !== void 0 && (c.parentId = o.parentId), await e.putSource(c), t.credentials ? await e.putCredentials(s, t.credentials) : n && await e.putCredentials(s, {});
    const d = Tr(await e.listSources());
    if (i.join?.create) {
      const m = {
        id: i.join.resourceId,
        type: r.type,
        templates: r.templates.slice(),
        sourceIds: [s],
        policy: r.policy,
        count: 0,
        bytes: 0,
        pinnedBytes: 0
      }, k = Er(r);
      k !== void 0 && (m.encoding = k), kt(r) && (m.scheme = r.scheme ?? "xyz"), r.provider !== void 0 && (m.provider = r.provider), await e.createResource(Jt(m, d));
    } else i.join && await e.patchResource(i.join.resourceId, (m) => {
      const k = m.sourceIds.indexOf(s) >= 0 ? m.sourceIds.slice() : [...m.sourceIds, s], w = Jt(Vt({ ...m, sourceIds: k }, lt(m.rangeOnlySourceIds, s)), d);
      return o.resetCors && (delete w.corsOk, delete w.corslessUntil), w;
    });
    for (const m of i.rangeOnly)
      await e.patchResource(m, (k) => {
        const w = (k.rangeOnlySourceIds ?? []).indexOf(s) >= 0 ? k.rangeOnlySourceIds ?? [] : [...k.rangeOnlySourceIds ?? [], s];
        return Pr(Vt(k, w.slice()), d);
      });
    for (const m of i.leave) await Lr(e, m, s, d);
    const l = [...i.join ? [i.join.resourceId] : [], ...i.keep, ...i.rangeOnly], u = (await Promise.all(l.map((m) => e.getResource(m)))).filter((m) => m !== void 0);
    return { source: c, resources: u, warnings: i.warnings.slice() };
  };
  async function ya(e, t) {
    const n = await e.getSource(t.spec.id);
    return Sn(e, t, n && n.kind !== "legacy" ? n : void 0, { throwOnConflict: false, resetCors: false });
  }
  async function ga(e, t, n) {
    const o = await e.getSource(t);
    if (!o || o.kind === "legacy")
      throw new $("source-not-found", `Source "${t}" not found`, { sourceId: t });
    if (n.spec.id !== t)
      throw new $("attribute-invalid", 'Attribute "id" must not change in update()', { attribute: "id" });
    return Sn(e, n, o, { throwOnConflict: true, resetCors: true });
  }
  async function Ot(e, t) {
    const n = await e.getSource(t);
    if (!n || n.kind === "legacy")
      throw new $("source-not-found", `Source "${t}" not found`, { sourceId: t });
    const o = Tr((await e.listSources()).filter((s) => s.id !== t)), r = An([
      ...(await e.resourcesBySource(t)).map((s) => s.id),
      ...(await e.resourcesByRangeOnlySource(t)).map((s) => s.id)
    ]);
    for (const s of r) await Lr(e, s, t, o);
    await e.deleteSource(t);
  }
  var Se = 85.0511287798066;
  var B = (e, t = "is invalid") => new $("attribute-invalid", `Attribute "${e}" ${t}`, { attribute: e });
  var Pe = (e, t) => new $("unsupported-template", `URL template #${e + 1}: ${t}`, { index: e });
  var pt = (e) => new $("credential-rejected", `A secret token (sk.) is not accepted in ${e}`, { where: e });
  var wa = (e) => new $(
    "attribute-invalid",
    `URL templates carry different values for credential "${e}"; register each mirror as its own source`,
    { attribute: "url" }
  );
  var Re = (e) => typeof e == "object" && e !== null && !Array.isArray(e);
  var X = (e, t) => Object.prototype.hasOwnProperty.call(e, t) ? e[t] : void 0;
  var uo = (e) => typeof e == "number" && Number.isFinite(e) && e >= 0;
  var ke = (e) => typeof e == "number" && Number.isInteger(e) && e >= 0;
  var ze = (e) => dt(e);
  var mt = (e) => /^sk\.eyj/i.test(e);
  var fo = (e) => new URLSearchParams(`v=${e.replace(/&/g, "%26")}`).get("v") ?? e;
  var kn = (e) => {
    const t = e.indexOf("?");
    return t < 0 ? [] : e.slice(t + 1).split("&").filter((n) => n !== "").map((n) => {
      const o = n.indexOf("="), r = o < 0 ? n : n.slice(0, o), s = o < 0 ? "" : n.slice(o + 1);
      return { rawName: r, name: fo(r), raw: s, decoded: fo(s) };
    });
  };
  var ba = (e) => {
    if (e === "raster" || e === "vector" || e === "style" || e === "asset") return e;
    throw B("kind");
  };
  var va = (e) => {
    const t = typeof e == "string" ? [e] : Array.isArray(e) ? e : void 0;
    if (!t || t.length === 0) throw B("url", "must be a URL template or a non-empty array of them");
    return t.forEach((n) => {
      if (typeof n != "string" || n === "") throw B("url", "must contain only non-empty strings");
    }), t;
  };
  var po = (e, t) => {
    if (e === void 0) return;
    if (!Re(e)) throw B(t);
    const n = {};
    for (const [o, r] of Object.entries(e)) {
      if (typeof r != "string") throw B(t, "must have string values");
      n[o] = r;
    }
    return n;
  };
  var Aa = (e) => {
    if (e === void 0) return;
    if (!Re(e)) throw B("credentials");
    const t = po(X(e, "query"), "credentials.query"), n = po(X(e, "headers"), "credentials.headers");
    for (const s of Object.values(t ?? {})) if (ze(s)) throw pt("credentials.query");
    const o = Object.keys(t ?? {}).map((s) => s.toLowerCase());
    if (o.some((s, i) => o.indexOf(s) !== i)) throw B("credentials.query", "must not repeat a name in a different case");
    for (const s of Object.values(n ?? {})) if (ze(s)) throw pt("credentials.headers");
    const r = {};
    return t && (r.query = t), n && (r.headers = n), r;
  };
  var Sa = (e, t, n = []) => {
    if (e !== void 0 && (!Array.isArray(e) || e.some((s) => typeof s != "string" || s === "")))
      throw B("credentialParams", "must be an array of non-empty strings");
    const o = [...Si, ...e ?? [], ...n].filter((s, i, a) => a.indexOf(s) === i), r = new Set(o.map((s) => s.toLowerCase()));
    for (const s of t)
      s === "" || r.has(s.toLowerCase()) || (r.add(s.toLowerCase()), o.push(s));
    return o;
  };
  var ka = (e, t, n) => {
    const o = ar(e, t);
    if (o !== void 0) throw Pe(n, o);
  };
  var xa = (e, t, n, o = "tile") => {
    if (/[\u0000-\u001f\u007f]/.test(e)) throw Pe(t, "contains a control character");
    if (e.indexOf("#") >= 0) throw Pe(t, "must not contain a fragment (#)");
    let r;
    try {
      r = new URL(e.replace(/\{[^{}]*\}/g, "0"));
    } catch {
      throw Pe(t, "is not an absolute URL");
    }
    if (r.username !== "" || r.password !== "")
      throw new $("attribute-invalid", `URL template #${t + 1} must not contain user info`, { attribute: "url", index: t });
    for (const a of r.pathname.split("/")) {
      let c = a;
      try {
        c = decodeURIComponent(a);
      } catch {
      }
      if (mt(a) || mt(c)) throw pt(`URL template #${t + 1}`);
    }
    for (const a of kn(e))
      if (ze(a.raw) || ze(a.decoded) || ze(a.rawName) || ze(a.name))
        throw pt(`URL template #${t + 1}`);
    let s, i;
    try {
      s = He(e, n), i = De(s);
    } catch (a) {
      throw a instanceof $ && a.code === "unsupported-template" ? Pe(t, a.message) : a;
    }
    if (new URL(i.origin).hostname === Xt) throw Pe(t, `${Xt} is reserved`);
    return ka(o, i, t), s;
  };
  var Oa = (e, t) => {
    try {
      return e.matches(t) === true;
    } catch {
      return false;
    }
  };
  var Ia = (e, t) => {
    if (!t || t.length === 0) return { urls: e };
    const n = e.map((i) => t.find((a) => Oa(a, i))), o = n[0];
    if (n.some((i) => i !== o)) throw B("url", "must not mix URLs of different providers");
    if (!o) return { urls: e };
    const r = (i) => Pe(i, `cannot be resolved by the provider "${o.id}"`);
    return { urls: e.map((i, a) => {
      let c;
      try {
        c = o.resolve(i);
      } catch {
        throw r(a);
      }
      if (typeof c != "string" || c === "") throw r(a);
      return c;
    }), provider: o };
  };
  var Ra = (e, t) => {
    if (e === void 0) return t;
    if (typeof e != "string" || e === "") throw B("id", "must be a non-empty string");
    if (e.indexOf("\0") >= 0) throw B("id", "must not contain \\0");
    if (e.startsWith(xe)) throw B("id", `must not start with "${xe}"`);
    return e;
  };
  var Ea = (e, t) => {
    const n = (s) => s === "transparent" || s === "empty" || s === "not-found";
    if (e === void 0) return { extent: t, zoom: t };
    if (!Re(e)) throw B("outOfRange");
    const o = X(e, "extent"), r = X(e, "zoom");
    if (o !== void 0 && !n(o)) throw B("outOfRange.extent");
    if (r !== void 0 && !n(r)) throw B("outOfRange.zoom");
    return { extent: o ?? t, zoom: r ?? t };
  };
  var mo = (e, t) => {
    if (e !== void 0) {
      if (!ke(e) || e > ce) throw B(t, `must be an integer from 0 to ${ce}`);
      return e;
    }
  };
  var ne = (e, t, n) => Math.min(n, Math.max(t, e));
  var _a = (e, t, n) => {
    const o = mo(X(e, "minZoom"), "minZoom"), r = mo(X(e, "maxZoom"), "maxZoom"), s = X(e, "bounds"), i = X(e, "box");
    if (s !== void 0 && i !== void 0) throw B("bounds", 'cannot be given with "box"');
    if ((s !== void 0 || i !== void 0) && r === void 0)
      throw B("maxZoom", 'is required with "bounds" or "box"');
    if (o === void 0 && r === void 0) return;
    const a = o ?? 0, c = r ?? ce;
    if (a > c) throw B("minZoom", 'must not be greater than "maxZoom"');
    const d = { minZoom: a, maxZoom: c, sourceId: t }, l = Math.pow(2, c) - 1;
    if (s !== void 0) {
      if (!Array.isArray(s) || s.length !== 4 || s.some((N) => typeof N != "number" || !Number.isFinite(N)))
        throw B("bounds", "must be [west, south, east, north]");
      const [u, m, k, w] = s;
      if (u < -180 || k > 180 || m < -90 || w > 90 || u > k || m > w) throw B("bounds", "is out of range");
      const b = an({
        minLng: u,
        maxLng: k,
        minLat: ne(m, -Se, Se),
        maxLat: ne(w, -Se, Se)
      }, c), I = ne(b.minY, 0, l), M = ne(b.maxY, 0, l);
      d.box = n === "tms" ? { minX: ne(b.minX, 0, l), maxX: ne(b.maxX, 0, l), minY: l - M, maxY: l - I } : { minX: ne(b.minX, 0, l), maxX: ne(b.maxX, 0, l), minY: I, maxY: M };
    } else if (i !== void 0) {
      if (!Re(i)) throw B("box");
      const [u, m, k, w] = ["minX", "maxX", "minY", "maxY"].map((I) => X(i, I));
      if (![u, m, k, w].every((I) => ke(I) && I <= l)) throw B("box", "is out of range");
      const b = { minX: u, maxX: m, minY: k, maxY: w };
      if (b.minX > b.maxX || b.minY > b.maxY) throw B("box", "min must not be greater than max");
      d.box = b;
    }
    return d;
  };
  var rt = /^(pk|sk|tk)\./i;
  function Qt(e, t) {
    const n = new Set(t.map((r) => r.toLowerCase())), o = [];
    for (const r of e)
      for (const s of kn(r)) {
        if (n.has(s.name.toLowerCase()) || dt(s.name) || dt(s.rawName) || rt.test(s.name) || rt.test(s.rawName) || !rt.test(s.raw) && !rt.test(s.decoded)) continue;
        const i = `credential-undeclared: ${s.name}`;
        o.indexOf(i) < 0 && o.push(i);
      }
    return o;
  }
  function It(e, t, n, o, r) {
    if (o.kind === "asset" && e !== "data" || (o.kind === "raster" || o.kind === "vector") && e !== "tile")
      throw new $("internal", `Source kind "${o.kind}" cannot hold a ${e} resource`);
    const { urls: s, provider: i } = Ia(t, r), a = Aa(X(n, "credentials")), c = (i?.credentialParams ?? []).filter((S) => typeof S == "string" && S !== ""), d = Sa(X(n, "credentialParams"), Object.keys(a?.query ?? {}), c), u = s.map((S, x) => xa(S, x, d, e)).filter((S, x, _2) => _2.indexOf(S) === x), m = o.internalId ?? Ra(o.id, u[0]), k = new Set(d.map((S) => S.toLowerCase())), w = new Set(Object.keys(a?.query ?? {}).map((S) => S.toLowerCase())), b = /* @__PURE__ */ new Map();
    for (const S of s) {
      const x = /* @__PURE__ */ new Map();
      for (const _2 of kn(S)) {
        const U = _2.name.toLowerCase();
        !k.has(U) || /\{[^{}]*\}/.test(_2.decoded) || x.has(U) || x.set(U, [_2.name, _2.decoded]);
      }
      for (const [_2, U] of x) {
        const K = b.get(_2);
        if (!K) b.set(_2, U);
        else if (K[1] !== U[1] && !w.has(_2)) throw wa(K[0]);
      }
    }
    for (const [S, x] of Object.entries(a?.query ?? {})) b.set(S.toLowerCase(), [S, x]);
    let I;
    if ((a || b.size > 0) && (I = { ...a ?? {} }, delete I.query, b.size > 0 && (I.query = Object.fromEntries([...b.values()]))), i?.validateCredentials)
      try {
        i.validateCredentials(I ? { ...I } : {});
      } catch {
        throw new $("credential-rejected", `Credentials are rejected by the provider "${i.id}"`, { where: "credentials" });
      }
    const M = X(n, "cacheTtl");
    if (M !== void 0 && !uo(M)) throw B("cacheTtl", "must be a non-negative number");
    const N = X(n, "cacheRetention");
    if (N !== void 0 && !uo(N)) throw B("cacheRetention", "must be a non-negative number");
    const f = X(n, "cacheMaxBytes");
    if (f !== void 0 && !ke(f)) throw B("cacheMaxBytes", "must be a non-negative integer");
    const h = X(n, "cachePrivate");
    if (h !== void 0 && typeof h != "boolean") throw B("cachePrivate", "must be a boolean");
    const v = e === "tile", A = o.encoding ?? (o.kind === "raster" || o.kind === "vector" ? o.kind : void 0), O = v ? X(n, "scheme") : void 0;
    if (O !== void 0 && O !== "xyz" && O !== "tms") throw B("scheme");
    const R = v ? X(n, "tileSize") : void 0;
    if (R !== void 0 && !(ke(R) && R > 0)) throw B("tileSize", "must be a positive integer");
    const L = {
      cacheTtl: M ?? rn,
      store: h === true,
      outOfRange: v ? Ea(X(n, "outOfRange"), A === "vector" ? "empty" : "transparent") : { extent: "not-found", zoom: "not-found" },
      credentialParams: d
    };
    N !== void 0 && (L.cacheRetention = N);
    const g = s.map((S) => lr(S, d)), p = {
      kind: o.kind,
      type: e,
      id: m,
      url: o.single ? g[0] : g,
      templates: u,
      policy: L
    };
    if (v) {
      p.scheme = O ?? "xyz", R !== void 0 && (p.tileSize = R);
      const S = _a(n, m, p.scheme);
      S && (p.extent = S), o.kind === "child" && A !== void 0 && (p.encoding = A);
    }
    o.logicalName !== void 0 && (p.logicalName = o.logicalName), f !== void 0 && (p.cacheMaxBytes = f), i && (p.provider = i.id);
    const y = Qt(s, d);
    return { spec: p, ...I ? { credentials: I } : {}, ...y.length > 0 ? { warnings: y } : {} };
  }
  var ja = (e) => e.spec.kind === "style";
  var Ta = (e) => {
    if (e !== void 0) {
      if (!Array.isArray(e) || e.some((t) => typeof t != "string" || t === "")) throw B("fonts", "must be an array of non-empty strings");
      return e.slice();
    }
  };
  var Ma = (e, t) => {
    const n = X(e, "url");
    if (typeof n != "string" || n === "") throw B("url", 'must be one URL for kind "style"');
    const o = Ta(X(e, "fonts")), r = It("style", [n], e, { kind: "child", id: X(e, "id"), single: true }, t), s = {
      kind: "style",
      id: r.spec.id,
      url: r.spec.url,
      templates: [r.spec.templates[0]],
      policy: r.spec.policy,
      children: []
    };
    return o && (s.fonts = o), r.spec.cacheMaxBytes !== void 0 && (s.cacheMaxBytes = r.spec.cacheMaxBytes), r.spec.provider !== void 0 && (s.provider = r.spec.provider), { spec: s, ...r.credentials ? { credentials: r.credentials } : {}, ...r.warnings ? { warnings: r.warnings } : {} };
  };
  function $a(e, t) {
    if (!Re(e)) throw B("spec", "must be an object");
    const n = ba(X(e, "kind"));
    if (n === "style") return Ma(e, t);
    const o = X(e, "url"), r = va(o);
    return It(
      n === "asset" ? "data" : "tile",
      r,
      e,
      { kind: n, id: X(e, "id"), single: typeof o == "string" },
      t
    );
  }
  function Br(e, t, n, o) {
    if (t.length === 0) return false;
    try {
      return It(
        e,
        t.slice(),
        { credentialParams: n.slice() },
        { kind: "child", internalId: "\0", single: t.length === 1 },
        o
      ), true;
    } catch {
      return false;
    }
  }
  function Pa(e) {
    let t;
    try {
      t = new URL(e.replace(/\{[^{}]*\}/g, "0")).pathname;
    } catch {
      return true;
    }
    return t.split("/").some((n) => {
      let o = n;
      try {
        o = decodeURIComponent(n);
      } catch {
      }
      return mt(n) || mt(o);
    });
  }
  var La = () => new $("cannot-fetch-all", 'The source has no tile range (box) to fetch with "all"', { attribute: "range" });
  var ho = (e, t) => {
    const n = Math.pow(2, t) - 1;
    return { minX: e.minX, maxX: e.maxX, minY: n - e.maxY, maxY: n - e.minY };
  };
  function Dr(e) {
    if (e === "all") return "all";
    if (!Re(e)) throw B("range", "must be { bounds, minZoom, maxZoom }, { box, minZoom, maxZoom } or 'all'");
    const t = X(e, "minZoom"), n = X(e, "maxZoom");
    if (!ke(t) || t > ce) throw B("minZoom", `must be an integer from 0 to ${ce}`);
    if (!ke(n) || n > ce) throw B("maxZoom", `must be an integer from 0 to ${ce}`);
    if (t > n) throw B("minZoom", 'must not be greater than "maxZoom"');
    const o = X(e, "bounds"), r = X(e, "box");
    if (o === void 0 == (r === void 0)) throw B("range", 'needs exactly one of "bounds" and "box"');
    if (o !== void 0) {
      if (!Array.isArray(o) || o.length !== 4 || o.some((b) => typeof b != "number" || !Number.isFinite(b)))
        throw B("bounds", "must be [west, south, east, north]");
      const [u, m, k, w] = o;
      if (u < -180 || u > 180 || k < -180 || k > 180 || m < -90 || w > 90 || m > w) throw B("bounds", "is out of range");
      return { bounds: [u, m, k, w], minZoom: t, maxZoom: n };
    }
    if (!Re(r)) throw B("box");
    const [s, i, a, c] = ["minX", "maxX", "minY", "maxY"].map((u) => X(r, u)), d = Math.pow(2, n) - 1;
    if (![s, i, a, c].every((u) => ke(u) && u <= d)) throw B("box", "is out of range");
    const l = { minX: s, maxX: i, minY: a, maxY: c };
    if (l.minX > l.maxX || l.minY > l.maxY) throw B("box", "min must not be greater than max");
    return { box: l, minZoom: t, maxZoom: n };
  }
  var $t = (e, t, n, o, r) => {
    const s = Math.pow(2, r) - 1, i = an({
      minLng: e,
      maxLng: n,
      minLat: ne(t, -Se, Se),
      maxLat: ne(o, -Se, Se)
    }, r);
    return { minX: ne(i.minX, 0, s), maxX: ne(i.maxX, 0, s), minY: ne(i.minY, 0, s), maxY: ne(i.maxY, 0, s) };
  };
  var Ba = (e, t, n) => {
    const o = Math.pow(2, n - t);
    return { minX: e.minX * o, maxX: (e.maxX + 1) * o - 1, minY: e.minY * o, maxY: (e.maxY + 1) * o - 1 };
  };
  function Da(e, t) {
    const n = Dr(e);
    if (n === "all") {
      const i = t.all ?? [{ extent: t.extent, scheme: t.scheme }];
      if (i.length === 0 || i.some((l) => !l.extent?.box)) throw La();
      const a = Math.max(...i.map((l) => l.extent.maxZoom)), c = Math.min(...i.map((l) => l.extent.minZoom));
      return { kind: "boxes", boxes: i.map((l) => {
        const u = l.extent, m = l.scheme === "tms" ? ho(u.box, u.maxZoom) : { ...u.box };
        return u.maxZoom === a ? m : Ba(m, u.maxZoom, a);
      }), minZoom: c, maxZoom: a };
    }
    const { minZoom: o, maxZoom: r } = n;
    if ("bounds" in n) {
      const [i, a, c, d] = n.bounds;
      return { kind: "boxes", boxes: i <= c ? [$t(i, a, c, d, r)] : [$t(i, a, 180, d, r), $t(-180, a, c, d, r)], minZoom: o, maxZoom: r };
    }
    return { kind: "boxes", boxes: [t.scheme === "tms" ? ho(n.box, r) : { ...n.box }], minZoom: o, maxZoom: r };
  }
  var Ca = /^\d+-\d+$/;
  function Ua(e) {
    if (e == null && (e = {}), !Re(e)) throw B("options", "must be an object");
    const t = X(e, "pin"), n = X(e, "concurrency"), o = X(e, "ratio"), r = X(e, "glyphRanges"), s = X(e, "fonts");
    if (t !== void 0 && typeof t != "boolean") throw B("pin", "must be a boolean");
    if (n !== void 0 && !(ke(n) && n >= 1 && n <= 20))
      throw B("concurrency", "must be an integer from 1 to 20");
    if (o !== void 0 && o !== "" && o !== "@2x") throw B("ratio", 'must be "" or "@2x"');
    if (r !== void 0 && r !== "common" && r !== "all" && !(Array.isArray(r) && r.every((i) => typeof i == "string" && Ca.test(i))))
      throw B("glyphRanges", 'must be "common", "all" or an array of "<start>-<end>"');
    if (s !== void 0 && !(Array.isArray(s) && s.every((i) => typeof i == "string" && i !== "")))
      throw B("fonts", "must be an array of non-empty strings");
    return {
      pin: t !== false,
      concurrency: n ?? 5,
      ratio: o ?? "",
      glyphRanges: Array.isArray(r) ? r.slice() : r ?? "common",
      fonts: Array.isArray(s) ? s.slice() : []
    };
  }
  var za = ["hit", "miss", "refresh", "stale"];
  var Na = (e) => `fetch-failed: ${e}`;
  var Xa = (e) => `same-origin-skipped: ${e}`;
  var st = (e) => `unsupported-source: ${e}`;
  var it = (e) => typeof e == "object" && e !== null && !Array.isArray(e);
  var en = (e) => !!e && (Object.keys(e.query ?? {}).length > 0 || Object.keys(e.headers ?? {}).length > 0);
  var xn = (e) => e.filter((t, n) => e.indexOf(t) === n);
  var Pt = (e) => {
    try {
      const t = new URL(e.replace(/\{[^{}]*\}/g, "0")).origin;
      return t === "null" ? void 0 : t;
    } catch {
      return;
    }
  };
  var Fa = (e) => {
    try {
      const t = new URL(e.replace(/\{[^{}]*\}/g, "0"));
      return t.username !== "" || t.password !== "";
    } catch {
      return true;
    }
  };
  var Za = (e, t) => {
    if (Pa(e) || Fa(e)) return t;
    const n = e.search(/[?#]/);
    return n < 0 ? e : e.slice(0, n);
  };
  var Ya = (e, t) => {
    if (!e) return t;
    const n = { ...e.query ?? {} };
    for (const [s, i] of Object.entries(t?.query ?? {})) {
      for (const a of Object.keys(n)) a.toLowerCase() === s.toLowerCase() && delete n[a];
      n[s] = i;
    }
    const o = { ...e.headers ?? {}, ...t?.headers ?? {} }, r = {};
    return Object.keys(n).length > 0 && (r.query = n), Object.keys(o).length > 0 && (r.headers = o), r;
  };
  var Wa = (e, t) => {
    const n = jr("style"), o = {
      kind: "child",
      type: "style",
      id: _r(e.id, "style", n),
      url: e.url,
      templates: e.templates.slice(),
      policy: e.policy,
      logicalName: n
    };
    return e.provider !== void 0 && (o.provider = e.provider), t ? { spec: o, credentials: t } : { spec: o };
  };
  var yo = (e) => {
    const t = {};
    if (!e) return t;
    const n = (o) => typeof o == "number" && Number.isFinite(o);
    return (e.scheme === "xyz" || e.scheme === "tms") && (t.scheme = e.scheme), Array.isArray(e.bounds) && e.bounds.length === 4 && e.bounds.every(n) && (t.bounds = e.bounds.slice()), n(e.minzoom) && (t.minzoom = e.minzoom), n(e.maxzoom) && (t.maxzoom = e.maxzoom), t;
  };
  var go = (e) => Math.min(ce, Math.max(0, e));
  var wo = (e) => {
    const t = {};
    e.scheme && (t.scheme = e.scheme);
    const n = e.minzoom === void 0 ? void 0 : go(Math.floor(e.minzoom));
    let o = e.maxzoom === void 0 ? void 0 : go(Math.ceil(e.maxzoom));
    const r = e.bounds, s = !!r && r[0] >= -180 && r[2] <= 180 && r[1] >= -90 && r[3] <= 90 && r[0] <= r[2] && r[1] <= r[3];
    return s && o === void 0 && (o = ce), n !== void 0 && o !== void 0 && n > o || (n !== void 0 && (t.minZoom = n), o !== void 0 && (t.maxZoom = o), s && (t.bounds = r.slice())), t;
  };
  var Ga = Object.freeze({
    vector: "vector",
    raster: "raster",
    "raster-dem": "raster"
  });
  var Ka = (e, t) => {
    for (const n of e)
      for (const o of n.templates) {
        let r = null;
        try {
          r = yn(De(o), t);
        } catch {
          r = null;
        }
        if (r) return { resource: n, m: r };
      }
  };
  var qa = async (e, t) => {
    let n = t.templates[0];
    for (let r = 2; await e.getResource(n); r++) n = `${t.templates[0]}#weiwudi-unsaved-${r}`;
    const o = {
      id: n,
      type: t.type,
      templates: t.templates.slice(),
      sourceIds: [],
      policy: t.policy,
      count: 0,
      bytes: 0,
      pinnedBytes: 0
    };
    return t.provider !== void 0 && (o.provider = t.provider), o;
  };
  var Lt = async (e, t, n, o, r, s) => {
    const i = Array.isArray(o.url) ? o.url[0] : o.url, a = new URL(i), c = Ka(n, a), d = c?.resource ?? await qa(t, o), l = c?.m ?? { queryParams: [] }, u = await vn(e, d, new Request(a.href), a, l, en(r) ? r : void 0, s), m = u.headers.get("x-weiwudi-status") ?? "";
    if (!(za.indexOf(m) < 0))
      return { text: await u.text(), resourceId: d.id };
  };
  async function bo(e, t, n) {
    const o = await e.store(), r = { ...t.spec, children: [] }, s = r.id, i = await o.getSource(s);
    if (i && i.kind !== "style")
      throw new $(
        "attribute-invalid",
        'Attribute "kind" must not change for the same id (remove() it first)',
        { attribute: "kind" }
      );
    const a = i ? le(i)?.children ?? [] : [], c = en(t.credentials) ? t.credentials : void 0, d = n.mode === "update", l = i?.order ?? await sn(o), u = i?.createdAt ?? Date.now(), m = e.providers(), k = r.provider === void 0 ? void 0 : m.find((y) => y.id === r.provider), w = { ...d ? { revalidate: true } : {} }, b = [], I = [], M = [], N = async (y, S) => {
      const x = { id: s, kind: "style", spec: { ...r, children: y }, order: l, warnings: S, createdAt: u };
      return await o.putSource(x), x;
    }, f = () => [
      ...a.filter((y) => !b.some((S) => S.id === y.id)),
      ...b
    ], h = Wa(r, c), v = r.url, A = { ...w, parent: { url: v, policy: r.policy, ...r.provider !== void 0 ? { provider: r.provider } : {} } }, O = async (y, S) => {
      const x = await o.getSource(y.spec.id);
      if (x && (x.kind !== "child" || x.parentId !== s))
        throw new $("internal", "A record that is not a child of this style holds the id of a style resource");
      I.indexOf(y.spec.id) < 0 && I.push(y.spec.id);
      const _2 = await Sn(
        o,
        y,
        x,
        { throwOnConflict: false, resetCors: d, order: l, parentId: s }
      ), U = { id: y.spec.id, logicalName: y.spec.logicalName ?? "", type: y.spec.type };
      S !== void 0 && (U.from = S);
      const K = b.findIndex((W) => W.id === U.id);
      return K >= 0 ? b[K] = U : b.push(U), await N(f(), i?.warnings.slice() ?? []), _2;
    }, R = async (y) => {
      const S = n.swOrigin, x = Pt(v), _2 = r.policy.credentialParams, U = (T, D) => Br(T, D, _2, m), K = hr({
        styleOrigin: x ?? "",
        ...k ? { providerMatches: (T) => k.matches(T) } : {}
      }), W = {
        cacheTtl: r.policy.cacheTtl,
        cachePrivate: r.policy.store,
        credentialParams: _2,
        ...r.policy.cacheRetention !== void 0 ? { cacheRetention: r.policy.cacheRetention } : {}
      }, G = it(y) && it(y.sources) ? y.sources : {}, q = zi(y, v, U), E = (T, D) => S !== void 0 && D ? T.find((V) => Pt(V) === S) : void 0, j = S !== void 0 && x !== S, P = async (T, D, V, H, J, pe, me, $e, jt) => {
        const tt = E(H, me);
        if (tt !== void 0) {
          M.push(Xa(Za(tt, pe)));
          return;
        }
        const nt = jr(D, V);
        let he;
        try {
          he = It(T, H, { ...W, ...J }, {
            kind: "child",
            internalId: _r(s, T, nt),
            logicalName: nt,
            single: H.length === 1,
            ...$e ? { encoding: $e } : {}
          }, m);
        } catch {
          M.push(st(pe));
          return;
        }
        const as = c && H.every((Bn) => K(Bn)) ? c : void 0, Ln = Ya(as, he.credentials);
        return he = en(Ln) ? { spec: he.spec, credentials: Ln } : { spec: he.spec }, { r: await O(he, jt), n: he };
      }, z = [];
      for (const T of q.tilejson) {
        const D = it(G[T.name]) ? G[T.name] : void 0, V = D && typeof D.type == "string" ? Ga[D.type] : void 0, H = `sources.${T.name}`, J = await P("tilejson", "source", T.name, [T.url], {}, H, j);
        if (!J) continue;
        const pe = J.n.spec.id, me = await Lt(
          e,
          o,
          J.r.resources,
          J.n.spec,
          J.n.credentials,
          { ...w, credentialSourceId: pe }
        ), $e = me ? Ni(me.text, J.n.spec.url) : void 0;
        if (!me || !$e) {
          const nt = J.r.resources.find((he) => he.type === "tilejson")?.id ?? J.n.spec.templates[0];
          M.push(Na(nt)), z.push(pe);
          continue;
        }
        if (!V || $e.urls.length === 0) continue;
        const jt = j || S !== void 0 && Pt(T.url) !== S, tt = wo({ ...yo($e), ...yo(D) });
        await P("tile", "tilejson-tiles", T.name, $e.urls, tt, H, jt, V, pe);
      }
      for (const T of q.tiles)
        await P("tile", "source", T.name, T.urls, wo(T), `sources.${T.name}`, j, T.encoding);
      q.glyphs !== void 0 && await P("glyph", "glyphs", void 0, [q.glyphs], {}, "glyphs", j);
      for (let T = 0; T < q.sprites.length; T++) {
        const D = q.spriteIds[T];
        await P(
          "sprite",
          "sprite",
          D,
          [hn(q.sprites[T])],
          {},
          D === void 0 ? "sprite" : `sprite.${D}`,
          j
        );
      }
      for (const T of q.data)
        await P("data", "data", T.name, [T.url], {}, `sources.${T.name}`, j);
      for (const T of q.skipped) M.push(st(`sources.${T.name}`));
      for (const T of q.dropped)
        M.push(st(T.slot === "glyphs" ? "glyphs" : T.spriteId === void 0 ? "sprite" : `sprite.${T.spriteId}`));
      it(y) && Array.isArray(y.imports) && y.imports.length > 0 && M.push(st("imports"));
      for (const T of a)
        T.from !== void 0 && z.indexOf(T.from) >= 0 && !b.some((D) => D.id === T.id) && b.push(T);
      for (const T of await On(o, s, a.map((D) => D.id)))
        if (!b.some((D) => D.id === T))
          try {
            await Ot(o, T);
          } catch (D) {
            if (!(D instanceof $ && D.code === "source-not-found")) throw D;
          }
      const C = [];
      for (const T of b) {
        const D = await o.getSource(T.id);
        D && C.push(...D.warnings);
      }
      return N(b.slice(), xn([...C, ...M]));
    };
    if (!i)
      try {
        await N([], []), c && await o.putCredentials(s, c);
        const y = await O(h), S = await Lt(e, o, y.resources, h.spec, c, A);
        if (!S) throw vo();
        const x = ft(S.text);
        return await R(x);
      } catch (y) {
        throw await Ur(o, s, I), await Cr(o, s), y;
      }
    const L = await o.resourcesBySource(h.spec.id), g = await Lt(e, o, L, h.spec, c, A);
    if (!g) throw vo();
    const p = ft(g.text);
    return await N(a.slice(), i.warnings.slice()), await o.putCredentials(s, c ?? {}), await O(h), R(p);
  }
  var Cr = async (e, t) => {
    try {
      await Ot(e, t);
    } catch {
      try {
        await e.deleteSource(t);
      } catch {
      }
    }
  };
  async function Ur(e, t, n, o = {}) {
    let r = xn(n);
    try {
      r = await On(e, t, n);
    } catch (s) {
      if (o.strict) throw s;
    }
    for (const s of r) {
      if (!o.strict) {
        await Cr(e, s);
        continue;
      }
      try {
        await Ot(e, s);
      } catch (i) {
        if (!(i instanceof $ && i.code === "source-not-found")) throw i;
      }
    }
  }
  var vo = () => new $("invalid-style", "The style is not readable", { type: "style" });
  async function On(e, t, n) {
    const o = (await e.listSources()).filter((r) => r.parentId === t).map((r) => r.id);
    return xn([...n, ...o]);
  }
  var tn = (e) => {
    const t = le(e);
    return t ? t.children.map((n) => n.id) : [e.id];
  };
  var ht = 200;
  var Bt = 3;
  var Ha = 5;
  var In = () => ({ network: 0, upstream: 0, quota: 0, storage: 0 });
  var Ja = (e) => e === "network" || e === "upstream" || e === "quota" || e === "storage";
  var Ve = (e, t, n) => {
    const o = Math.pow(2, n) - 1, r = { minX: 0, maxX: o, minY: 0, maxY: o }, s = e.extents && e.extents.length > 0 ? e.extents.filter((a) => n >= a.minZoom && n <= a.maxZoom).map((a) => a.box ? Ie(a.box, a.maxZoom, n) : r) : [r], i = [];
    for (const a of t.boxes) {
      const c = Ie(a, t.maxZoom, n), d = e.scheme === "tms" ? { minX: c.minX, maxX: c.maxX, minY: o - c.maxY, maxY: o - c.minY } : c;
      for (const l of s) {
        const u = {
          minX: Math.max(d.minX, l.minX, 0),
          maxX: Math.min(d.maxX, l.maxX, o),
          minY: Math.max(d.minY, l.minY, 0),
          maxY: Math.min(d.maxY, l.maxY, o)
        };
        u.minX <= u.maxX && u.minY <= u.maxY && i.push(u);
      }
    }
    return i;
  };
  var Rn = (e) => {
    const t = [...new Set(e.flatMap((o) => [o.minX, o.maxX + 1]))].sort((o, r) => o - r), n = [];
    for (let o = 0; o + 1 < t.length; o++) {
      const r = t[o], s = t[o + 1] - 1, i = e.filter((c) => c.minX <= r && r <= c.maxX).map((c) => [c.minY, c.maxY]).sort((c, d) => c[0] - d[0]), a = [];
      for (const [c, d] of i) {
        const l = a[a.length - 1];
        l && c <= l[1] + 1 ? l[1] = Math.max(l[1], d) : a.push([c, d]);
      }
      a.length !== 0 && n.push({ minX: r, maxX: s, ys: a, perColumn: a.reduce((c, [d, l]) => c + l - d + 1, 0) });
    }
    return n;
  };
  var Va = (e) => e.reduce((t, n) => t + (n.maxX - n.minX + 1) * n.perColumn, 0);
  function* Qa(e, t) {
    for (let n = t.minZoom; n <= t.maxZoom; n++)
      for (const o of Rn(Ve(e, t, n)))
        for (let r = o.minX; r <= o.maxX; r++)
          for (const [s, i] of o.ys) for (let a = s; a <= i; a++) yield [n, r, a];
  }
  var zr = (e, t) => {
    let n = 0;
    for (let o = t.minZoom; o <= t.maxZoom; o++) n += Va(Rn(Ve(e, t, o)));
    return n;
  };
  function ec(e, t, n) {
    if (!(n >= 0) || !Number.isInteger(n)) return;
    let o = n;
    for (let r = t.minZoom; r <= t.maxZoom; r++)
      for (const s of Rn(Ve(e, t, r))) {
        const i = (s.maxX - s.minX + 1) * s.perColumn;
        if (o >= i) {
          o -= i;
          continue;
        }
        const a = s.minX + Math.floor(o / s.perColumn);
        let c = o % s.perColumn;
        for (const [d, l] of s.ys) {
          if (c <= l - d) return [r, a, d + c];
          c -= l - d + 1;
        }
      }
  }
  var tc = (e) => new $("source-not-found", `Source "${e}" not found`, { sourceId: e });
  var yt = () => new $("attribute-invalid", 'Attribute "regionId" does not name a region of the source', { attribute: "regionId" });
  var Nr = async (e, t) => {
    const n = [];
    for (const r of t) {
      const s = await e.getSource(r);
      s && n.push(...$o(s));
    }
    const o = [];
    for (const r of t)
      for (const s of [...await e.resourcesBySource(r), ...await e.resourcesByRangeOnlySource(r)]) {
        if (o.some((c) => c.id === s.id)) continue;
        const i = s.templates.filter((c) => n.indexOf(c) >= 0), a = { ...s, templates: i.length > 0 ? i : s.templates.slice() };
        s.type === "tile" && s.extents && (a.extents = s.extents.filter((c) => t.indexOf(c.sourceId) >= 0)), o.push(a);
      }
    return o;
  };
  var nc = async (e, t, n) => {
    if (!le(t)) {
      const r = Oe(t);
      return { extent: r?.extent, scheme: r?.scheme };
    }
    const o = [];
    for (const r of n) {
      const s = await e.getSource(r), i = s ? Oe(s) : void 0;
      i?.type === "tile" && o.push({ extent: i.extent, scheme: i.scheme });
    }
    return { scheme: "xyz", all: o };
  };
  var oc = (e) => e.kind === "asset";
  var rc = () => ({ kind: "boxes", boxes: [], minZoom: 0, maxZoom: 0 });
  var Rt = async (e, t, n, o, r) => {
    const s = Dr(o), i = await Nr(e, n);
    if (oc(t)) {
      if (s !== "all")
        throw new $("attribute-invalid", 'Attribute "range" must be "all" for an asset source', { attribute: "range" });
      return { range: s, normalized: rc(), resources: i.filter((d) => d.type !== "tile"), total: 0 };
    }
    const a = r ?? Da(s, await nc(e, t, n)), c = i.filter((d) => d.type === "tile");
    return { range: s, normalized: a, resources: i, total: c.reduce((d, l) => d + zr(l, a), 0) };
  };
  async function sc(e, t, n, o) {
    return { tiles: (await Rt(e, t, o, n)).total };
  }
  var ic = () => {
    try {
      if (typeof crypto < "u" && typeof crypto.randomUUID == "function") return crypto.randomUUID();
    } catch {
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  };
  var Be = (e, t) => {
    const n = t.status === "running" && e.job?.regionId !== t.id ? "partial" : t.status, o = {
      id: t.id,
      sourceId: t.sourceId,
      range: t.range,
      status: n,
      pinned: t.pinned,
      total: t.total,
      error: t.error,
      errors: { ...In(), ...t.errors },
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    };
    return t.code !== void 0 && (o.code = t.code), o;
  };
  async function ac(e, t, n) {
    return (await t.listRegions(n)).map((o) => Be(e, o));
  }
  var En = (e) => new $(
    "fetch-busy",
    `Another fetching process is running: "${e.label}" (${e.count} / ${e.total})`,
    { sourceId: e.sourceId, ...e.regionId !== void 0 ? { regionId: e.regionId } : {} }
  );
  var Xr = (e, t, n) => {
    if (e.job) throw En(e.job);
    const o = {
      sourceId: t.id,
      label: t.id,
      total: n.total,
      count: 0,
      error: 0,
      failures: In(),
      cancel: false,
      regionId: n.id
    };
    return e.job = o, o;
  };
  async function cc(e, t, n, o, r, s, i) {
    const a = Ua(i), c = { ...await Rt(t, n, o, s), options: a }, d = Date.now(), l = {
      id: ic(),
      sourceId: n.id,
      range: c.range,
      status: "running",
      pinned: a.pin,
      total: c.total,
      error: 0,
      errors: In(),
      createdAt: d,
      updatedAt: d,
      normalized: c.normalized,
      options: a
    }, u = Xr(e, n, l);
    try {
      await t.putRegion(l);
    } catch (m) {
      throw e.job === u && (e.job = void 0), m;
    }
    return { info: Be(e, l), job: Wr(e, t, n, l, c, u, r) };
  }
  async function Fr(e, t, n, o) {
    const r = await t.getRegion(o);
    if (!r || r.sourceId !== n) throw yt();
    if (e.job) {
      if (e.job.regionId === o) return Be(e, r);
      throw En(e.job);
    }
    return r.status === "running" ? void 0 : Be(e, r);
  }
  async function lc(e, t, n, o, r, s) {
    const i = await Fr(e, t, n.id, s);
    if (i) return { info: i };
    const a = await t.getRegion(s);
    if (!a || a.sourceId !== n.id) throw yt();
    const c = { ...await Rt(t, n, o, a.range, a.normalized), options: a.options }, d = await t.getRegion(s);
    if (!d || d.sourceId !== n.id) throw yt();
    if (d.status !== "running") return { info: Be(e, d) };
    if (e.job?.regionId === s) return { info: Be(e, d) };
    const l = Xr(e, n, d);
    return { info: Be(e, d), job: Wr(e, t, n, d, c, l, r) };
  }
  function dc(e, t) {
    const n = e.job;
    if (!n || n.sourceId !== t)
      throw new $("no-fetch-process", `There are no fetching process of "${t}"`, { sourceId: t });
    return n.cancel = true, { regionId: n.regionId ?? null };
  }
  async function uc(e, t) {
    const n = /* @__PURE__ */ new Set();
    for (const o of [...t.sourceIds, ...t.rangeOnlySourceIds ?? []]) {
      const r = await e.getSource(o);
      if (!r) continue;
      const s = bt(r) ? r.parentId : r.id;
      s !== void 0 && n.add(s);
    }
    return [...n];
  }
  async function fc(e, t, n) {
    const o = [];
    for (const r of await uc(e, t))
      o.push(...(await e.listRegions(r)).filter((s) => s.id !== n && s.pinned));
    return o;
  }
  function nn(e, t) {
    if (e.job?.sourceId === t) throw En(e.job);
  }
  var Ao = (e, t, n) => t !== void 0 && n !== void 0 && e.some((o) => t >= o.minX && t <= o.maxX && n >= o.minY && n <= o.maxY);
  async function* Zr(e, t, n, o = []) {
    let r = [];
    for (let s = n.minZoom; s <= n.maxZoom; s++) {
      const i = Ve(t, n, s);
      if (i.length === 0) continue;
      const a = o.filter((c) => s >= c.minZoom && s <= c.maxZoom).flatMap((c) => Ve(t, c, s));
      for (const c of await e.entriesAtZoom(t.id, s))
        !Ao(i, c.x, c.y) || Ao(a, c.x, c.y) || (r.push(c.key), r.length === ht && (yield r, r = []));
    }
    r.length > 0 && (yield r);
  }
  var Yr = async (e, t, n, o) => {
    for (const r of await Nr(e, n)) {
      const s = await fc(e, r, t.id), i = async (a) => {
        o.keep || !xt(r, n) ? await e.setPinned(a, 0) : await e.deleteEntries(a);
      };
      if (r.type === "tile")
        for await (const a of Zr(e, r, t.normalized, s.map((c) => c.normalized))) await i(a);
      else if (s.length === 0) {
        let a;
        do {
          const c = await e.entriesOf(r.id, ht, a);
          c.metas.length > 0 && await i(c.metas.map((d) => d.key)), a = c.next;
        } while (a !== void 0);
      }
    }
    await e.deleteRegion(t.id);
  };
  async function pc(e, t, n, o, r, s = {}) {
    const i = await t.getRegion(r);
    if (!i || i.sourceId !== n) throw yt();
    nn(e, n), await Yr(t, i, o, s);
  }
  async function So(e, t, n, o) {
    for (const r of await e.listRegions(t)) await Yr(e, r, n, o);
  }
  var mc = (e, t) => {
    for (let n = Math.max(e.minZoom, t.minZoom); n <= Math.min(e.maxZoom, t.maxZoom); n++)
      for (const o of e.boxes) for (const r of t.boxes) {
        const s = Ie(o, e.maxZoom, n), i = Ie(r, t.maxZoom, n);
        if (s.minX <= i.maxX && i.minX <= s.maxX && s.minY <= i.maxY && i.minY <= s.maxY) return true;
      }
    return false;
  };
  async function hc(e, t, n, o, r = {}) {
    const s = await Rt(e, t, n, o);
    for (const i of s.resources)
      if (!(i.type !== "tile" || !xt(i, n)))
        for await (const a of Zr(e, i, s.normalized))
          r.force ? await e.deleteEntries(a) : await e.deleteEntries(a, { unpinnedOnly: true });
    if (r.force)
      for (const i of await e.listRegions(t.id))
        await e.patchRegion(i.id, (a) => mc(s.normalized, a.normalized) ? { ...a, status: "partial", updatedAt: Date.now() } : void 0);
  }
  var yc = (e) => (t) => {
    (async () => {
      const n = await e.store(), o = [];
      for (const s of t.sourceIds) {
        const i = await n.getSource(s);
        if (!i) continue;
        const a = bt(i) ? i.parentId : i.id;
        a === void 0 || a.startsWith(xe) || o.indexOf(a) >= 0 || o.push(a);
      }
      if (o.length === 0) return;
      const r = await self.clients.matchAll({ type: "window" });
      for (const s of r)
        for (const i of o) s.postMessage({ type: "opaque", sourceId: i, resourceId: t.resourceId });
    })().catch(() => {
    });
  };
  var ko = (e) => e === "style" ? 0 : e === "tilejson" ? 1 : e === "data" ? 2 : e === "sprite" ? 3 : e === "tile" ? 4 : 5;
  var gc = () => [".json", ".png", "@2x.json", "@2x.png"];
  var wc = (e) => e === "common" ? ["0-255", "256-511", "8192-8447", "12288-12543", "65280-65535"] : e === "all" ? Array.from({ length: 256 }, (t, n) => `${n * 256}-${n * 256 + 255}`) : e.slice();
  function* xo(e, t, n) {
    const o = e.resources.filter((r) => t === "style" == (r.type === "style")).map((r, s) => ({ r, i: s })).sort((r, s) => ko(r.r.type) - ko(s.r.type) || r.i - s.i).map(({ r }) => r);
    for (const r of o)
      if (r.type === "tile")
        for (const s of Qa(r, e.normalized)) yield { resource: r, tile: s };
      else if (r.type === "sprite")
        for (const s of gc()) yield { resource: r, spriteSuffix: s };
      else if (r.type === "glyph")
        for (const s of n()) yield { resource: r, fontstack: s };
      else
        yield { resource: r };
  }
  var bc = (e) => !!e && (e.count > 0 || e.corsOk === true);
  var Dt = (e, t, n, o) => {
    const { resource: r, tile: s } = t, i = r.templates[Math.floor(Math.random() * r.templates.length)] ?? r.templates[0];
    if (i === void 0) return;
    let a = e.get(i);
    if (!a) {
      try {
        a = De(i);
      } catch {
        return;
      }
      e.set(i, a);
    }
    try {
      const c = new URL(Pi(i, {
        ...s ? { z: s[0], x: s[1], y: s[2] } : {},
        ratio: n,
        ...t.spriteSuffix !== void 0 ? { spriteSuffix: t.spriteSuffix } : {},
        ...t.fontstack !== void 0 ? { fontstack: t.fontstack } : {},
        ...o !== void 0 ? { range: o } : {}
      })), d = yn(a, c);
      return d ? { url: c, m: d, key: dr(r.id, r.type, d, c, r.policy.credentialParams) } : void 0;
    } catch {
      return;
    }
  };
  var Oo = async (e, t) => {
    for (const n of t) {
      const o = await e.getResource(n.id);
      if (o)
        for (const r of await vt(e, o)) {
          let s = 0;
          r.resourceIds === void 0 && (s = (await e.getTotals()).pinnedBytes);
          for (const i of r.resourceIds ?? []) s += (await e.getResource(i))?.pinnedBytes ?? 0;
          if (s >= r.maxBytes) return true;
        }
    }
    return false;
  };
  var Ce = (e, t) => new $(e, t);
  var Wr = async (e, t, n, o, r, s, i) => {
    const { options: a } = r, c = o.id, d = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Map();
    let u = 0, m = 0, k = false, w;
    const b = /* @__PURE__ */ new Map();
    let I = 0, M = 0;
    const N = /* @__PURE__ */ new Set();
    let f = [];
    const h = s.failures, v = /* @__PURE__ */ new Map(), A = [], O = (E) => {
      A.indexOf(E) < 0 && A.push(E);
    };
    for (const E of [...a.fonts, ...le(n)?.fonts ?? []]) O(E);
    const R = (E, j) => {
      s.error++, h[E]++, j !== void 0 && v.set(j, E);
    }, L = (E, j) => {
      const P = `${E.id}\0${j}`;
      let z = l.get(P);
      return z || (z = kr(e, E, j).catch(() => ({})), l.set(P, z)), z;
    }, g = async (E, j, P = {}) => {
      const z = await L(E.resource, j.url.origin), C = await vn(e, E.resource, new Request(j.url.href), j.url, j.m, z.credentials, {
        ...z.credentialSourceId !== void 0 ? { credentialSourceId: z.credentialSourceId } : {},
        ...P.collect ? { collect: P.collect } : {}
      }), T = C.headers.get("x-weiwudi-error"), D = C.status;
      let V;
      try {
        P.text ? V = await C.text() : await C.arrayBuffer();
      } catch {
      }
      return { error: Ja(T) ? T : void 0, status: D, ...V !== void 0 ? { text: V } : {} };
    }, p = (E) => {
      b.delete(E.resource.id), I = 0, M = 0;
    }, y = async (E, j, P, z) => {
      if (M = P === "quota" ? M + 1 : 0, P === "network") {
        if (await eo(e, j.url.href) === "opaque") {
          R("upstream", j.key), E.tile && !N.has(E.resource.id) && !bc(await t.getResource(E.resource.id)) && b.set(E.resource.id, (b.get(E.resource.id) ?? 0) + 1);
          return;
        }
        R("network", j.key);
        return;
      }
      if (R(P, j.key), P === "upstream" && (z === 401 || z === 403)) {
        const C = await t.getResource(E.resource.id);
        I = C && C.count === 0 ? I + 1 : 0;
      } else
        I = 0;
    }, S = async (E, j) => {
      const { error: P, status: z, text: C } = await g(E, j, { text: true });
      let T = false;
      if (C !== void 0)
        try {
          for (const D of Wi(ft(C))) O(D);
          T = true;
        } catch {
        }
      if (P) {
        T && (await t.hasEntries([j.key]))[0] && f.push(j.key), await y(E, j, P, z);
        return;
      }
      if (!T) {
        R("upstream", j.key);
        return;
      }
      f.push(j.key), p(E);
    }, x = async (E) => {
      const j = [];
      for (const H of wc(a.glyphRanges)) {
        const J = Dt(d, E, a.ratio, H);
        if (!J) {
          R("storage");
          return;
        }
        j.push(J);
      }
      if (j.length === 0) return;
      const P = j[0].key;
      let z, C;
      try {
        const H = await t.getEntry(P);
        z = !!H, C = Object.keys(H?.body.parts ?? {});
      } catch {
        R("storage", P);
        return;
      }
      const T = j.filter((H) => C.indexOf(H.m.range ?? "") < 0);
      let D, V = false;
      if (T.length > 0) {
        const H = ui(e, E.resource, P);
        let J;
        try {
          for (const pe of T) {
            if (s.cancel) break;
            const me = await g(E, pe, { collect: H });
            me.error ? D ??= { error: me.error, status: me.status, t: pe } : V = true;
          }
        } finally {
          J = await H.flush();
        }
        if (J) {
          M = J === "quota" ? M + 1 : 0, R(J, P), z && f.push(P);
          return;
        }
      }
      if ((z || V) && f.push(P), D) {
        await y(E, { url: D.t.url, key: P }, D.error, D.status);
        return;
      }
      p(E);
    }, _2 = async (E) => {
      if (E.resource.type === "glyph") {
        u++, await x(E);
        return;
      }
      const j = Dt(d, E, a.ratio);
      if (u++, E.tile && m++, j && E.resource.type === "style") {
        await S(E, j);
        return;
      }
      if (!j) {
        R("storage");
        return;
      }
      const [P] = await t.hasEntries([j.key]);
      if (P) {
        f.push(j.key);
        return;
      }
      const { error: z, status: C } = await g(E, j);
      if (!z) {
        f.push(j.key), p(E);
        return;
      }
      await y(E, j, z, C);
    }, U = async (E) => {
      const j = zr(E, r.normalized), P = /* @__PURE__ */ new Set();
      for (; P.size < Math.min(Ha, j); ) {
        let T = Math.min(j - 1, Math.floor(Math.random() * j));
        for (; P.has(T); ) T = (T + 1) % j;
        P.add(T);
      }
      let z = false, C = false;
      for (const T of P) {
        const D = ec(E, r.normalized, T), V = D ? Dt(d, { resource: E, tile: D }, a.ratio) : void 0;
        if (!V) continue;
        const { error: H } = await g({ resource: E }, V);
        if (H !== "network") {
          if (z = true, !H) {
            f.push(V.key);
            const J = v.get(V.key);
            J !== void 0 && (v.delete(V.key), s.error--, h[J]--);
          }
          continue;
        }
        await eo(e, V.url.href) === "opaque" && (C = true);
      }
      if (b.delete(E.id), z) {
        N.add(E.id);
        return;
      }
      if (C) {
        try {
          e.notify?.({ type: "opaque", resourceId: E.id, sourceIds: E.sourceIds.slice() });
        } catch {
        }
        throw Ce("opaque", "The upstream does not support CORS");
      }
      throw Ce("network", "The upstream is not reachable");
    }, K = async () => {
      const E = f;
      if (f = [], !!a.pin)
        for (let j = 0; j < E.length; j += ht) await t.setPinned(E.slice(j, j + ht), 1);
    }, W = (E) => r.total === 0 ? E ? 100 : 0 : Math.min(100, Math.floor(m * 100 / r.total));
    let G = "finished";
    try {
      if (a.pin && await Oo(t, r.resources)) throw Ce("quota", "The pinned entries reach cacheMaxBytes");
      const E = {
        batchSize: a.concurrency,
        isAlive: async () => !!await self.clients.get(i.id),
        isCanceled: async () => {
          if (s.cancel) return true;
          if (!await t.getSource(n.id)) throw tc(n.id);
          return await t.getRegion(c) ? false : (k = true, true);
        },
        run: _2,
        onBatch: async () => {
          if (s.count = m, !await t.getRegion(c)) {
            k = true, f = [];
            return;
          }
          try {
            for (const [j, P] of b) {
              if (P < Bt) continue;
              const z = r.resources.find((C) => C.id === j);
              z && await U(z);
            }
          } finally {
            await K();
          }
          if (I >= Bt) throw Ce("upstream", "The upstream refused the requests (401 / 403)");
          if (M >= Bt) throw Ce("quota", "The browser storage quota is exceeded");
          if (a.pin && await Oo(t, r.resources)) throw Ce("quota", "The pinned entries reach cacheMaxBytes");
          try {
            i.postMessage({
              type: "proceed",
              sourceId: n.id,
              regionId: c,
              percent: W(false),
              processed: u,
              total: r.total,
              error: s.error,
              errors: { ...h }
            });
          } catch {
          }
        }
      };
      G = await qt({ ...E, tasks: xo(r, "style", () => A) }), G === "finished" && (G = await qt({ ...E, tasks: xo(r, "rest", () => A) })), k && G === "finished" && (G = "canceled");
    } catch (E) {
      G = "stopped", w = E instanceof $ ? E : $.from(E);
    }
    const q = G === "finished" ? s.error === 0 ? "complete" : "partial" : G === "canceled" ? "canceled" : G === "gone" ? "partial" : "stopped";
    if (!k)
      try {
        await t.patchRegion(c, (E) => E.status !== "running" ? void 0 : {
          ...E,
          status: q,
          error: s.error,
          errors: { ...h },
          updatedAt: Date.now(),
          ...w ? { code: w.code } : {}
        });
      } catch (E) {
        console.error(E);
      }
    e.job === s && (e.job = void 0);
    try {
      G === "finished" ? i.postMessage({
        type: "finish",
        sourceId: n.id,
        regionId: c,
        percent: W(true),
        processed: u,
        total: r.total,
        error: s.error,
        errors: { ...h }
      }) : G === "canceled" ? i.postMessage({ type: "canceled", sourceId: n.id, regionId: c }) : G === "stopped" && i.postMessage({
        type: "stop",
        sourceId: n.id,
        regionId: c,
        code: w.code,
        message: w.message,
        processed: u,
        total: r.total
      });
    } catch {
    }
    try {
      await dn(e, { force: true });
    } catch (E) {
      console.error(E);
    }
  };
  var vc = 2;
  var _n = (e) => new Response(JSON.stringify(e), { headers: { "content-type": "application/json" } });
  var Ac = (e) => _n({ ok: true, result: e ?? null });
  var Sc = (e) => {
    let t = $.from(e);
    return t.code === "internal" && e !== t && typeof DOMException < "u" && e instanceof DOMException && (t = new $("storage", t.message, { name: e.name })), _n({ ok: false, error: { code: t.code, message: t.message, detail: t.detail ?? {} } });
  };
  var jn = (e) => new $("source-not-found", `Source "${e}" not found`, { sourceId: e });
  var Gr = (e) => !Mo(e) && !bt(e);
  var oe = async (e, t) => {
    const n = await e.getSource(t);
    if (!n || !Gr(n)) throw jn(t);
    return n;
  };
  var se = (e) => {
    const t = e !== null && typeof e == "object" ? e.id : void 0;
    if (typeof t != "string" || t === "")
      throw new $("attribute-invalid", 'Attribute "id" must be a non-empty string', { attribute: "id" });
    return t;
  };
  var kc = (e) => {
    const t = e !== null && typeof e == "object" ? e.resourceId : void 0;
    if (typeof t != "string" || t === "")
      throw new $("attribute-invalid", 'Attribute "resourceId" must be a non-empty string', { attribute: "resourceId" });
    return t;
  };
  var ie = async (e, t) => le(t) ? On(e, t.id, tn(t)) : tn(t);
  var Le = async (e, t) => {
    const n = [], o = [];
    for (const r of t) {
      for (const s of await e.resourcesBySource(r)) n.some((i) => i.id === s.id) || n.push(s);
      for (const s of await e.resourcesByRangeOnlySource(r)) o.some((i) => i.id === s.id) || o.push(s);
    }
    return [...n, ...o.filter((r) => !n.some((s) => s.id === r.id))];
  };
  var Kr = (e, t) => !t.some((n) => e.sourceIds.indexOf(n) >= 0) && t.some((n) => (e.rangeOnlySourceIds ?? []).indexOf(n) >= 0);
  var Ct = async (e, t) => {
    const n = Oe(t) ?? le(t);
    if (!n) throw jn(t.id);
    const o = Date.now(), r = await ie(e, t);
    return {
      id: t.id,
      // getOwn・sources が旧 API の記録と子を除くので、kind は利用者の kind
      kind: t.kind,
      url: Array.isArray(n.url) ? n.url.slice() : n.url,
      resources: (await Le(e, r)).map((s) => {
        const i = Po(s, o);
        return Kr(s, r) && (i.rangeOnly = true), i;
      }),
      warnings: t.warnings.slice()
    };
  };
  var xc = async (e, t, n) => {
    let o = 0;
    const r = Math.min(...n.map((i) => i.minZoom)), s = Math.max(...n.map((i) => i.maxZoom));
    for (let i = r; i <= s; i++) {
      const a = n.filter((c) => i >= c.minZoom && i <= c.maxZoom).map((c) => Ie(c.box, c.maxZoom, i));
      if (a.length !== 0)
        for (const c of await e.entriesAtZoom(t, i))
          c.x !== void 0 && c.y !== void 0 && a.some((d) => Ko(d, c.x, c.y)) && o++;
    }
    return o;
  };
  var Oc = (e, t, n) => {
    const o = (e.extents ?? []).filter((r) => t.indexOf(r.sourceId) >= 0 && r.box !== void 0).map((r) => ({ box: r.box, minZoom: r.minZoom, maxZoom: r.maxZoom }));
    return o.length > 0 ? o : [n];
  };
  var Ic = async (e, t) => {
    const n = /* @__PURE__ */ Object.create(null);
    let o = 0, r = 0;
    const s = await ie(e, t), i = await Le(e, s);
    for (const l of i)
      n[l.id] = { count: l.count, bytes: l.bytes }, o += l.count, r += l.bytes;
    const a = { count: o, size: r, byResource: n }, c = Oe(t)?.extent, d = c?.box;
    if (c && d) {
      let l = 0;
      for (const u of i)
        l += xt(u, s) && !Kr(u, s) ? u.count : await xc(e, u.id, Oc(u, s, { box: d, minZoom: c.minZoom, maxZoom: c.maxZoom }));
      a.count = l, a.total = qo(d, c.minZoom, c.maxZoom), a.percent = Math.min(100, Math.floor(l * 100 / (a.total || 1)));
    }
    return a;
  };
  var Ut = async (e, t) => {
    let n;
    try {
      n = await vr(na(e), gr);
    } catch {
      return e.table.current = void 0, [];
    }
    return n.filter((o) => t.some((r) => o === `template-shadowed: ${r}`));
  };
  var Rc = async (e, t, n) => {
    const o = n.filter((s) => t.warnings.indexOf(s) < 0);
    if (o.length === 0) return t;
    const r = { ...t, warnings: [...t.warnings, ...o] };
    try {
      await e.putSource(r);
    } catch {
    }
    return r;
  };
  var on = () => {
    try {
      const e = self.location.origin;
      return typeof e == "string" && e !== "" && e !== "null" ? e : void 0;
    } catch {
      return;
    }
  };
  var Ec = (e) => {
    if (typeof e.provider == "string" && e.provider !== "") return e.provider;
    const t = e.templates[0];
    if (typeof t != "string") return "unknown";
    let n;
    try {
      n = self.location.href;
    } catch {
      n = void 0;
    }
    try {
      const o = new URL(t, n).origin;
      return o === "null" ? "unknown" : o;
    } catch {
      return "unknown";
    }
  };
  var _c = async (e) => {
    const t = /* @__PURE__ */ Object.create(null);
    let n = 0, o = 0;
    for (const r of await e.listResources()) {
      n += r.count, o += r.bytes;
      const s = Ec(r), i = t[s] ?? (t[s] = { count: 0, bytes: 0 });
      i.count += r.count, i.bytes += r.bytes;
    }
    return { count: n, bytes: o, byProvider: t };
  };
  var jc = (e) => {
    if (typeof e == "string")
      try {
        const t = new URL(e).origin;
        return t === "null" ? void 0 : t;
      } catch {
        return;
      }
  };
  var Tc = async (e) => {
    const t = on();
    if (t === void 0) return false;
    const n = e !== null && typeof e == "object" ? e.clientId : void 0;
    if (typeof n != "string" || n === "") return false;
    let o;
    try {
      o = await self.clients.get(n);
    } catch {
      return false;
    }
    return o ? o.url === "about:srcdoc" || o.url === "about:blank" ? true : jc(o.url) === t : false;
  };
  function Mc(e) {
    let t = Promise.resolve();
    const n = (g) => {
      const p = t.then(g, g);
      return t = p.catch(() => {
      }), p;
    }, o = (g) => n(async () => {
      try {
        return await g();
      } catch (p) {
        throw await Ut(e, []), p;
      }
    }), r = async (g, p, y = []) => {
      const S = (await Le(g, await ie(g, p))).map((x) => x.id);
      return Ct(g, await Rc(g, p, [...y, ...await Ut(e, S)]));
    }, s = (g) => o(async () => {
      const p = $a(g, e.providers()), y = await e.store();
      if (ja(p)) return r(y, await bo(e, p, { mode: "register", swOrigin: on() }), p.warnings);
      const S = await ya(y, p);
      return r(y, S.source, p.warnings);
    }), i = (g) => o(async () => {
      const p = await e.store(), y = await oe(p, g), S = await p.getCredentials(g), x = le(y);
      if (x) {
        const W = (await Le(p, await ie(p, y))).map((q) => q.id), G = await bo(
          e,
          S ? { spec: x, credentials: S } : { spec: x },
          { mode: "update", swOrigin: on() }
        );
        for (const q of [...W, ...(await Le(p, await ie(p, G))).map((E) => E.id)]) e.corslessStreak.delete(q);
        return r(p, G, Qt([x.url], x.policy.credentialParams));
      }
      const _2 = Oe(y);
      if (!_2) throw jn(g);
      const K = await ga(p, g, S ? { spec: _2, credentials: S } : { spec: _2 });
      for (const W of K.resources) e.corslessStreak.delete(W.id);
      return r(p, K.source, Qt(Array.isArray(_2.url) ? _2.url : [_2.url], _2.policy.credentialParams));
    }), a = (g) => n(async () => {
      const p = se(g), y = await e.store(), S = await oe(y, p);
      nn(e, p);
      const x = await ie(y, S), _2 = m(g, "range");
      if (_2 !== void 0)
        await hc(y, S, x, _2, { force: m(m(g, "options"), "force") === true });
      else {
        await So(y, p, x, { keep: true });
        for (const U of await Le(y, x))
          xt(U, x) && await y.clearEntries(U.id);
      }
      return null;
    }), c = (g) => n(async () => {
      const p = se(g), y = u(g), S = await e.store(), x = await oe(S, p);
      return await pc(
        e,
        S,
        p,
        await ie(S, x),
        y,
        { keep: m(m(g, "options"), "keep") === true }
      ), null;
    }), d = (g) => o(async () => {
      const p = await e.store(), y = await oe(p, g);
      nn(e, g);
      const S = await ie(p, y), x = (await Le(p, S)).map((_2) => _2.id);
      await So(p, g, S, { keep: true }), le(y) && await Ur(p, g, tn(y), { strict: true }), await Ot(p, g);
      for (const _2 of x)
        await p.getResource(_2) || e.corslessStreak.delete(_2);
      return await Ut(e, []), null;
    }), l = (g) => o(async () => {
      const p = se(g), y = kc(g), S = await e.store(), x = await oe(S, p), _2 = await ie(S, x), U = await S.getResource(y);
      if (!(!!U && _2.some((W) => U.sourceIds.indexOf(W) >= 0 || (U.rangeOnlySourceIds ?? []).indexOf(W) >= 0)))
        throw new $("resource-not-found", `Resource "${y}" not found in source "${p}"`, { sourceId: p, resourceId: y });
      return await S.clearEntries(y), null;
    }), u = (g) => {
      const p = g !== null && typeof g == "object" ? g.regionId : void 0;
      if (typeof p != "string" || p === "")
        throw new $("attribute-invalid", 'Attribute "regionId" must be a non-empty string', { attribute: "regionId" });
      return p;
    }, m = (g, p) => g !== null && typeof g == "object" ? g[p] : void 0, k = async (g) => {
      const p = g, y = p?.clientId, S = typeof y == "string" && y !== "" ? await self.clients.get(y) : void 0;
      if (!S || typeof p?.waitUntil != "function")
        throw new $("sw-not-controlling", "The request did not come from a client of the service worker");
      return {
        client: { id: y, postMessage: (_2) => S.postMessage(_2) },
        waitUntil: (_2) => p.waitUntil.call(p, _2)
      };
    }, w = async (g) => {
      const p = se(g), y = await e.store(), S = await oe(y, p);
      return sc(y, S, m(g, "range"), await ie(y, S));
    }, b = (g, p) => n(async () => {
      const y = se(g), S = await e.store(), x = await oe(S, y), { client: _2, waitUntil: U } = await k(p), K = await cc(e, S, x, await ie(S, x), _2, m(g, "range"), m(g, "options"));
      return U(K.job), K.info;
    }), I = async (g) => {
      const p = se(g), y = await e.store();
      return await oe(y, p), ac(e, y, p);
    }, M = async (g) => {
      const p = se(g);
      return await oe(await e.store(), p), dc(e, p);
    }, N = async (g, p) => {
      const y = se(g), S = u(g), x = await e.store();
      await oe(x, y);
      const _2 = await Fr(e, x, y, S);
      return _2 || n(async () => {
        const U = await oe(x, y), { client: K, waitUntil: W } = await k(p), G = await lc(e, x, U, await ie(x, U), K, S);
        return G.job && W(G.job), G.info;
      });
    }, f = async () => _c(await e.store()), h = async (g) => {
      if (g === null || typeof g != "object" || Array.isArray(g))
        throw new $("attribute-invalid", "Request body must be an object", { attribute: "limits" });
      const p = g.maxBytes;
      if (p !== void 0 && !(typeof p == "number" && Number.isInteger(p) && p >= 0))
        throw new $("attribute-invalid", 'Attribute "maxBytes" must be a non-negative integer', { attribute: "maxBytes" });
      return await (await e.store()).kvPut(Lo, p === void 0 ? {} : { maxBytes: p }), null;
    }, v = async (g) => {
      if (g === null || typeof g != "object" || Array.isArray(g))
        throw new $("attribute-invalid", "Request body must be an object", { attribute: "userAgent" });
      const p = g.userAgent, y = p === void 0 ? void 0 : Yo(p), S = await e.store();
      return Wo(await S.kvGet(Zt)) !== y && await S.kvPut(Zt, y === void 0 ? {} : { userAgent: y }), e.userAgent.loaded = Promise.resolve(y), null;
    }, A = async (g) => {
      const p = await e.store();
      return Ct(p, await oe(p, g));
    }, O = async () => {
      const g = await e.store(), p = (await g.listSources()).filter(Gr);
      return Promise.all(p.map((y) => Ct(g, y)));
    }, R = async (g) => {
      const p = await e.store();
      return Ic(p, await oe(p, g));
    }, L = async (g, p, y) => {
      switch (g) {
        case "estimate":
          return w(p);
        case "fetchRange":
          return b(p, y);
        case "regions":
          return I(p);
        case "cancel":
          return M(p);
        // /v2/job/resume は url.pathname.slice(V2_PREFIX.length) で 'job/resume'（計画の申し送り）
        case "job/resume":
          return N(p, y);
        case "register":
          return s(p);
        case "source":
          return A(se(p));
        case "sources":
          return O();
        case "stats":
          return R(se(p));
        case "update":
          return i(se(p));
        case "clean":
          return a(p);
        case "releaseRange":
          return c(p);
        case "remove":
          return d(se(p));
        case "removeResource":
          return l(p);
        case "usage":
          return f();
        case "setLimits":
          return h(p);
        case "setUserAgent":
          return v(p);
        default:
          throw new $("api-not-found", `Operation "${g}" not found`, { op: g });
      }
    };
    return {
      get: async ({ url: g }) => g.pathname === `${Dn}ping` ? _n({ api: vc, version: "1.2.0-rc.1" }) : new Response("Not Found", { status: 404 }),
      post: async ({ url: g, request: p, event: y }) => {
        try {
          if (!await Tc(y))
            throw new $("sw-not-controlling", "The request did not come from a client of the service worker origin");
          e.maintain?.(y);
          const S = g.pathname.slice(Dn.length);
          let x;
          try {
            const _2 = await p.text();
            x = _2 === "" ? {} : JSON.parse(_2);
          } catch {
            throw new $("attribute-invalid", "Request body must be a JSON text", { attribute: "body" });
          }
          return Ac(await L(S, x, y));
        } catch (S) {
          return Sc(S);
        }
      }
    };
  }
  var qr = "migration";
  var fe = "Weiwudi";
  var Tn = "Weiwudi_";
  var Ne = "mapSetting";
  var Ee = "tileCache";
  var $c = 200;
  var Pc = 3;
  var Lc = 3e3;
  var Bc = ["pending", "settings", "tiles", "done"];
  var Dc = ["pending", "copying", "done", "failed"];
  var _e = (e) => `${Tn}${e}`;
  var je = (e) => `${xe}${e}`;
  var Mn = (e, t) => `${je(e)}\0${t}`;
  var Cc = (e) => e === fe || e.startsWith(Tn);
  var Uc = (e) => e.status === "pending" || e.status === "copying";
  var Xe = (e) => typeof e == "number" && Number.isFinite(e);
  var zc = (e) => ({ stage: "pending", maps: [], pendingDelete: [], startedAt: e, updatedAt: e });
  var Nc = (e) => {
    if (!e || typeof e != "object") return;
    const t = e;
    if (typeof t.mapID != "string" || Dc.indexOf(t.status) < 0) return;
    const n = {
      mapID: t.mapID,
      status: t.status,
      recordFailures: Xe(t.recordFailures) ? t.recordFailures : 0,
      batchFailures: Xe(t.batchFailures) ? t.batchFailures : 0
    };
    return typeof t.lastKey == "string" && (n.lastKey = t.lastKey), n;
  };
  var Xc = (e) => {
    const t = Date.now();
    if (!e || typeof e != "object") return zc(t);
    const n = e;
    return {
      stage: Bc.indexOf(n.stage) >= 0 ? n.stage : "pending",
      maps: Array.isArray(n.maps) ? n.maps.map(Nc).filter((o) => o !== void 0) : [],
      pendingDelete: Array.isArray(n.pendingDelete) ? n.pendingDelete.filter((o) => typeof o == "string") : [],
      startedAt: Xe(n.startedAt) ? n.startedAt : t,
      updatedAt: Xe(n.updatedAt) ? n.updatedAt : t
    };
  };
  var Te = async (e) => Xc(await e.kvGet(qr));
  var Me = (e, t, n) => {
    const o = e.maintenance, r = async () => {
      const i = await Te(t);
      return n(i) === false || (i.updatedAt = Date.now(), await t.kvPut(qr, i)), i;
    }, s = (o.migrationLock ?? Promise.resolve()).then(r, r);
    return o.migrationLock = s.then(() => {
    }, () => {
    }), s;
  };
  var Et = (e, t) => {
    e.pendingDelete.indexOf(t) < 0 && e.pendingDelete.push(t);
  };
  var be = (e, t) => e.maintenance.forgotten?.has(t) === true;
  var gt = (e, t, n, o) => Me(e, t, (r) => {
    if (be(e, n)) return false;
    const s = r.maps.find((i) => i.mapID === n);
    if (!s) return false;
    o(s, r);
  });
  var qe = (e, t) => {
    const n = e.maintenance;
    n.settingsDone = t.stage === "tiles" || t.stage === "done", t.stage === "done" && (n.migrated = true, n.failedMaps = new Set(t.maps.filter((o) => o.status === "failed").map((o) => o.mapID)));
  };
  var $n = async () => {
    if (typeof indexedDB.databases == "function")
      try {
        return (await indexedDB.databases()).map((t) => t.name).filter((t) => typeof t == "string" && Cc(t));
      } catch {
        return;
      }
  };
  var Fe = (e, t) => new Promise((n) => {
    const o = e.maintenance;
    if (o.blockedDeletes?.has(t)) {
      n("blocked");
      return;
    }
    let r;
    try {
      r = indexedDB.deleteDatabase(t);
    } catch {
      n("failed");
      return;
    }
    const s = () => {
      (o.blockedDeletes ??= /* @__PURE__ */ new Set()).add(t), n("blocked");
    }, i = setTimeout(s, Lc);
    r.onsuccess = () => {
      clearTimeout(i), o.blockedDeletes?.delete(t), n("deleted");
    }, r.onerror = () => {
      clearTimeout(i), o.blockedDeletes?.delete(t), n("failed");
    }, r.onblocked = () => {
      clearTimeout(i), s();
    };
  });
  var _t = (e, t) => e.maintenance.blockedDeletes?.has(t) ? Promise.resolve(void 0) : new Promise((n, o) => {
    let r = false, s;
    try {
      s = indexedDB.open(t);
    } catch (i) {
      o(i);
      return;
    }
    s.onupgradeneeded = (i) => {
      i.oldVersion === 0 && (r = true);
    }, s.onsuccess = () => {
      const i = s.result;
      if (i.onversionchange = () => i.close(), !r) {
        n(i);
        return;
      }
      i.close(), Fe(e, t).then(() => n(void 0));
    }, s.onerror = () => o(s.error);
  });
  var Fc = (e) => new Promise((t, n) => {
    const o = e.transaction([Ne], "readonly"), r = o.objectStore(Ne).getAll();
    o.oncomplete = () => t(r.result), o.onabort = () => n(o.error ?? r.error);
  });
  var Zc = (e, t, n) => new Promise((o, r) => {
    const s = e.transaction([Ee], "readonly"), i = t === void 0 ? void 0 : IDBKeyRange.lowerBound(t, true), a = s.objectStore(Ee).openCursor(i), c = [];
    let d = false;
    a.onsuccess = () => {
      const l = a.result;
      if (!l) {
        d = true;
        return;
      }
      c.push({ key: String(l.primaryKey), value: l.value }), c.length < n && l.continue();
    }, s.oncomplete = () => o({ records: c, exhausted: d }), s.onabort = () => r(s.error ?? a.error);
  });
  var Yc = (e, t) => new Promise((n, o) => {
    const r = e.transaction([Ee], "readonly"), s = r.objectStore(Ee).get(t);
    r.oncomplete = () => n(s.result), r.onabort = () => o(r.error ?? s.error);
  });
  var Hr = (e, t) => new Promise((n, o) => {
    if (t.length === 0) {
      n();
      return;
    }
    const r = e.transaction([Ee], "readwrite"), s = r.objectStore(Ee);
    for (const i of t) s.delete(i);
    r.oncomplete = () => n(), r.onabort = () => o(r.error);
  });
  var Wc = (e) => {
    const t = {};
    if (!e || typeof e != "object") return t;
    for (const [n, o] of Object.entries(e)) {
      const r = n.toLowerCase();
      typeof o != "string" || r === "__proto__" || Eo.indexOf(r) >= 0 || r.startsWith(_o) || (t[r] = o);
    }
    return t;
  };
  var Gc = /^(\d+)_(\d+)_(\d+)$/;
  var Jr = async (e, t, n) => {
    if (!n || typeof n != "object") return;
    const o = n, r = Gc.exec(t);
    if (!r || !(o.blob instanceof Blob) || !Xe(o.epoch)) return;
    const s = o.blob;
    let i;
    try {
      i = await s.arrayBuffer();
    } catch {
      return;
    }
    const a = Wc(o.headers), c = Mn(e, t), d = {
      key: c,
      resourceId: je(e),
      z: Number(r[1]),
      x: Number(r[2]),
      y: Number(r[3]),
      size: s.size,
      fetchedAt: o.epoch,
      accessedAt: Xe(o.accessedAt) ? o.accessedAt : o.epoch,
      pinned: 0
    };
    return a["content-type"] !== void 0 && (d.contentType = a["content-type"]), { meta: d, body: { key: c, blob: new Blob([i], { type: s.type }), headers: a } };
  };
  var Kc = async (e, t) => {
    const n = await e.store();
    await Qr(e, n);
    const o = await Te(n);
    if (o.stage === "tiles" || o.stage === "done") {
      qe(e, o);
      return;
    }
    const r = await $n(), s = (w) => o.pendingDelete.indexOf(w) >= 0;
    let i = [], a = false;
    if ((!r || r.indexOf(fe) >= 0) && !s(fe)) {
      const w = await _t(e, fe);
      if (w) {
        a = true;
        try {
          w.objectStoreNames.contains(Ne) && (i = await Fc(w));
        } finally {
          w.close();
        }
      }
    }
    a && await Me(e, n, (w) => {
      w.stage = "settings";
    });
    const c = Date.now(), d = [];
    for (const w of i) {
      const b = w;
      !b || typeof b.mapID != "string" || d.indexOf(b.mapID) >= 0 || (d.push(b.mapID), !(b.mapID.indexOf("\0") >= 0) && (await n.getSource(je(b.mapID)) || await t.registerMap(n, b, c)));
    }
    const l = o.maps.filter((w) => w.status === "failed"), u = d.map((w) => {
      const b = l.find((M) => M.mapID === w);
      if (b) return b;
      let I = "pending";
      return w.indexOf("\0") >= 0 ? I = "failed" : (be(e, w) || s(_e(w)) || r && r.indexOf(_e(w)) < 0) && (I = "done"), { mapID: w, status: I, recordFailures: 0, batchFailures: 0 };
    });
    for (const w of l) d.indexOf(w.mapID) < 0 && u.push(w);
    const m = [];
    for (const w of r ?? []) {
      if (w === fe || s(w)) continue;
      const b = w.slice(Tn.length);
      if (!u.some((I) => I.mapID === b)) {
        if (b.indexOf("\0") < 0 && !be(e, b) && await n.getSource(je(b))) {
          u.push({ mapID: b, status: "pending", recordFailures: 0, batchFailures: 0 });
          continue;
        }
        await Fe(e, w) !== "deleted" && m.push(w);
      }
    }
    if (!a && u.length === 0 && m.length === 0 && o.pendingDelete.length === 0) {
      qe(e, { ...o, stage: "done" });
      return;
    }
    const k = await Me(e, n, (w) => {
      w.maps = u;
      for (const b of m) Et(w, b);
      w.stage = !a && u.length === 0 ? "done" : "tiles";
    });
    qe(e, k);
  };
  function Vr(e, t) {
    const n = e.maintenance;
    if (n.settingsDone || n.migrated) return Promise.resolve();
    if (n.settings) return n.settings;
    const o = Kc(e, t).finally(() => {
      n.settings === o && (n.settings = void 0);
    });
    return n.settings = o, o;
  }
  async function qc(e, t) {
    try {
      await Vr(e, t);
    } catch (n) {
      console.error(n);
    }
  }
  var Hc = (e) => !e.maintenance.settingsDone && !e.maintenance.migrated;
  async function Jc(e, t) {
    try {
      let n;
      try {
        n = await Te(await e.store());
      } catch {
        n = void 0;
      }
      if (n && n.pendingDelete.indexOf(fe) >= 0) return;
      const o = await $n();
      if (o && o.indexOf(fe) < 0) return;
      const r = await _t(e, fe);
      if (!r) return;
      try {
        if (!r.objectStoreNames.contains(Ne)) return;
        const s = await new Promise((i, a) => {
          const c = r.transaction([Ne], "readonly"), d = c.objectStore(Ne).get(t);
          c.oncomplete = () => i(d.result), c.onabort = () => a(c.error ?? d.error);
        });
        return s && typeof s == "object" ? s : void 0;
      } finally {
        r.close();
      }
    } catch {
      return;
    }
  }
  var zt = (e, t, n, o = 0) => gt(e, t, n, (r) => {
    r.batchFailures++, r.recordFailures += o, r.status = r.batchFailures >= Pc ? "failed" : r.status;
  });
  var Io = async (e, t, n, o, r) => {
    if (be(e, n)) return;
    const s = await Fe(e, _e(n));
    await gt(e, t, n, (i, a) => {
      i.status = "done", o !== void 0 && (i.lastKey = o), i.recordFailures += r, i.batchFailures = 0, s !== "deleted" && Et(a, _e(n));
    });
  };
  var Vc = async (e, t, n, o, r) => {
    const { mapID: s } = o, i = je(s);
    if (s.indexOf("\0") >= 0)
      return await gt(e, n, s, (d) => {
        d.status = "failed";
      }), { done: true, read: 0 };
    const a = await n.getResource(i);
    if (!a)
      return await zt(e, n, s), { done: false };
    let c;
    try {
      let d;
      try {
        c = await _t(e, _e(s)), c && c.objectStoreNames.contains(Ee) && (d = await Zc(c, o.lastKey, r));
      } catch (f) {
        return console.error(f), await zt(e, n, s), { done: false };
      }
      if (!d)
        return c?.close(), c = void 0, await Io(e, n, s, void 0, 0), { done: true, read: 0 };
      const { records: l, exhausted: u } = d, m = await n.hasEntries(l.map((f) => Mn(s, f.key))), k = await t.evictScopesFor(n, a), w = [];
      let b = 0, I = false, M = false;
      for (let f = 0; f < l.length; f++) {
        const { key: h, value: v } = l[f];
        if (m[f]) {
          w.push(h);
          continue;
        }
        const A = await Jr(s, h, v);
        if (!A) {
          b++;
          continue;
        }
        if (be(e, s)) return { done: false };
        let O;
        try {
          ({ saved: O } = await n.putEntry(A.meta, A.body, k));
        } catch (R) {
          console.error(R), M = true;
          break;
        }
        if (!O && !await n.getResource(i)) {
          I = true;
          break;
        }
        w.push(h);
      }
      if (be(e, s)) return { done: false };
      if (await Hr(c, w), I || M)
        return await zt(e, n, s), { done: false };
      const N = l.length > 0 ? l[l.length - 1].key : o.lastKey;
      return u ? (c.close(), c = void 0, await Io(e, n, s, N, b), { done: true, read: l.length }) : (await gt(e, n, s, (f) => {
        f.status = "copying", N !== void 0 && (f.lastKey = N), f.recordFailures += b, f.batchFailures = 0;
      }), { done: false });
    } finally {
      c?.close();
    }
  };
  var Qc = async (e, t) => {
    const n = await Fe(e, fe), o = await Me(e, t, (r) => {
      n !== "deleted" && Et(r, fe), r.stage = "done";
    });
    qe(e, o);
  };
  var el = async (e, t) => {
    const n = e.maintenance, o = await Te(t);
    if (o.stage !== "done") return;
    const r = await $n();
    if (!r) return;
    const s = o.maps.filter((i) => i.status === "failed").map((i) => _e(i.mapID));
    r.some((i) => o.pendingDelete.indexOf(i) < 0 && s.indexOf(i) < 0) && (await Me(e, t, (i) => {
      i.stage = "pending";
    }), n.migrated = false, n.settingsDone = false, n.failedMaps = void 0);
  };
  var Qr = (e, t) => {
    const n = e.maintenance;
    if (n.migrationBooted) return Promise.resolve();
    if (n.migrationBooting) return n.migrationBooting;
    const o = el(e, t).then(() => {
      n.migrationBooted = true;
    }).finally(() => {
      n.migrationBooting === o && (n.migrationBooting = void 0);
    });
    return n.migrationBooting = o, o;
  };
  var tl = async (e, t) => {
    const n = e.maintenance;
    if (n.pendingDeletesRetried) return;
    const o = await Te(t), r = await Promise.all(o.pendingDelete.map((i) => Fe(e, i))), s = o.pendingDelete.filter((i, a) => r[a] === "deleted");
    s.length > 0 && await Me(e, t, (i) => {
      i.pendingDelete = i.pendingDelete.filter((a) => s.indexOf(a) < 0);
    }), n.pendingDeletesRetried = true;
  };
  var nl = async (e, t) => {
    const n = e.maintenance, o = await e.store();
    if (await Qr(e, o), await tl(e, o), n.migrated) return;
    const r = await Te(o);
    if (r.stage === "done") {
      qe(e, r);
      return;
    }
    if (r.stage === "pending" || r.stage === "settings") {
      await Vr(e, t);
      return;
    }
    n.settingsDone = true;
    let s = $c;
    for (; s > 0; ) {
      const a = (await Te(o)).maps.find((d) => Uc(d) && !be(e, d.mapID));
      if (!a) {
        await Qc(e, o);
        return;
      }
      const c = await Vc(e, t, o, a, s);
      if (!c.done) return;
      s -= c.read;
    }
  };
  function ol(e, t) {
    const n = e.maintenance;
    if (n.migrating) return n.migrating;
    const o = nl(e, t).finally(() => {
      n.migrating === o && (n.migrating = void 0);
    });
    return n.migrating = o, o;
  }
  var rl = async (e, t, n, o) => {
    const r = await e.store(), i = (await Te(r)).maps.find((u) => u.mapID === n);
    if (!i || i.status === "done" || n.indexOf("\0") >= 0) return;
    const a = Mn(n, o), [c] = await r.hasEntries([a]);
    if (c) return;
    const d = await r.getResource(je(n));
    if (!d) return;
    const l = await _t(e, _e(n));
    if (l)
      try {
        if (!l.objectStoreNames.contains(Ee)) return;
        const u = await Yc(l, o);
        if (u === void 0) return;
        const m = await Jr(n, o, u);
        if (!m || be(e, n)) return;
        const { saved: k } = await r.putEntry(m.meta, m.body, await t.evictScopesFor(r, d));
        if (!k && !await r.getResource(je(n))) return;
        await Hr(l, [o]);
      } finally {
        l.close();
      }
  };
  async function sl(e, t, n, o, r, s) {
    const i = e.maintenance;
    if (i.migrated && !i.failedMaps?.has(n) || be(e, n)) return;
    const a = i.pulls ??= /* @__PURE__ */ new Map();
    let c = a.get(n);
    c || (c = /* @__PURE__ */ new Set(), a.set(n, c));
    const d = rl(e, t, n, `${o}_${r}_${s}`).catch((l) => {
      console.error(l);
    });
    c.add(d);
    try {
      await d;
    } finally {
      c.delete(d), c.size === 0 && a.get(n) === c && a.delete(n);
    }
  }
  async function Ro(e, t, n = {}) {
    const o = e.maintenance;
    (o.forgotten ??= /* @__PURE__ */ new Set()).add(t), o.failedMaps?.delete(t);
    const r = await e.store();
    try {
      await Me(e, r, (a) => {
        const c = a.maps.findIndex((d) => d.mapID === t);
        if (c < 0) return false;
        n.remove ? a.maps.splice(c, 1) : a.maps[c].status = "done";
      });
    } catch (a) {
      console.error(a);
    }
    const s = [];
    o.running && s.push(o.running), o.migrating && s.push(o.migrating);
    for (const a of o.pulls?.get(t) ?? []) s.push(a);
    await Promise.allSettled(s), n.remove || await r.clearEntries(je(t));
    const i = _e(t);
    if (await Fe(e, i) !== "deleted")
      try {
        await Me(e, r, (a) => Et(a, i));
      } catch (a) {
        console.error(a);
      }
  }
  var il = rn;
  var ue = (e) => `${xe}${e}`;
  var es = (e, t, n, o) => `${e}\0${Vo(t, n, o)}`;
  var al = () => ({ network: 0, upstream: 0, quota: 0, storage: 0 });
  var Nt = (e) => new Response(JSON.stringify(e), { headers: new Headers({ "content-type": "application/json" }) });
  var Ke = async (e, t, n) => {
    const o = await t.getSource(ue(n));
    if (o && o.kind === "legacy") return o.legacy;
    if (!o && typeof n == "string" && Hc(e)) return Jc(e, n);
  };
  var ts = (e) => ({ minX: e.minX || 0, maxX: e.maxX || 0, minY: e.minY || 0, maxY: e.maxY || 0 });
  var cl = (e) => {
    const t = ue(e.mapID), n = { minZoom: e.minZoom || 0, maxZoom: e.maxZoom ?? 1 / 0, sourceId: t };
    e.maxZoom !== void 0 && e.minX !== void 0 && e.maxX !== void 0 && e.minY !== void 0 && e.maxY !== void 0 && (n.box = ts(e));
    const o = e.cacheTtl ?? il;
    return {
      id: t,
      type: "tile",
      templates: Array.isArray(e.url) ? e.url.slice() : typeof e.url == "string" ? [e.url] : [],
      sourceIds: [t],
      extents: [n],
      encoding: "raster",
      policy: {
        // 現行は数でない cacheTtl（parseInt の NaN）で期限切れにならない
        cacheTtl: Number.isNaN(o) ? 1 / 0 : o,
        store: true,
        outOfRange: { extent: "transparent", zoom: "not-found" },
        credentialParams: []
      },
      count: 0,
      bytes: 0,
      pinnedBytes: 0
    };
  };
  var ns = async (e, t, n) => {
    const o = ue(t.mapID), r = await e.getSource(o), s = cl(t);
    await e.getResource(o) ? await e.replaceResource(s) : await e.createResource(s);
    const i = r ? r.order : await sn(e);
    await e.putSource({ id: o, kind: "legacy", spec: {}, order: i, warnings: [], createdAt: r?.createdAt ?? n, legacy: t });
  };
  var Pn = Object.freeze({ registerMap: ns, evictScopesFor: vt });
  var os = (e, t, n, o) => {
    let r = "";
    return e.url instanceof Array ? r = e.url[Math.floor(Math.random() * e.url.length)] : typeof e.url == "string" && (r = e.url), Jo(r, t, n, o);
  };
  var rs = (e, t) => {
    try {
      return new Request(new URL(e, self.location.href).href, t);
    } catch {
      return new Request("about:blank", t);
    }
  };
  var ss = (e, t, n, o, r) => {
    const s = ue(t.mapID), i = os(t, n, o, r);
    return rr(e, {
      resourceId: s,
      key: es(s, n, o, r),
      coord: { z: n, x: o, y: r },
      request: rs(i),
      storable: true,
      upstream: async (a, { requestChanged: c }) => ({ kind: "response", response: await (c ? e.upstreamFetch(a) : e.upstreamFetch(i)) })
    }, () => Date.now());
  };
  var ll = (e, t, n, o, r, s) => ln(() => e.upstreamFetch(rs(os(t, n, o, r), { headers: { range: s } })));
  var dl = async (e, t, n, o, r, s) => {
    const i = await e.store(), a = await Ke(e, i, t);
    return a ? s !== null ? ll(e, a, n, o, r, s) : (await sl(e, Pn, t, n, o, r), ss(e, a, n, o, r)) : te("map-not-found", { mapID: t });
  };
  var ul = async (e, t, n, o) => {
    const { mapID: r, totalTile: s } = o, i = ue(r);
    let a = 0;
    const c = () => {
      e.job === t && (e.job = void 0);
    };
    try {
      const d = await e.store(), l = await qt({
        tasks: Xs(ts(o), o.minZoom || 0, o.maxZoom || 0),
        isAlive: async () => !!await self.clients.get(n.id),
        isCanceled: () => t.cancel,
        run: async ([u, m, k]) => {
          const [w] = await d.hasEntries([es(i, u, m, k)]);
          if (w) return;
          const b = await ss(e, o, u, m, k), I = b.headers.get("x-weiwudi-error");
          I !== null && I in t.failures && (t.error++, t.failures[I]++), await b.arrayBuffer();
        },
        onBatch: (u) => {
          a = u, t.count = u;
          const m = Math.floor(a * 100 / (s || 1));
          n.postMessage({
            type: "proceed",
            message: `Proceeding the tile fetching: ${r} ${m}% (${a} / ${s})`,
            percent: m,
            processed: a,
            error: t.error,
            errors: { ...t.failures },
            total: s,
            mapID: r
          });
        }
      });
      if (c(), l === "canceled")
        n.postMessage({ type: "canceled", message: `Fetching tile of ${r} is canceled`, mapID: r });
      else if (l === "finished") {
        const { error: u } = t;
        n.postMessage({
          type: "finish",
          message: `Fetched all tiles of ${r}${u ? ` with ${u} error cases` : ""}`,
          total: s,
          mapID: r,
          error: u,
          errors: { ...t.failures }
        });
      }
    } catch (d) {
      c(), n.postMessage({
        type: "stop",
        message: `Fetching stopped: ${r} ${a} / ${s}`,
        reason: d,
        code: $.from(d).code,
        processed: a,
        total: s,
        mapID: r
      });
    } finally {
      c();
      try {
        await dn(e, { force: true });
      } catch (d) {
        console.error(d);
      }
    }
  };
  var fl = async (e, t, n, o, r, s, i) => {
    let a;
    const c = (l, u) => u.reduce((m, k) => m || (l[k] === void 0 ? te("attribute-missing", { target: k }) : m), void 0), d = () => e.job !== void 0 && e.job.sourceId === ue(n.mapID);
    try {
      switch (t) {
        case "ping":
          a = "Implemented";
          break;
        case "info":
          if (a = c(n, ["mapID"]), !a) {
            const l = await Ke(e, await e.store(), n.mapID);
            l ? a = Nt(l) : a = te("map-not-found", { mapID: n.mapID });
          }
          break;
        case "add": {
          const l = await e.store();
          if (a = c(n, ["mapID", "type", "url"]), !a && String(n.mapID).indexOf("\0") >= 0 && (a = "Error: MapID must not contain a NUL character"), !a) {
            if (n.tileSize = parseInt(n.tileSize || 256), n.cacheTtl !== void 0 && (n.cacheTtl = parseInt(n.cacheTtl)), n.cacheMaxBytes !== void 0) {
              const u = String(n.cacheMaxBytes).trim(), m = parseInt(u);
              !Number.isFinite(m) || m < 0 || String(m) !== u ? a = te("attribute-invalid") : n.cacheMaxBytes = m;
            }
            switch (n.type) {
              case "xyz":
                if (a || (a = c(n, ["width", "height"])), !a) {
                  n.width = parseInt(n.width), n.height = parseInt(n.height), n.maxZoom = Fs(n.width, n.height, n.tileSize), n.minZoom = n.minZoom ? parseInt(n.minZoom) : 0;
                  const u = Zs(n.width, n.height, n.tileSize);
                  n.minX = u.minX, n.minY = u.minY, n.maxX = u.maxX, n.maxY = u.maxY;
                }
                break;
              case "wmts":
                if (!a && (n.maxZoom && (n.maxZoom = parseInt(n.maxZoom)), n.minZoom && (n.minZoom = parseInt(n.minZoom)), n.maxLng && n.minLng && n.maxLat && n.minLat)) {
                  n.maxLng = parseFloat(n.maxLng), n.minLng = parseFloat(n.minLng), n.maxLat = parseFloat(n.maxLat), n.minLat = parseFloat(n.minLat);
                  const u = an(n, n.maxZoom);
                  n.minX = u.minX, n.maxX = u.maxX, n.minY = u.minY, n.maxY = u.maxY;
                }
                break;
              default:
                a = te("unknown-type");
            }
          }
          a || (c(n, ["maxX", "minX", "maxY", "minY", "minZoom", "maxZoom"]) || (n.totalTile = qo(n, n.minZoom, n.maxZoom)), await ns(l, n, Date.now()), a = Nt(n));
          break;
        }
        case "clean":
          if (a = c(n, ["mapID"]), d())
            a = te("map-busy", { mapID: n.mapID });
          else if (!a) {
            const l = await e.store();
            await Ke(e, l, n.mapID) ? (await Ro(e, String(n.mapID)), a = `Cleaned: ${n.mapID}`) : a = te("map-not-found", { mapID: n.mapID });
          }
          break;
        case "delete":
          if (a = c(n, ["mapID"]), d())
            a = te("map-busy", { mapID: n.mapID });
          else if (!a) {
            const l = await e.store();
            await Ro(e, String(n.mapID), { remove: true }), await l.deleteResource(ue(n.mapID)), await l.deleteSource(ue(n.mapID)), a = `Deleted: ${n.mapID}`;
          }
          break;
        case "cancel":
          a = c(n, ["mapID"]), e.job && d() ? (e.job.cancel = true, a = `Fetching process of ${e.job.label} is canceled`) : a = te("no-fetch-process", { mapID: n.mapID });
          break;
        case "stats":
          if (a = c(n, ["mapID"]), !a) {
            const l = await e.store(), u = await Ke(e, l, n.mapID);
            if (!u) a = te("map-not-found", { mapID: n.mapID });
            else {
              const m = await l.getResource(ue(n.mapID)), k = { count: m?.count ?? 0, size: m?.bytes ?? 0 };
              u.totalTile && (k.total = u.totalTile, k.percent = Math.floor(k.count / k.total * 100)), a = Nt(k);
            }
          }
          break;
        case "cache": {
          const l = o?.match(/^([^/]+)\/(\d+)\/(\d+)\/(\d+)$/);
          l ? a = await dl(
            e,
            l[1],
            parseInt(l[2]),
            parseInt(l[3]),
            parseInt(l[4]),
            r ? r.headers.get("range") : null
          ) : a = te("cache-path-invalid");
          break;
        }
        case "fetchAll":
          if (a = c(n, ["mapID"]), !a && i && s) {
            const l = await Ke(e, await e.store(), n.mapID);
            if (!l) a = te("map-not-found", { mapID: n.mapID });
            else if (!l.totalTile) a = te("cannot-fetch-all", { mapID: n.mapID });
            else if (e.job)
              a = te("fetch-busy", { mapID: e.job.label, count: e.job.count, total: e.job.total });
            else {
              const u = {
                sourceId: ue(n.mapID),
                label: String(n.mapID),
                total: l.totalTile || 0,
                count: 0,
                error: 0,
                failures: al(),
                cancel: false
              };
              e.job = u, s.waitUntil(ul(e, u, i, l)), a = `Fetching task start: ${n.mapID}`;
            }
          }
          break;
        default:
          a = te("api-not-found", { apiName: t });
      }
    } catch (l) {
      a = `Error: ${l}`;
    }
    if (a) return a;
  };
  var pl = async (e, { url: t, request: n, event: o }) => {
    const r = typeof FetchEvent < "u" && o instanceof FetchEvent ? o : void 0, s = r && r.clientId ? await self.clients.get(r.clientId) : void 0, i = t.pathname.match(/^\/api\/([\w\d]+)(?:\/(.+))?$/);
    if (i) {
      i[1] !== "ping" && i[1] !== "fetchAll" && e.maintain?.(o), i[1] !== "ping" && await qc(e, Pn);
      const a = [...t.searchParams.entries()].reduce((d, l) => {
        const u = t.searchParams.getAll(l[0]);
        return u.length === 1 ? d[l[0]] = u[0] : d[l[0]] = u, d;
      }, {});
      let c = await fl(e, i[1], a, i[2], n, r, s);
      if (c)
        return c instanceof Response || (c = new Response(c)), c;
    }
    return new Response("Not Found", { status: 404 });
  };
  var We = "https://api.mapbox.com";
  var wt = /^mapbox:\/\//i;
  var Ue = () => new $("unsupported-template", "mapbox:// URL has an unsupported form", {});
  var ml = (e) => e !== void 0 && e !== "";
  var hl = /^[\w-]+\.[\w.-]+$/;
  var is = (e) => {
    if (!wt.test(e)) return e;
    const t = e.replace(wt, ""), n = t.indexOf("?"), o = n < 0 ? t : t.slice(0, n), r = n < 0 ? "" : t.slice(n + 1), s = (d, l) => {
      const u = [l, r].filter((m) => m !== void 0 && m !== "");
      return u.length > 0 ? `${d}?${u.join("&")}` : d;
    }, i = o.split("/"), [a, ...c] = i;
    if (!c.every(ml)) throw Ue();
    switch (a) {
      case "styles":
        if (c.length === 2 || c.length === 3 && c[2] === "draft") return s(`${We}/styles/v1/${c.join("/")}`);
        throw Ue();
      case "sprites":
        if (c.length === 2 || c.length === 3) return s(`${We}/styles/v1/${c.join("/")}/sprite`);
        throw Ue();
      case "fonts":
        if (c.length === 3 && c[2].endsWith(".pbf") && c[2] !== ".pbf") return s(`${We}/fonts/v1/${c.join("/")}`);
        throw Ue();
      case "tiles":
        if (c.length === 4) return s(`${We}/v4/${c.join("/")}`);
        throw Ue();
      default: {
        if (i.length !== 1 || !a.split(",").every((l) => hl.test(l))) throw Ue();
        const d = r.split("&").indexOf("secure") >= 0 ? void 0 : "secure";
        return s(`${We}/v4/${a}.json`, d);
      }
    }
  };
  var yl = (e) => {
    let t;
    try {
      t = new URL(e.replace(/\{[^{}]*\}/g, "0"));
    } catch {
      return false;
    }
    if (t.protocol !== "https:") return false;
    const n = t.hostname.toLowerCase();
    return n === "api.mapbox.com" || /^[a-z0-9-]+\.tiles\.mapbox\.com$/.test(n);
  };
  var at = (e) => typeof e == "object" && e !== null && !Array.isArray(e);
  var Ge = (e) => {
    if (typeof e != "string" || !wt.test(e)) return e;
    try {
      return is(e);
    } catch {
      return e;
    }
  };
  var gl = (e) => {
    if (!at(e)) return e;
    const t = { ...e };
    if (at(e.sources)) {
      const n = /* @__PURE__ */ Object.create(null);
      for (const [o, r] of Object.entries(e.sources)) {
        if (!at(r)) {
          n[o] = r;
          continue;
        }
        const s = { ...r };
        "url" in r && (s.url = Ge(r.url)), Array.isArray(r.tiles) && (s.tiles = r.tiles.map(Ge)), n[o] = s;
      }
      t.sources = n;
    }
    return typeof e.sprite == "string" ? t.sprite = Ge(e.sprite) : Array.isArray(e.sprite) && (t.sprite = e.sprite.map((n) => at(n) && "url" in n ? { ...n, url: Ge(n.url) } : n)), "glyphs" in e && (t.glyphs = Ge(e.glyphs)), t;
  };
  var wl = () => new $("credential-rejected", "A secret token (sk.) is not accepted for the mapbox provider", { where: "credentials.query" });
  function bl(e) {
    return {
      id: "mapbox",
      matches: (t) => wt.test(t) || yl(t),
      resolve: is,
      applyCredentials: (t, n) => {
        n.query && e(t, n.query);
      },
      rewriteStyle: gl,
      validateCredentials: (t) => {
        for (const [n, o] of Object.entries(t.query ?? {}))
          if (n.toLowerCase() === "access_token" && /^\s*sk\./i.test(o)) throw wl();
      },
      credentialParams: ["access_token"]
    };
  }
  var vl = (e) => {
    const t = e.maintenance;
    if (t.running) return t.running;
    const n = Promise.resolve().then(async () => {
      t.swept || await dn(e), await ol(e, Pn);
    }).catch((o) => {
      console.error(o);
    }).finally(() => {
      t.running = void 0;
    });
    return t.running = n, n;
  };
  function Al(e) {
    const t = bl(sr), n = () => [...zs(), t], o = Cs({
      providers: n,
      acceptsMember: (i, a, c) => Br(i, a, c, n()),
      // SW のスクリプトの setUserAgent（ページの registerSW の指定が無いときに使う）
      userAgent: Ns
    });
    o.notify = yc(o), o.maintain = (i) => {
      typeof i?.waitUntil == "function" && i.waitUntil(vl(o));
    }, self.addEventListener("install", (i) => {
      i.waitUntil(self.skipWaiting());
    }), self.addEventListener("activate", (i) => {
      i.waitUntil(self.clients.claim());
    });
    const r = Mc(o);
    e(/^https?:\/\/weiwudi\.example\.com(?=[/?#]|$)/, async (i) => i.url.pathname.startsWith("/v2/") ? r.get(i) : pl(o, i), "GET"), e(/^https?:\/\/weiwudi\.example\.com\/v2\//, r.post, "POST"), ca(o, e, { pickCredentialSource: fa });
  }
  Al(registerRoute);

  // src/service-worker/index.ts
  skipWaiting();
  clientsClaim();
  precacheAndRoute(define_self_WB_MANIFEST_default, {});
  var RESOURCES_CACHE = "resourcesCache";
  var LEGACY_RESOURCES_CACHE_PATTERN = /^resourcesCache-(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})$/;
  var RESOURCE_MAX_AGE_SECONDS = 86400;
  function responseDate(response) {
    const dateHeader = response.headers.get("date");
    if (!dateHeader) return void 0;
    const timestamp = Date.parse(dateHeader);
    return Number.isNaN(timestamp) ? void 0 : timestamp;
  }
  function legacyCacheDate(cacheName) {
    const match = LEGACY_RESOURCES_CACHE_PATTERN.exec(cacheName);
    if (!match) return void 0;
    const [, year, month, day, hour, minute] = match;
    if (!year || !month || !day || !hour || !minute) return void 0;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    ).getTime();
  }
  function isResourceFresh(response, cacheDate) {
    const date = responseDate(response) ?? cacheDate;
    return date === void 0 || date >= Date.now() - RESOURCE_MAX_AGE_SECONDS * 1e3;
  }
  function isNewerCandidate(candidate, current) {
    if (current.cacheName === RESOURCES_CACHE && current.responseDate === void 0) {
      return false;
    }
    const candidateDate = candidate.responseDate ?? candidate.cacheDate;
    const currentDate = current.responseDate ?? current.cacheDate;
    if (candidateDate === void 0) return false;
    if (currentDate === void 0 || candidateDate > currentDate) return true;
    return candidateDate === currentDate && candidate.cacheName !== RESOURCES_CACHE && current.cacheName !== RESOURCES_CACHE && candidate.cacheDate !== void 0 && current.cacheDate !== void 0 && candidate.cacheDate > current.cacheDate;
  }
  var legacyCacheFallbackPlugin = {
    async cachedResponseWillBeUsed({ request, cachedResponse, state }) {
      if (cachedResponse && isResourceFresh(cachedResponse)) {
        return cachedResponse;
      }
      const legacyCacheNames = (await caches.keys()).filter((cacheName) => LEGACY_RESOURCES_CACHE_PATTERN.test(cacheName)).sort().reverse();
      const found = await Promise.all(
        legacyCacheNames.map(async (cacheName) => {
          const cacheDate = legacyCacheDate(cacheName);
          const cache = await caches.open(cacheName);
          const response = await cache.match(request);
          return response && isResourceFresh(response, cacheDate) ? {
            cacheName,
            response,
            responseDate: responseDate(response),
            cacheDate
          } : void 0;
        })
      );
      let selected;
      for (const candidate of found) {
        if (candidate && (!selected || isNewerCandidate(candidate, selected))) {
          selected = candidate;
        }
      }
      if (!selected) return null;
      if (selected.cacheName !== RESOURCES_CACHE) {
        const legacyCopy = {
          request,
          entry: { ...selected, response: selected.response.clone() }
        };
        state.legacyCopy = legacyCopy;
      }
      return selected.response;
    },
    async handlerDidComplete({ state }) {
      const legacyCopy = state.legacyCopy;
      if (!legacyCopy) return;
      try {
        const resourcesCache = await caches.open(RESOURCES_CACHE);
        const existing = await resourcesCache.match(legacyCopy.request);
        const current = existing ? {
          cacheName: RESOURCES_CACHE,
          response: existing,
          responseDate: responseDate(existing)
        } : void 0;
        if (!current || isNewerCandidate(legacyCopy.entry, current)) {
          await resourcesCache.put(legacyCopy.request, legacyCopy.entry.response);
        }
      } catch {
      }
    }
  };
  registerRoute(
    /(?:maps\/.+\.json|pwa\/.+|pois\/.+\.json|apps\/.+\.json|tmbs\/.+\.jpg|images\/.+\.(?:png|jpg))$/,
    new StaleWhileRevalidate({
      cacheName: RESOURCES_CACHE,
      plugins: [
        legacyCacheFallbackPlugin,
        new ExpirationPlugin({
          maxAgeSeconds: RESOURCE_MAX_AGE_SECONDS,
          purgeOnQuotaError: false
        })
      ]
    }),
    "GET"
  );
})();
