let gID = '';

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
        context: sToken,
        type: 'GET',
        contentType: 'json',
        url: `${common.getUrl()}/forgot/${sToken}`,
      }).always(onEndVerify);
    }
  }
});

function sendForgot() {
  let $form = $('#mainform'),
    $inputs = $form.find('input'),
    oJson = {};

  $inputs.each((_, oEl) => {
    let $el = $(oEl);

    oJson[$el.prop('name')] = $el.val();
  });

  $.ajax({
    headers: common.headers,
    type: 'PATCH',
    url: `${common.getUrl()}/forgot/${gID}`,
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify(oJson),
  }).always(onEndChangeForgot);

  $form.get(0).reset();

  return false;
}

function onEndChangeForgot(oResponse, sStatus) {
  let $form = $('#mainform'),
    $parent = $form.closest('.col'),
    sHTML = '';

  $parent.find('.alert').remove();
  if (sStatus !== 'success') {
    let oJSON = oResponse.responseJSON;

    if (oJSON) {
      sHTML = `<div class="alert alert-danger" role="alert">${oJSON.message}</div>`;
      $parent.prepend(sHTML);
    }
  } else {
    sHTML = '<div class="alert alert-success" role="alert">Tu contraseña se ha cambiado correctamente!</div>';
    $form.find('input,button').prop('disabled', true);
    $parent.prepend(sHTML);
  }
}

function onEndVerify(oResponse, sStatus) {
  let $form = $('#mainform'),
    $parent = $form.closest('.col'),
    sHTML = '';

  $parent.find('.alert').remove();
  if (sStatus !== 'success') {
    let oJSON = oResponse.responseJSON;

    if (oJSON) {
      sHTML = `<div class="alert alert-danger" role="alert">${oJSON.message}</div>`;
      $form.find('input,button').prop('disabled', true);
      $parent.prepend(sHTML);
    }
  } else {
    gID = this;
  }
}
