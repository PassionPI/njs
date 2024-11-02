function bufferToString(buffer) {
  return new TextDecoder().decode(buffer);
}
function stringToBuffer(string) {
  return new TextEncoder().encode(string).buffer;
}
function bufferToBase64(buffer) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
}
function base64ToBuffer(base64) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;
}
function stringToBase64(string) {
  return bufferToBase64(stringToBuffer(string));
}
function base64ToString(base64) {
  return bufferToString(base64ToBuffer(base64));
}

function stringToJson(string) {
  try {
    return JSON.parse(string);
  } catch (_) {
    return null;
  }
}

export default {
  stringToBuffer,
  stringToBase64,
  stringToJson,

  bufferToString,
  bufferToBase64,

  base64ToBuffer,
  base64ToString,
};
