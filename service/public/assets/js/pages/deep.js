// Validation
let validate = function validate(options) {
  if (typeof options.appScheme === 'undefined') {
    throw Error('appScheme is a required param value.');
  }
};

let DeepLink = function DeepLink(configs) {
  let _this = this;

  this.configs = {};

  this.register = function (el, options) {
    validate(options);
    jQuery(el).on('click', function (event) {
      if (event) {
        event.preventDefault();
      }

      if (options.openOnlyStore === true) {
        _this.openStore();
      } else {
        _this.openApp(options);
      }
    });
  };

  this.openApp = function (params) {
    validate(params);
    let options = Object.assign(
        {
          openStoreWhenNoInstalledTheApp: true,
          alsoUseWebUrlOnMobile: true,
        },
        params
      ),
      ua = navigator.userAgent.toLowerCase(),
      isIPhone = /iphone|ipad|ipod/.test(ua),
      isAndroid = !!~ua.indexOf('android'),
      isMobile = isIPhone || isAndroid;

    // on Desktop
    if (isMobile === false) {
      document.location.href = options.webUrl;
      return;
    }

    // on Mobile
    if (options.openStoreWhenNoInstalledTheApp === true) {
      let interval, timer,
        clearTimers = function clearTimers() {
          clearInterval(interval);
          clearTimeout(timer);
        };

      let checkAppInterval = function checkAppInterval() {
        if (document.webkitHidden || document.hidden) {
          clearTimers();
        }
      };

      interval = setInterval(checkAppInterval, 200);
      timer = setTimeout(function () {
        return _this.openStore();
      }, 1000);
    }

    if (isAndroid === true) {
      window.location.href = options.appScheme;
    } else {
      document.location.href = options.appScheme;
    }

    if (options.alsoUseWebUrlOnMobile === false) {
      return;
    }

    if (options.openStoreWhenNoInstalledTheApp === true) {
      setTimeout(function () {
        document.location.href = options.webUrl;
        return;
      }, 2200);
    } else {
      document.location.href = options.webUrl;
    }
  };

  this.openStore = function () {
    let ua = navigator.userAgent.toLowerCase(),
      isIPhone = /iphone|ipad|ipod/.test(ua),
      appStoreLink = isIPhone ? _this.configs.appStore : _this.configs.playStore;

    document.location.href = appStoreLink;
  };

  this.configs = configs;
};

jQuery(document).ready(($) => {
  let oQuery = common.getQueryParams(document.location.search),
    deepLink = new DeepLink({
      appStore: oQuery.apple,
      playStore: oQuery.play,
    });

  deepLink.openApp({
    appScheme: `${oQuery.schema}${oQuery.app}/${oQuery.token}`,
    webUrl: `${oQuery.site}/${oQuery.page}?q=${oQuery.token}`,
  });
});
