function bufferToBase64(buffer) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
}

const saveFile = (files) => {
  Object.keys(files).forEach((file) => {
    const blob = new Blob([files[file]], { type: "text/plain" });
    const a = document.createElement("a");
    a.download = file;
    a.href = URL.createObjectURL(blob);
    a.click();
    URL.revokeObjectURL(blob);
  });
};

const exportKey = (content) =>
  crypto.subtle
    .exportKey(content.type === "private" ? "pkcs8" : "spki", content)
    .then(
      (data) =>
        `-----BEGIN ${content.type.toUpperCase()} KEY-----\n${bufferToBase64(
          data
        )}\n-----END ${content.type.toUpperCase()} KEY-----`
    );

const initRsa = async () => {
  const keys = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
  const privateKey = await exportKey(keys.privateKey);
  const publicKey = await exportKey(keys.publicKey);

  const files = {
    "rsa.key": privateKey,
    "rsa.pub": publicKey,
  };

  console.log(files);
  // saveFile(files);
};

const initJwt = async () => {
  const key = await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

  const exported = await crypto.subtle.exportKey("raw", key);

  const files = {
    "jwt.key": bufferToBase64(exported),
  };

  console.log(files);
  // saveFile(files);
};

const initJwtRandom = async () => {
  const key = bufferToBase64(crypto.getRandomValues(new Uint8Array(128)));

  const files = {
    "jwt.key": key,
  };

  console.log(files);
  // saveFile(files);
};

(() => {
  initRsa();
  // initJwt();
  initJwtRandom();
})();
