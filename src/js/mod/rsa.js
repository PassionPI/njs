import fs from "fs";
import CONST from "../const.js";
import io from "../util/io.js";
import parse from "../util/parse.js";

const ALGO = {
  name: "RSA-OAEP",
  hash: "SHA-256",
};

function pemToBuf(pem, type) {
  return parse.base64ToBuffer(
    pem
      .toString()
      .replace(`-----BEGIN ${type} KEY-----`, "")
      .replace(`-----END ${type} KEY-----`, "")
      .replace(/\s+/g, "")
  );
}

function getSpki() {
  return crypto.subtle.importKey(
    "spki",
    pemToBuf(fs.readFileSync(CONST.PUB_PATH), "PUBLIC"),
    ALGO,
    false,
    ["encrypt"]
  );
}

function getPkcs8() {
  return crypto.subtle.importKey(
    "pkcs8",
    pemToBuf(fs.readFileSync(CONST.PRI_PATH), "PRIVATE"),
    ALGO,
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

async function hex(text) {
  const dataBuffer = parse.stringToBuffer(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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

async function hash(r) {
  const data = await hex(io.inText(r));
  io.outText(r, data);
}

function pub(r) {
  io.outText(r, fs.readFileSync(CONST.PUB_PATH));
}

/**
 * hash: hash 接口, 用于加密密码
 */
export default {
  encrypt: io.h(encrypt),
  decrypt: io.h(decrypt),
  hash: io.h(hash),
  pub: io.h(pub),
};
