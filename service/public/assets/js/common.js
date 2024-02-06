const common = (() => {
  return {
    headers: {
      'x-api-key': 'wRzxBrCa38EQ0SlDpLiA1T60NrAvq+kaPrteTFzzhqk=',
    },

    getUrl: () => document.location.href.substr(0, document.location.href.lastIndexOf('/')),

    getQueryParams: (sQuery) => {
      sQuery = sQuery.split('+').join(' ');
      let oData = {}, tokens, oRegex = /[?&]?([^=]+)=([^&]*)/g;

      while ((tokens = oRegex.exec(sQuery))) {
        oData[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
      }

      return oData;
    },
  };
})();
