function stringToBase64(string) {
  return bufferToBase64(stringToBuffer(string));
}
function stringToBase64url(string) {
  return bufferToBase64url(stringToBuffer(string));
}
function stringToBuffer(string) {
  return new TextEncoder().encode(string).buffer;
}
function stringToJson(string) {
  try {
    return JSON.parse(string);
  } catch (_) {
    return null;
  }
}

function bufferToString(buffer) {
  return new TextDecoder().decode(buffer);
}
function bufferToBase64(buffer) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
}
function bufferToBase64url(buffer) {
  return base64ToBase64url(bufferToBase64(buffer));
}

function base64ToBuffer(base64) {
  return Uint8Array.from(atob(base64 || ""), (c) => c.charCodeAt(0)).buffer;
}
function base64ToString(base64) {
  return bufferToString(base64ToBuffer(base64));
}
function base64ToBase64url(base64) {
  return base64.replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64urlToBuffer(base64url) {
  return base64ToBuffer(base64urlToBase64(base64url));
}
function base64urlToString(base64url) {
  return base64ToString(base64urlToBase64(base64url));
}
function base64urlToBase64(base64url) {
  return base64url.replace(/-/g, "+").replace(/_/g, "/");
}
function base64DataUrlToBlob(base64DataUrl) {
  const url = base64DataUrl || "";
  const split = url.split(",");
  const header = split[0] || "";
  const base64 = split[1] || "";
  const buffer = base64ToBuffer(base64);
  const mime = header.slice(5).split(";")[0];
  return new Blob([buffer], { type: mime });
}

export default {
  stringToJson,
  stringToBuffer,
  stringToBase64,
  stringToBase64url,

  bufferToString,
  bufferToBase64,
  bufferToBase64url,

  base64ToBuffer,
  base64ToString,
  base64ToBase64url,

  base64urlToBuffer,
  base64urlToString,
  base64urlToBase64,
  base64DataUrlToBlob,
};
