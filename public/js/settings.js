/* global $ */

$(function () {
  const globals = window;

  $('#tabSelector a').click(function () {
    $('#tabSelector a.selected').removeClass('selected');
    $(this).addClass('selected');
    $('.tabContent').hide();
    $('.tabContent#' + $(this).attr('href').split('#').pop()).show();
  });

  function backtonormal() {
    $('.fld').removeClass('error').removeClass('ok');
    $('.msg').hide();
  }

  function submitChange(data, cb) {
    console.log('submitting', data);
    $.ajax({
      type: 'POST',
      url: '/api/user',
      data: data,
      success: cb,
      error: function (e) {
        cb && cb({ error: e });
      },
    });
  }

  function submitFieldChange(data, $field, cb) {
    const $btn = $field
      .closest('form')
      .find('input[type=submit]')
      .addClass('loading');
    submitChange(data, function (res = {}) {
      $btn.removeClass('loading');
      console.log('res', res);
      if (res.error)
        $field
          .find('.msg')
          .first()
          .text(
            res.error && typeof res.error == 'string'
              ? res.error
              : 'An unknown error occured, please try again',
          )
          .show();
      cb && cb(res);
    });
  }

  // == "account" tab ==

  const $handle = $('input[name=handle]');
  const $email = $('input[name=email]');

  $('input[data-checked=true]').each(function () {
    $(this).attr('checked', 'checked');
  });

  function onDeleteConfirm() {
    $.post('/api/user', { action: 'delete' }, function (response) {
      console.log('response', response);
      globals.avgrundClose();
      globals.showMessage(response);
      setTimeout(() => {
        window.location.href = '/logout';
      }, 2000);
    });
  }

  $('#deleteAccount').click(function (e) {
    e.preventDefault();
    const $html = $(
      '<div>' +
        '<img src="/images/fun-y_u_no_use_whyd.jpg" style="float:left;margin:15px;">' +
        '<span style="line-height:30px;">Are you sure?</span><br>' +
        '<span style="font-weight:normal;">If you have a question or problem,<br>we\'re happy to help at contact@openwhyd.org.</span>' +
        '</div><span class="redButton">Delete my account</span>',
    );
    $html.last().click(function () {
      $html
        .find('span')
        .eq(1)
        .css('color', 'red')
        .text('Your profile and playlists will be deleted permanently!');
      $html
        .last()
        .text('Delete my data now!')
        .unbind('click')
        .click(onDeleteConfirm);
    });
    globals.openJqueryDialog(
      $html,
      'dlgDeletePost',
      'Delete your openwhyd account',
    );
  });

  function validateUsername() {
    $handle.parent().find('.msg').hide();
    let val = $handle.val();
    val = val.toLowerCase();
    try {
      val = val.trim();
    } catch (e) {
      console.error(e);
    }
    $handle.val(val);
    if (val == '') return 0;
    const valid = /^[a-z0-9]+[a-z0-9_\-.]+[a-z0-9]+$/i.test(val);
    if (valid) $('#url > span').text(val);
    return valid ? 1 : -1;
  }

  validateUsername();

  $handle.bind('keydown keypress change', function () {
    setTimeout(function () {
      /*var valid =*/ validateUsername();
      $handle
        .parent()
        .toggleClass('ok', false) //valid == 1)
        .toggleClass('error', false); //valid == -1);
    }, 50);
  });

  function submitHandle(cb) {
    const handle = $handle.val();
    if (handle)
      submitFieldChange({ handle: handle }, $handle.parent(), function (res) {
        const ok = handle == res.handle;
        $handle.parent().toggleClass(ok ? 'ok' : 'error');
        if (res.handle) $handle.val(res.handle);
        cb && cb(ok);
      });
    else cb && cb();
  }

  function submitEmail(cb) {
    const email = $email.val();
    submitFieldChange({ email: email }, $email.parent(), function (res) {
      const ok = email == res.email;
      $email.parent().toggleClass(ok ? 'ok' : 'error');
      if (res.email) $email.val(res.email);
      cb && cb(ok);
    });
  }

  function submitPref(cb) {
    const pref = {};
    const $pref = $('#pref');
    $pref.find('input').each(function () {
      pref[$(this).attr('name')] = $(this).attr('checked') ? 1 : 0;
    });
    console.log('pref', pref);
    submitFieldChange({ pref: pref }, $pref, function (res) {
      const ok = res && res.pref;
      $pref.toggleClass(ok ? 'ok' : 'error');
      if (res && res.pref && globals.user) globals.user.pref = res.pref;
      cb && cb(ok);
    });
  }

  $('#tabAccount form').submit(function (event) {
    event.preventDefault();
    backtonormal();
    validateUsername();
    const accountSteps = [submitHandle, submitEmail, submitPref];
    let allOk = true;
    (function next(ok) {
      allOk = allOk && ok;
      const step = accountSteps.shift();
      if (step) step(next);
      else
        globals.showMessage(
          allOk
            ? 'Your changes were successfully applied'
            : 'Please fix your settings and try again',
          !allOk,
        );
    })(true);
  });

  const $fbConn = $('#fbConn').addClass('loading');
  globals.whenFbReady(function () {
    function toggleFbPrefs(connected) {
      $fbConn
        .toggle(!connected)
        .removeClass('loading')
        .unbind()
        .click(fbConnect);
      $('#pref').toggle(connected);
    }
    function fbConnect() {
      $fbConn
        .addClass('loading')
        .unbind()
        .click(function (e) {
          e.preventDefault();
          globals.showMessage('Still loading, please wait...');
        });
      globals.fbAuth('', toggleFbPrefs);
    }
    globals.fbIsLogged(toggleFbPrefs);
  });

  // lastfm
  (function () {
    const $lastFmConn = $('#lastFmConn');
    const $lastFmPref = $('#lastFmPref');
    let href = window.location.href;
    href = href.substr(0, href.indexOf('/', 10)) + '/api/lastFm';
    href = $lastFmConn.attr('href') + '&cb=' + encodeURIComponent(href);
    $lastFmConn.attr('href', href);
    $('#lastFmDcon').attr('href', href);

    function toggleLastFmConnection(connected) {
      $lastFmConn
        .toggle(!connected)
        .removeClass('loading')
        .unbind()
        .click(lastFmConn);
      $lastFmPref.toggle(!!connected);
      if (connected && globals.user.lastFm)
        $('#lastFmProfile')
          .text(globals.user.lastFm.name)
          .attr('href', 'http://lastfm.com/user/' + globals.user.lastFm.name);
    }

    function lastFmConn(e) {
      e.preventDefault();
      $lastFmConn
        .addClass('loading')
        .unbind()
        .click(function (e) {
          e.preventDefault();
          globals.showMessage('Still loading, please wait...');
        });
      const popup = window.open(
        href,
        'whyd_lastFmConn',
        'height=600,width=800,location=no,menubar=no,resizable=no,scrollbars=no,toolbar=no',
      );
      popup.focus();
      globals.lastFmCallback = function (session) {
        console.log(session, typeof session);
        if (session && session.sk && session.name) {
          globals.user.lastFm = session;
          toggleLastFmConnection(true);
        } else {
          delete globals.user.lastFm;
          toggleLastFmConnection(false);
        }
        popup.close();
      };
    }

    $lastFmConn.click(lastFmConn);

    toggleLastFmConnection(
      globals.user.lastFm && globals.user.lastFm.name && globals.user.lastFm.sk,
    );
  })();

  // DEEZER CONNECTION
  (function () {
    const $deezerConBtn = $('#deezerProfile');

    const SDK_URL = 'https://cdns-files.deezer.com/js/min/dz.js';
    let IS_LOGGED = false,
      IS_READY = false;

    // setup DOM unless existing
    if (!document.getElementById('dz-root')) {
      const dz = document.createElement('div');
      dz.id = 'dz-root';
      document.getElementsByTagName('body')[0].appendChild(dz);
    }

    // load DZ SDK INTO SCOPE
    globals.loader.includeJS(SDK_URL, function () {
      IS_READY = true;
    });

    function init() {
      $deezerConBtn.unbind();
      $deezerConBtn.on('click', loadPopup);
    }

    function loadPopup(event) {
      event.preventDefault();
      initAuth();
      auth();
      IS_LOGGED = false; // resets to original state
    }

    // initialize the oAuth client and triggers user's login popup
    function initAuth() {
      if (IS_READY == false) {
        globals.showMessage(
          'Something went wrong.. Please try again, reload your page.',
          IS_LOGGED,
        );
      } else {
        globals.DZ.init({
          appId: globals.DEEZER_APP_ID,
          channelUrl: globals.DEEZER_CHANNEL_URL,
        });

        globals.DZ.getLoginStatus(function (response) {
          if (response.authResponse) {
            IS_LOGGED = true;
            globals.showMessage(
              'You are already logged into your Deezer account.',
              !IS_LOGGED,
            );
          }
        });
      }
    }

    function auth() {
      if (IS_LOGGED == false) {
        globals.DZ.login(
          function (response) {
            if (response.userID) {
              IS_LOGGED = true;
              globals.showMessage(
                'Login successful. Your Deezer tracks will be full length from now on!',
                !IS_LOGGED,
              );
            } else {
              globals.showMessage(
                'We could not establish a connection to a Deezer Account, please try again.',
                IS_LOGGED,
              );
            }
          },
          { perms: 'email' },
        );
      }
    }

    init();
  })();

  // == "password" tab ==

  //var pwdRegex = /^[a-zA-Z0-9!@#$%^&*]{4,32}$/; // http://stackoverflow.com/questions/5822413/password-validation-javascript
  const $old = $('input[name=old]');
  const $new1 = $('input[name=new1]');
  const $new2 = $('input[name=new2]');

  var $pwdForm = $('#tabPassword form').submit(function (e) {
    e.preventDefault();
    backtonormal();
    if (
      /*!pwdRegex.test($old.val())*/ $old.val().length < 4 ||
      $old.val().length > 32
    )
      $old
        .parent()
        .addClass('error')
        .find('.msg')
        .text('Please enter your current password')
        .show();
    else if ($new1.val().length < 4 || $new1.val().length > 32)
      $new1
        .parent()
        .addClass('error')
        .find('.msg')
        .text('Your new password must be between 4 and 32 characters')
        .show();
    /*else if (!pwdRegex.test($new1.val()))
			$new1.parent().addClass("error")
				.find(".msg").text("Your new password contains invalid characters").show();*/ else if (
      $new1.val() != $new2.val()
    )
      $('.pwdRepeat')
        .addClass('error')
        .find('.msg')
        .first()
        .text('You must enter the same new password twice')
        .show();
    else {
      submitFieldChange(
        { pwd: $new1.val(), oldPwd: $old.val() },
        $pwdForm,
        function (res) {
          $pwdForm.find('.fld').toggleClass(!res.error ? 'ok' : 'error');
          globals.showMessage(
            res.error || 'Your password was successfully set',
            !!res.error,
          );
        },
      );
      /*
			$(this).closest("input[type=submit]").addClass("loading");
			$.ajax({
				type: "GET",
				url: "/api/user",
				data: {pwd:$new1.val(), oldPwd:$old.val()},
				complete: function(data) {
					console.log(data);
					if ("" + data.responseText != "null") {
						var p = $tabPwd.find("p");
						var backup = $tabPwd.css("background");
						$p.css("background", "#a9da92").text("Your password is up to date :-)").show();
						setTimeout(function() {
							$.modal.close();
							$tabPwd.find(".btnSave").removeClass("loading");
							$p.css("background", backup);
						}, 2000);
					}
					else {
						$btnSave.removeClass("loading");
						$old.addClass("inputError");
						$p.text("Unable to update. Check your current password.").show();
					}
				}
			});
			*/
    }
    return false;
  });

  // == "notifications" tab ==

  $('#tabNotif input[data-checked]').each(function () {
    const freq = $(this).attr('data-checked');
    if (freq != '-1') {
      $(this).attr('checked', 'checked');
      $('input[name=emFreq][value=' + freq + ']').attr('checked', 'checked');
    }
  });
  /*
	$("div[data-value]").each(function() {
		var $prefDiv = $(this);
		var val = $prefDiv.attr("data-value");
		$(this).find("input[value="+val+"]").attr("checked", "checked");
	});
	*/
  $('#tabNotif form').submit(function (event) {
    event.preventDefault();
    backtonormal();
    const pref = {};
    const $pref = $('#tabNotif');
    /*
		$pref.find("input:radio:checked").each(function() {
			pref[this.name] = this.value;
		});
		*/
    const freq = $pref.find('input:radio:checked').val();

    $pref.find('input').each(function () {
      pref[$(this).attr('name')] = $(this).attr('checked') ? freq : -1;
    });
    console.log('pref', pref);

    submitFieldChange({ pref: pref }, $pref, function (res) {
      const ok = res && res.pref;
      $pref.toggleClass(ok ? 'ok' : 'error');
      if (ok && globals.user) globals.user.pref = res.pref;
      globals.showMessage(
        ok
          ? 'Your changes were successfully applied'
          : 'Oops, something went wrong! Please try again',
        !ok,
      );
    });
  });
});
