const ROOT_DIR = "/app";
const PRIVATE_DIR = `${ROOT_DIR}/private`;
const PUB_PATH = `${PRIVATE_DIR}/rsa.pub`;
const PRI_PATH = `${PRIVATE_DIR}/rsa.key`;
const JWT_PUB_PATH = `${PRIVATE_DIR}/jwk.pub`;
const JWT_PRI_PATH = `${PRIVATE_DIR}/jwk.key`;

export default {
  PRIVATE_DIR,
  PUB_PATH,
  PRI_PATH,
  JWT_PUB_PATH,
  JWT_PRI_PATH,
};
