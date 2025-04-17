import CONST from "../const.js";
import io from "../util/io.js";
import parse from "../util/parse.js";

const fs = require("fs");

const ALGO = "HMAC";
const HEADER = { typ: "JWT", alg: "HS256" };

const MINUTE = 60000; // 60 * 1000;
const HOUR = 3600000; // 60 * 60 * 1000;
const DAY = 86400000; // 24 * 60 * 60 * 1000;
const EXP_15M = 15 * MINUTE;
const EXP_1H = 1 * HOUR;
const EXP_2D = 2 * DAY;
const EXP_7D = 7 * DAY;
const EXP_30D = 30 * DAY;

function fromBearer(r) {
  return r.variables.cookie_bearer || "";
}

function importKey() {
  return crypto.subtle.importKey(
    "raw",
    fs.readFileSync(CONST.JWT_PATH),
    { name: ALGO, hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function jwtSign(_claims, exp) {
  const cryptoKey = await importKey();

  const claims = Object.assign(_claims, { exp: Date.now() + exp });

  const text = [HEADER, claims]
    .map((x) => JSON.stringify(x))
    .map((x) => parse.stringToBase64url(x))
    .join(".");

  const sign = await crypto.subtle.sign(ALGO, cryptoKey, text);

  return `${text}.${parse.bufferToBase64url(sign)}`;
}

async function jwtVerify(_token) {
  const cryptoKey = await importKey();

  const token = _token || "";
  const parts = token.split(".");
  const b64Header = parts[0] || "";
  const b64Claims = parts[1] || "";
  const b64Signature = parts[2] || "";

  const validator = await crypto.subtle.verify(
    ALGO,
    cryptoKey,
    parse.base64urlToBuffer(b64Signature),
    parse.stringToBuffer(`${b64Header}.${b64Claims}`)
  );

  if (validator == false) {
    return Error("Invalid signature");
  }

  const claims = parse.stringToJson(parse.base64urlToString(b64Claims));
  const header = () => parse.stringToJson(parse.base64urlToString(b64Header));

  if (claims == null) {
    return Error("Invalid claims");
  }

  if (claims.exp < Date.now()) {
    return Error("Token expired");
  }

  return { claims, header };
}

async function _sign(r) {
  const claims = {
    iss: "nginx",
  };
  const token = await jwtSign(claims, EXP_7D);

  io.outText(r, token);
}

async function _verify(r) {
  const token = io.inText(r);
  const result = await jwtVerify(token);

  if (result instanceof Error) {
    return io.outBad(r, result.message);
  }

  io.outJson(r, result.claims);
}

async function auth(r) {
  const token = fromBearer(r);

  if (token == "") {
    r.return(401);
    return;
  }

  const x = await jwtVerify(token);

  r.return(x instanceof Error ? 401 : 200);
}

async function ping(r) {
  const token = fromBearer(r);

  const result = await jwtVerify(token);

  if (result instanceof Error) {
    return io.outUnAuth(r);
  }

  const claims = result.claims;

  if (claims.exp - Date.now() < EXP_2D) {
    const token = await jwtSign(claims, EXP_7D);

    io.setCookie(
      r,
      io.COOKIE.VAL("bearer", token),
      io.COOKIE.PATH(),
      io.COOKIE.SECURE,
      io.COOKIE.HTTP_ONLY,
      io.COOKIE.SAME_SITE()
    );
  }

  io.outText(r, "Ok");
}

async function _test(r) {
  async function hashData(data) {
    const dataBuffer = parse.stringToBuffer(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  }
  const data = await hashData(io.inText(r));
  io.outText(r, data);
}
/**
 * auth: 所有的接口请求验证
 * ping: 首次打开应用的验证, 附带 bearer 的刷新
 * signup: 注册接口, rsa 解码密码, 请求 user 服务注册, 设置 bearer
 * signin: 登录接口, rsa 解码密码, 请求 user 服务验证, 设置 bearer
 * signout: 登出接口, 删除 bearer
 */
export default {
  auth: io.h(auth),
  ping: io.h(ping),
  _test,
  _sign,
  _verify,
};
