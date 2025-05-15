function saveFile(name, data) {
  const blob = new Blob([data], { type: "text/plain" });
  const a = document.createElement("a");
  a.download = name;
  a.href = URL.createObjectURL(blob);
  a.click();
  URL.revokeObjectURL(a.href);
}

function stringToBuffer(string) {
  return new TextEncoder().encode(string).buffer;
}

function bufferToBase64(buffer) {
  return btoa(
    Array.from(new Uint8Array(buffer), (byte) =>
      String.fromCodePoint(byte)
    ).join("")
  );
}

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

  saveFile("rsa.key", privateKey);
  saveFile("rsa.pub", publicKey);
};

const initJwt = async () => {
  saveFile("jwt.key", crypto.getRandomValues(new Uint8Array(128)));
};

const initJwk = async () => {
  const keys = await crypto.subtle.generateKey(
    {
      name: "RSA-PSS",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"]
  );

  const privateKey = await exportKey(keys.privateKey);
  const publicKey = await exportKey(keys.publicKey);

  saveFile("jwk.key", privateKey);
  saveFile("jwk.pub", publicKey);
};

await initRsa();
await initJwk();
