import io from "../util/io.js";
import p from "../util/parse.js";

const fs = require("fs");
const DIR_PATH = "/etc/nginx/script/private";
const PUB_PATH = `${DIR_PATH}/rsa.pub`;
const PRI_PATH = `${DIR_PATH}/rsa.key`;

function pemToBuf(pem, type) {
  const pemJoined = pem.toString().split("\n").join("");
  const pemHeader = `-----BEGIN ${type} KEY-----`;
  const pemFooter = `-----END ${type} KEY-----`;
  const pemContents = pemJoined.slice(
    pemHeader.length,
    pemJoined.length - pemFooter.length
  );
  return p.base64ToBuffer(pemContents);
}

function getSpki() {
  return crypto.subtle.importKey(
    "spki",
    pemToBuf(fs.readFileSync(PUB_PATH), "PUBLIC"),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );
}

function getPkcs8() {
  return crypto.subtle.importKey(
    "pkcs8",
    pemToBuf(fs.readFileSync(PRI_PATH), "PRIVATE"),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"]
  );
}

async function rsaEncrypt(text) {
  const spki = await getSpki();
  return crypto.subtle.encrypt({ name: "RSA-OAEP" }, spki, text);
}

async function rsaDecrypt(text) {
  const pkcs8 = await getPkcs8();
  return crypto.subtle.decrypt({ name: "RSA-OAEP" }, pkcs8, text);
}

async function handler(r) {
  try {
    if (r.method == "POST") {
      const txt = io.inArgsGet(r, "txt");
      const x = await rsaEncrypt(txt);
      io.outText(r, p.bufferToBase64(x));
      // io.outText(r, x);
      return;
    }

    if (r.method == "PUT") {
      const txt = io.inText(r);
      // const x = await rsaDecrypt(p.stringToBuffer(txt));
      const x = await rsaDecrypt(p.base64ToBuffer(txt));
      io.outText(r, x);
      return;
    }
  } catch (e) {
    io.outBad(r, e.message);
  }
}

export default { handler: io.h(handler) };
