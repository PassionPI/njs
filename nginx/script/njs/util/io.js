import p from "./parse.js";

const H = {
  COOKIE: "Set-Cookie",
  CONTENT_TYPE: "Content-Type",
};

const CONTENT_TYPE = {
  TEXT: "text/plain",
  JSON: "application/json",
  BLOB: "application/octet-stream",
};

const COOKIE = {
  SECURE: "Secure",
  HTTP_ONLY: "HttpOnly",
  VAL: (key, val) => `${key}=${val}`,
  PATH: (path) => `Path=${path || "/"}`,
  DOMAIN: (domain) => `Domain=${domain}`,
  MAX_AGE: (age) => `Max-Age=${age || 3600}`,
  SAME_SITE: (policy) => `SameSite=${policy || "Strict"}`,
};

const CODE = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  INTERNAL_SERVER_ERROR: 500,
};

function isString(s) {
  return typeof s == "string";
}

function setCookie(r, ...conf) {
  r.headersOut[H.COOKIE] = conf.join(";");
}

function setContentType(r, type) {
  r.headersOut[H.CONTENT_TYPE] = type;
}

function outErr(r, msg) {
  setContentType(r, CONTENT_TYPE.TEXT);
  r.return(CODE.INTERNAL_SERVER_ERROR, msg || "");
}

function outBad(r, msg) {
  setContentType(r, CONTENT_TYPE.TEXT);
  r.return(CODE.BAD_REQUEST, msg || "");
}

function outUnAuth(r) {
  setContentType(r, CONTENT_TYPE.TEXT);
  r.return(CODE.UNAUTHORIZED, "Unauthorized");
}

function outForbid(r) {
  setContentType(r, CONTENT_TYPE.TEXT);
  r.return(CODE.FORBIDDEN, "Forbidden");
}

function outNotFound(r) {
  setContentType(r, CONTENT_TYPE.TEXT);
  r.return(CODE.NOT_FOUND, "Not Found");
}

function outMethodNotAllowed(r) {
  setContentType(r, CONTENT_TYPE.TEXT);
  r.return(CODE.METHOD_NOT_ALLOWED, "Method Not Allowed");
}

function outText(r, text) {
  setContentType(r, CONTENT_TYPE.TEXT);
  r.return(CODE.OK, text || "");
}

function outJson(r, json) {
  setContentType(r, CONTENT_TYPE.JSON);
  r.return(CODE.OK, isString(json) ? json : JSON.stringify(json));
}

function inContentType(r) {
  return r.headersIn[H.CONTENT_TYPE];
}

function inTypeText(r) {
  const type = inContentType(r);
  return !!type && type.includes(CONTENT_TYPE.TEXT);
}

function inTypeJson(r) {
  const type = inContentType(r);
  return !!type && type.includes(CONTENT_TYPE.JSON);
}

function inArgsGet(r, name) {
  const value = r.args[name];
  return Array.isArray(value) ? value[0] : value;
}

function inArgsGetAll(r, name) {
  const value = r.args[name] || [];
  return Array.isArray(value) ? value : [value];
}

function inText(r) {
  return r.requestText;
}

function inJson(r) {
  if (!inTypeJson(r)) {
    return null;
  }
  return p.stringToJson(inText(r));
}

function inVar(r, name) {
  return r.variables[name];
}

function inVarMut(r, name, value) {
  r.variables[name] = value;
}

function h(fn) {
  return async (r) => {
    try {
      await fn(r);
    } catch (e) {
      outErr(r, e.message);
    }
  };
}

export default {
  CODE,
  COOKIE,
  CONTENT_TYPE,

  setCookie,
  setContentType,

  outText,
  outJson,
  outErr,
  outBad,
  outUnAuth,
  outForbid,
  outNotFound,
  outMethodNotAllowed,

  inContentType,
  inTypeText,
  inTypeJson,
  inArgsGetAll,
  inArgsGet,
  inText,
  inJson,
  inVar,
  inVarMut,

  h,
};
