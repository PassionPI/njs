console.log("z.js");

const init = async () => {
  const ab2str = (buffer) =>
    String.fromCharCode.apply(null, new Uint8Array(buffer));
  const saveFile = async (files) => {
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
    new Promise(async (resolve) => {
      await crypto.subtle
        .exportKey(content.type === "private" ? "pkcs8" : "spki", content)
        .then((data) =>
          resolve(
            `-----BEGIN ${content.type.toUpperCase()} KEY-----\n${btoa(
              ab2str(data)
            )}\n-----END ${content.type.toUpperCase()} KEY-----`
          )
        );
    });
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

  saveFile({
    "rsa.key": privateKey,
    "rsa.pub": publicKey,
  });
};
