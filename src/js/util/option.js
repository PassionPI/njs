const O = Symbol();
const OK = Symbol();
const ERR = Symbol();

function create(x) {
  if (x && x[O]) {
    return x;
  }
  return {
    [O]: x instanceof Error ? ERR : OK,
    val: x,
  };
}

function of(x) {
  const o = create(x);
  return Object.assign(o, {
    map(f) {
      if (isOk(o)) {
        try {
          return of(f(o.val));
        } catch (e) {
          return of(e);
        }
      }
      return o;
    },
    join() {
      return o.val;
    },
  });
}

function isOk(x) {
  return x && x[O] == OK;
}
function isErr(x) {
  return x && x[O] == ERR;
}

export default {
  of,
  isOk,
  isErr,
};
