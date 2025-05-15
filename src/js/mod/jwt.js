import fs from "fs";
import CONST from "../const.js";
import io from "../util/io.js";
import parse from "../util/parse.js";

// ngx.shared.pub.get("jwk.pub")
// ngx.shared.pub.set("jwk.pub", "----asdf----")

const ALGO_IMPORT = {
  name: "RSA-PSS",
  hash: "SHA-256",
};
const ALGO = {
  name: ALGO_IMPORT.name,
  saltLength: 32, // 256 / 8
};
const HEADER = { typ: "JWT", alg: "PS256" };

const MINUTE = 60; // 60;
const HOUR = 3600; // 60 * 60;
const DAY = 86400; // 24 * 60 * 60;
const EXP_15M = 15 * MINUTE;
const EXP_1H = 1 * HOUR;
const EXP_2D = 2 * DAY;
const EXP_7D = 7 * DAY;
const EXP_30D = 30 * DAY;

function getNow() {
  return Math.floor(Date.now() / 1000);
}

function getBearer(r) {
  return r.variables.cookie_bearer || "";
}

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
    pemToBuf(fs.readFileSync(CONST.JWT_PUB_PATH), "PUBLIC"),
    ALGO_IMPORT,
    false,
    ["verify"]
  );
}

function getPkcs8() {
  return crypto.subtle.importKey(
    "pkcs8",
    pemToBuf(fs.readFileSync(CONST.JWT_PRI_PATH), "PRIVATE"),
    ALGO_IMPORT,
    false,
    ["sign"]
  );
}

async function jwtSign(_claims, exp) {
  // iss (Issuer): 签发者，标识 JWT 的发行方
  // sub (Subject): 主题，JWT 所面向的用户
  // aud (Audience): 接收方，JWT 的预期接收者
  // nbf (Not Before): 生效时间，指定 JWT 何时开始生效
  // iat (Issued At): 签发时间，JWT 的创建时间
  // jti (JWT ID): JWT 的唯一标识符
  const now = getNow();
  const claims = Object.assign({}, _claims, {
    iss: "Nx",
    exp: now + exp,
  });

  const text = [HEADER, claims]
    .map((x) => JSON.stringify(x))
    .map((x) => parse.stringToBase64url(x))
    .join(".");

  const cryptoKey = await getPkcs8();
  const signature = await crypto.subtle.sign(
    ALGO,
    cryptoKey,
    parse.stringToBuffer(text)
  );

  return `${text}.${parse.bufferToBase64url(signature)}`;
}

async function jwtVerify(token) {
  if (typeof token !== "string") {
    return Error("Invalid token");
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return Error("Invalid token structure");
  }

  const b64Header = parts[0];
  const b64Claims = parts[1];
  const b64Signature = parts[2];

  const cryptoKey = await getSpki();
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

  if (claims == null) {
    return Error("Invalid claims");
  }

  const now = getNow();

  if (claims.exp != null && claims.exp < now) {
    return Error("Token expired");
  }

  if (claims.nbf != null && claims.nbf > now) {
    return Error("Token not yet valid");
  }

  return { claims };
}

async function _sign(r) {
  const claims = {
    _ui: 32,
    _un: "test",
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
  const token = getBearer(r);

  const result = await jwtVerify(token);

  if (result instanceof Error) {
    return io.outUnAuth(r);
  }

  io.outText(r, "Ok");
}

async function ping(r) {
  const token = getBearer(r);

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

/**
 * auth: 所有的接口请求验证
 * ping: 首次打开应用的验证, 附带 bearer 的刷新
 * user: 注册接口, 成功后 post sign 「post」 「signup」
 * user: 删除用户接口, 成功后 delete sign「delete」
 * sign: 登录接口, rsa 解码密码, 请求 user 服务验证, 设置 bearer 「post」 「signin」
 * sign: 登出接口, 删除 bearer 「delete」 「signout」
 */
export default {
  auth: io.h(auth),
  ping: io.h(ping),
  _sign,
  _verify,
};
