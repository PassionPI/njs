import io from "../util/io.js";
import opt from "../util/option.js";
import p from "../util/parse.js";

const header = { typ: "JWT", alg: "HS256" };
const cryptoAlgo = "HMAC";
const JWT_KEY = "JWT_GEN_KEY";

function importKey(key) {
  return crypto.subtle.importKey(
    "raw",
    key,
    { name: cryptoAlgo, hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function jwtSign(key, _claims, exp) {
  const cryptoKey = await importKey(key);

  const claims = Object.assign(_claims, { exp: Date.now() + exp });

  const text = [header, claims]
    .map(JSON.stringify)
    .map(p.stringToBase64)
    .join(".");

  const sign = await crypto.subtle.sign(cryptoAlgo, cryptoKey, text);

  return `${text}.${p.bufferToBase64(sign)}`;
}

async function jwtVerify(key, token) {
  const cryptoKey = await importKey(key);

  const parts = token.split(".") || [];
  const b64Header = parts[0];
  const b64Claims = parts[1];
  const b64Signature = parts[2];
  const text = p.stringToBuffer(`${b64Header}.${b64Claims}`);
  const signature = p.base64ToBuffer(b64Signature);

  const valid = await crypto.subtle
    .verify(cryptoAlgo, cryptoKey, signature, text)
    .then(opt.of, opt.of);

  return valid
    .map((ok) => {
      if (ok == false) {
        return Error("Invalid signature");
      }
      return p.stringToJson(p.base64ToString(b64Claims));
    })
    .map((claims) => {
      if (claims == null) {
        return Error("Invalid claims");
      }
      if (claims.exp < Date.now()) {
        return Error("Token expired");
      }
      return claims;
    });
}

async function handler(r) {
  if (r.method == "POST") {
    const claims = {
      iss: "nginx",
    };
    const token = await jwtSign(JWT_KEY, claims, 100 * 1000);
    io.outText(r, token);
    return;
  }

  if (r.method == "GET") {
    const token = io.inArgsGet(r, "token");
    const claims = await jwtVerify(JWT_KEY, token);
    if (opt.isErr(claims)) {
      io.outBad(r, claims.join().message);
    } else {
      io.outJson(r, claims.join());
    }
  }
}

export default { handler: io.h(handler) };
