import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { Router } from "express";
import {
  createSession,
  createUser,
  deleteSession,
  findUserByEmail,
  findUserBySession,
} from "./database.mjs";

const router = Router();
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_COOKIE = "dashboard_session";

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, savedHash] = storedHash.split(":");
  if (!salt || !savedHash) return false;

  const calculatedHash = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(
    Buffer.from(savedHash, "hex"),
    Buffer.from(calculatedHash, "hex"),
  );
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function readCookie(request, name) {
  const cookies = request.headers.cookie || "";
  const value = cookies.split("; ").find((item) => item.startsWith(`${name}=`));
  return value ? decodeURIComponent(value.slice(name.length + 1)) : null;
}

function setSessionCookie(response, token) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DURATION_MS / 1000}${secure}`,
  );
}

function clearSessionCookie(response) {
  response.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
  );
}

function validateCredentials(email, password, name = "") {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const normalizedPassword = String(password || "");
  const normalizedName = String(name || "").trim();

  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    throw new Error("Informe um e-mail válido.");
  }

  if (normalizedPassword.length < 8) {
    throw new Error("A senha deve ter pelo menos 8 caracteres.");
  }

  if (!normalizedName) {
    throw new Error("Informe seu nome para continuar.");
  }

  return {
    name: normalizedName,
    email: normalizedEmail,
    password: normalizedPassword,
  };
}

async function startSession(response, user) {
  const token = randomBytes(32).toString("base64url");
  await createSession(
    user.id,
    hashToken(token),
    Date.now() + SESSION_DURATION_MS,
  );
  setSessionCookie(response, token);
  return { id: user.id, name: user.name, email: user.email };
}

export async function requireAuth(request, response, next) {
  try {
    const token = readCookie(request, SESSION_COOKIE);
    const user = token && (await findUserBySession(hashToken(token)));

    if (!user) {
      return response
        .status(401)
        .json({ message: "Faça login para acessar esta funcionalidade." });
    }

    request.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

router.post("/register", async (request, response) => {
  try {
    const { name, email, password } = validateCredentials(
      request.body.email,
      request.body.password,
      request.body.name,
    );

    if (await findUserByEmail(email)) {
      return response
        .status(409)
        .json({ message: "Já existe uma conta com este e-mail." });
    }

    const user = await createUser(name, email, hashPassword(password));
    response.status(201).json({ user: await startSession(response, user) });
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
});

router.post("/login", async (request, response) => {
  try {
    const { email, password } = validateCredentials(
      request.body.email,
      request.body.password,
    );
    const user = await findUserByEmail(email);

    if (!user || !verifyPassword(password, user.password_hash)) {
      return response
        .status(401)
        .json({ message: "E-mail ou senha incorretos." });
    }

    response.json({ user: await startSession(response, user) });
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
});

router.post("/logout", async (request, response) => {
  const token = readCookie(request, SESSION_COOKIE);
  if (token) await deleteSession(hashToken(token));
  clearSessionCookie(response);
  response.status(204).end();
});

router.get("/me", requireAuth, (request, response) => {
  response.json({ user: request.user });
});

export default router;
