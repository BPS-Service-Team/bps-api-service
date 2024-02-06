jQuery(document).ready(($) => {
  let sLocation = document.location.href,
    aSplit = sLocation.split('?');

  if (aSplit.length > 1) {
    let aParams = aSplit[1].split('='),
      sToken = '';

    if (aParams.length > 1) {
      sToken = aParams[1];

      $.ajax({
        headers: common.headers,
        type: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        url: `${common.getUrl()}/verify`,
        data: JSON.stringify({
          token: sToken,
        }),
      }).always(onEndVerify);
    }
  }
});

function onEndVerify(_, sStatus) {
  let $alert = sStatus === 'success' ? $('#msg-success') : $('#msg-error');

  if ($alert.length) {
    $alert.fadeIn('fast');
  }
}
