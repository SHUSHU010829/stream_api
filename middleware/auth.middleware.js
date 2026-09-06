import crypto from "crypto";

function timingSafeEqualString(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function requireApiKey(envVarName) {
  let warned = false;
  return (req, res, next) => {
    const expectedKey = process.env[envVarName];
    if (!expectedKey) {
      if (!warned) {
        console.warn(
          `[WARN] ${envVarName} 未設定，${req.baseUrl}${req.path} 驗證暫時停用！`
        );
        warned = true;
      }
      return next();
    }

    const providedKey = req.headers["x-api-key"];
    if (
      typeof providedKey !== "string" ||
      !timingSafeEqualString(providedKey, expectedKey)
    ) {
      return res.status(401).json({ message: "未授權！" });
    }

    next();
  };
}

export const requireAdmin = requireApiKey("ADMIN_API_KEY");
export const requireClient = requireApiKey("CLIENT_API_KEY");
