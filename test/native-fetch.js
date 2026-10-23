const path = require('path');

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
    return [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; ');
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

async function fetchWithJar(url, options = {}) {
  const { jar, form, json, formData, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);
  if (jar?.getCookieString()) headers.set('cookie', jar.getCookieString(url));

  if (form && !['GET', 'HEAD'].includes(fetchOptions.method)) {
    const params = new URLSearchParams();
    Object.entries(form).forEach(([key, value]) =>
      appendFormValue(params, key, value),
    );
    fetchOptions.body = params;
  } else if (formData) {
    const data = new FormData();
    for (const [key, stream] of Object.entries(formData)) {
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      data.append(
        key,
        new Blob(chunks),
        path.basename(stream.path || key),
      );
    }
    fetchOptions.body = data;
  } else if (json && typeof fetchOptions.body !== 'string') {
    fetchOptions.body = JSON.stringify(fetchOptions.body);
    headers.set('content-type', 'application/json');
  }

  fetchOptions.headers = headers;
  const response = await globalThis.fetch(url, fetchOptions);
  if (jar) {
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

module.exports = { fetchWithJar, fetchText, cookieJar };
