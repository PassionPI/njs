// mkdir -p /etc/nginx/njs
// mkdir -p /etc/nginx/json
// mkdir -p /etc/nginx/html
// mkdir -p /etc/nginx/server
// touch /etc/nginx/njs/mod.js
// touch /etc/nginx/njs/cookie.js
// touch /etc/nginx/json/env.json
// touch /etc/nginx/html/index.html
// touch /etc/nginx/server/base.conf
// nginx -t && nginx -s reload

/**
 *
 * @docs https://nginx.org/en/docs/njs/index.html
 * @docs https://nginx.org/en/docs/njs/reference.html
 */

import io from "../util/io.js";

function auth(r) {
  const token = io.inArgsGet(r, "token");

  if (token) {
    io.setCookie(
      r,
      io.COOKIE.VAL("Authorization", `Bearer ${token}`),
      io.COOKIE.PATH(),
      io.COOKIE.SECURE,
      io.COOKIE.HTTP_ONLY,
      io.COOKIE.SAME_SITE()
    );
    io.outText(r, "Ok");
  } else {
    io.outBad(r, "Token is required!");
  }
}

export default {
  auth: io.h(auth),
};
