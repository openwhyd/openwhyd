/**
 * consent controller
 * for gdpr
 * @author adrienjoly, openwhyd
 */

const fs = require('fs');
const snip = require('../snip.js');
const mongodb = require('../models/mongodb.js');
const userModel = require('../models/user.js');
const mainTemplate = require('../templates/mainTemplate.js');

const filePerLang = {
  en: 'config/gdpr-consent-en.md',
  fr: 'config/gdpr-consent-fr.md',
};

function removeEmptyLine(mdLine) {
  return mdLine.length;
}

function renderMarkdownLine(mdLine) {
  return ('<p>' + snip.htmlEntities(mdLine) + '</p>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<i>$1</i>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(
      /^<p>- \[ \] (.*)/g,
      '<div class="consent-box"><input class="checkbox" type="checkbox"><p>$1</div>',
    )
    .replace(/^<p>- (.*)/g, '<li>$1</li>')
    .replace(/^<p>#+ (.*)/g, '<h1>$1</h1>')
    .replace(/<\/(li|h1)><\/p>$/, '</$1>');
}

const promisedTemplatePerLang = Object.entries(filePerLang).reduce(
  (acc, [langId, langTemplate]) => {
    const promisedHtml = fs.promises
      .readFile(langTemplate, { encoding: 'utf8' })
      .then((res) =>
        res
          .toString()
          .split('\n')
          .filter(removeEmptyLine)
          .map(renderMarkdownLine)
          .join('\n'),
      );
    return {
      ...acc,
      [langId]: promisedHtml,
    };
  },
  {},
);

async function renderPageContent(params) {
  const safeRedirect = snip.sanitizeJsStringInHtml(params.redirect || '/');
  // credits: flag icons by Freepik, https://www.flaticon.com/packs/countrys-flags
  return [
    '<div class="container" id="consent-container" data-lang="lang-en">',
    '  <div class="language-flags">',
    '    <img alt="English / Anglais" id="lang-en" src="/images/lang-en.svg">',
    '    <img alt="French / Français" id="lang-fr" src="/images/lang-fr.svg">',
    '  </div>',
    '  <form class="whitePanel lang-en" action="/consent" method="POST">',
    await promisedTemplatePerLang.en,
    '    <input type="hidden" name="lang" value="en">',
    '    <input type="hidden" name="redirect" value="' + safeRedirect + '">',
    '    <input disabled class="consent-submit" type="submit">',
    '  </form>',
    '  <form class="whitePanel lang-fr" action="/consent" method="POST">',
    await promisedTemplatePerLang.fr,
    '    <input type="hidden" name="lang" value="fr">',
    '    <input type="hidden" name="redirect" value="' + safeRedirect + '">',
    '    <input disabled class="consent-submit" type="submit">',
    '  </form>',
    '</div>',
    '<script>',
    '  function changeLang(event) {',
    '    document.getElementById("consent-container").setAttribute("data-lang", event.currentTarget.id);',
    '  }',
    '  document.getElementById("lang-en").onclick = changeLang;',
    '  document.getElementById("lang-fr").onclick = changeLang;',
    '  function toggleConsent(event) {',
    '    var checked = event.currentTarget.checked;',
    '    document.getElementById("consent-container").setAttribute("data-checked", checked);',
    '    document.getElementsByClassName("consent-submit")[0].disabled = !checked;',
    '    document.getElementsByClassName("consent-submit")[1].disabled = !checked;',
    '    document.getElementsByClassName("checkbox")[0].checked = checked;',
    '    document.getElementsByClassName("checkbox")[1].checked = checked;',
    '  }',
    '  document.getElementsByClassName("checkbox")[0].onchange = toggleConsent;',
    '  document.getElementsByClassName("checkbox")[1].onchange = toggleConsent;',
    '</script>',
  ].join('\n');
}

exports.controller = async function (request, getParams, response) {
  const isPost = request.method.toLowerCase() === 'post';
  const p = (isPost ? request.body : getParams) || {};
  request.logToConsole('consent.controller ' + request.method, p);
  // make sure user is logged in
  if (!(p.loggedUser = await request.checkLogin(response))) return;

  function render(r) {
    // content or error
    if (!r || r.error) {
      r = r || {};
      console.trace('in consent.render:', r.error);
    } else if (r.content) {
      r.html = mainTemplate.renderWhydPage(r);
    }
    // call the adequate renderer
    if (r.redirect) response.safeRedirect(r.redirect);
    else if (r.html) response.renderHTML(r.html);
    else response.renderJSON(r);
  }

  if (isPost) {
    userModel.updateAndFetch(
      { _id: mongodb.ObjectId('' + p.loggedUser.id) },
      {
        $set: {
          'consent.lang': p.lang,
        },
        $currentDate: {
          'consent.date': true, // => mongodb will store a ISODate in consent.date
        },
      },
      null,
      function onDone(err, user) {
        if (user && user.consent)
          console.log(
            'user id',
            p.loggedUser.id,
            'consented to gdpr notice =>',
            user.consent,
          );
        render(err ? { error: err } : p); // should redirect to p.redirect, or display error
      },
    );
  } else {
    (p.css = p.css || []).push('consent.css');
    p.bodyClass = 'pgConsent';
    p.content = await renderPageContent(p);
    p.redirect = ''; // to avoid redirection loops
    render(p);
  }
};
