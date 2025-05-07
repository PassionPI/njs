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

function getBearer(r) {
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
  // iss (Issuer): 签发者，标识 JWT 的发行方
  // sub (Subject): 主题，JWT 所面向的用户
  // aud (Audience): 接收方，JWT 的预期接收者
  // nbf (Not Before): 生效时间，指定 JWT 何时开始生效
  // iat (Issued At): 签发时间，JWT 的创建时间
  // jti (JWT ID): JWT 的唯一标识符
  const claims = Object.assign({}, _claims, {
    iss: "Nx",
    exp: Date.now() + exp,
  });

  const text = [HEADER, claims]
    .map((x) => JSON.stringify(x))
    .map((x) => parse.stringToBase64url(x))
    .join(".");

  const cryptoKey = await importKey();
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

  const cryptoKey = await importKey();
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
  // const header = () => parse.stringToJson(parse.base64urlToString(b64Header));

  if (claims == null) {
    return Error("Invalid claims");
  }

  const now = Date.now();

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
    _ui: 2 ** 32,
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
