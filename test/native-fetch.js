const path = require('node:path');

// like `request`, infer the content type of uploaded files from their extension
const MIME_TYPES = {
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  setCookie(cookie) {
    const [nameValue] = cookie.split(';');
    const separator = nameValue.indexOf('=');
    if (separator === -1) return;
    this.cookies.set(
      nameValue.slice(0, separator).trim(),
      nameValue.slice(separator + 1).trim(),
    );
  }

  getCookieString() {
    return [...this.cookies]
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }
}

function appendFormValue(params, key, value) {
  if (value === undefined) return;
  if (value === null) {
    params.append(key, '');
  } else if (Array.isArray(value)) {
    value.forEach((item, index) =>
      appendFormValue(params, `${key}[${index}]`, item),
    );
  } else if (typeof value === 'object') {
    Object.entries(value).forEach(([childKey, childValue]) =>
      appendFormValue(params, `${key}[${childKey}]`, childValue),
    );
  } else {
    params.append(key, String(value));
  }
}

async function makeFormData(formData) {
  const data = new FormData();
  const files = await Promise.all(
    Object.entries(formData).map(async ([key, stream]) => {
      const filename = path.basename(stream.path || key);
      const type = MIME_TYPES[path.extname(filename).toLowerCase()] || '';
      return { key, filename, blob: await new Response(stream).blob(), type };
    }),
  );
  for (const { key, filename, blob, type } of files) {
    data.append(key, new Blob([blob], { type }), filename);
  }
  return data;
}

async function fetchWithJar(url, options = {}) {
  const { jar, form, json, formData, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);
  const cookies = jar instanceof CookieJar ? jar.getCookieString() : '';
  if (cookies) headers.set('cookie', cookies);

  if (form && !['GET', 'HEAD'].includes(fetchOptions.method)) {
    const params = new URLSearchParams();
    Object.entries(form).forEach(([key, value]) =>
      appendFormValue(params, key, value),
    );
    fetchOptions.body = params;
  } else if (formData) {
    fetchOptions.body = await makeFormData(formData);
  } else if (json && typeof fetchOptions.body !== 'string') {
    fetchOptions.body = JSON.stringify(fetchOptions.body);
    headers.set('content-type', 'application/json');
  }

  fetchOptions.headers = headers;
  // like `request`, only follow redirects automatically for GET/HEAD requests
  const followRedirects = ['GET', 'HEAD', undefined].includes(
    fetchOptions.method,
  );
  fetchOptions.redirect ??= followRedirects ? 'follow' : 'manual';
  const response = await globalThis.fetch(url, fetchOptions);
  if (jar instanceof CookieJar) {
    for (const cookie of response.headers.getSetCookie()) jar.setCookie(cookie);
  }
  return response;
}

async function fetchText(url, options = {}) {
  const response = await fetchWithJar(url, options);
  return { response, body: await response.text() };
}

function cookieJar() {
  return new CookieJar();
}

module.exports = { CookieJar, fetchWithJar, fetchText, cookieJar };
