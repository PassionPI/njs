import CONST from "../const.js";
import io from "../util/io.js";
import parse from "../util/parse.js";

const fs = require("fs");

const ALGO = {
  name: "RSA-OAEP",
};
const ALGO_CONF = {
  name: "RSA-OAEP",
  hash: "SHA-256",
};

function pemToBuf(pem, type) {
  const pemJoined = pem.toString().split("\n").join("");
  const pemHeader = `-----BEGIN ${type} KEY-----`;
  const pemFooter = `-----END ${type} KEY-----`;
  const pemContents = pemJoined.slice(
    pemHeader.length,
    pemJoined.length - pemFooter.length
  );
  return parse.base64ToBuffer(pemContents);
}

function getSpki() {
  return crypto.subtle.importKey(
    "spki",
    pemToBuf(fs.readFileSync(CONST.PUB_PATH), "PUBLIC"),
    ALGO_CONF,
    false,
    ["encrypt"]
  );
}

function getPkcs8() {
  return crypto.subtle.importKey(
    "pkcs8",
    pemToBuf(fs.readFileSync(CONST.PRI_PATH), "PRIVATE"),
    ALGO_CONF,
    false,
    ["decrypt"]
  );
}

async function rsaEncrypt(text) {
  const spki = await getSpki();
  return crypto.subtle.encrypt(ALGO, spki, text);
}

async function rsaDecrypt(text) {
  const pkcs8 = await getPkcs8();
  return crypto.subtle.decrypt(ALGO, pkcs8, text);
}

async function encrypt(r) {
  const txt = io.inText(r);
  const x = await rsaEncrypt(txt);
  io.outText(r, parse.bufferToBase64(x));
}

async function decrypt(r) {
  const txt = parse.base64ToBuffer(io.inText(r));
  const x = await rsaDecrypt(txt);
  io.outText(r, x);
}

function pub(r) {
  io.outText(r, fs.readFileSync(CONST.PUB_PATH));
}

export default {
  encrypt: io.h(encrypt),
  decrypt: io.h(decrypt),
  pub: io.h(pub),
};
