import { scrypt, timingSafeEqual } from "node:crypto";

// Checking the PIN against the hash in PIN_HASH.
//
// PIN_HASH looks like "<salt>:<hash>", both hex, and was produced by the command
// in docs/progress.md. It cannot be turned back into the PIN. To check a guess we
// hash it with the same salt and compare the results.
//
// scrypt is deliberately slow and memory-hungry — a few hundred milliseconds and
// 16MB per guess. That is the point.

function hash(pin: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // 64 bytes, and scrypt's default cost. Both must match the command that
    // generated PIN_HASH — change one and every PIN stops working.
    scrypt(pin, salt, 64, (error, derived) => {
      if (error) reject(error);
      else resolve(derived);
    });
  });
}

export async function isCorrectPin(pin: string): Promise<boolean> {
  const stored = process.env.PIN_HASH;
  if (!stored) {
    throw new Error(
      "PIN_HASH is missing. Locally it lives in .env.local; on Vercel it is an " +
        "environment variable.",
    );
  }

  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) {
    throw new Error('PIN_HASH is malformed. It should look like "<salt>:<hash>".');
  }

  const expected = Buffer.from(hashHex, "hex");
  const actual = await hash(pin, Buffer.from(saltHex, "hex"));

  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
