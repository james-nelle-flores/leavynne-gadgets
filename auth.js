/* =========================================================
   Leavynne Gadgets — Staff accounts (sign in / create account)
   - Passwords are never stored as plain text: each one is salted
     and hashed (SHA-256, 2,000 rounds) before saving.
   - Roles: "owner" (full access + manages staff) and "staff".
   - 5 wrong passwords lock sign-in for 60 seconds.
   - Sessions expire after 8 hours (or 7 days with "Keep me signed in").
   IMPORTANT: accounts are saved in this browser only (localStorage).
   This is suitable for a class project / demo. A live store needs a
   real server and database (e.g. Firebase or Supabase) for logins.
   ========================================================= */
(function () {
  "use strict";
  const K = { acc: "lg_accounts_v1", sess: "lg_session_v1", lock: "lg_auth_lock_v1" };
  const HOUR = 3600000;
  const read = (s, k, f) => { try { const v = s.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; } };
  const write = (s, k, v) => { try { s.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } };
  const drop = (s, k) => { try { s.removeItem(k); } catch { /* ignore */ } };

  /* ---------- SHA-256 (pure JS, works when opened from a file) ---------- */
  const KK = (() => {
    const k = []; let n = 2;
    while (k.length < 64) {
      let prime = true;
      for (let d = 2; d * d <= n; d++) if (n % d === 0) { prime = false; break; }
      if (prime) k.push((Math.cbrt(n) % 1) * 4294967296 >>> 0);
      n++;
    }
    return k;
  })();
  function sha256(msg) {
    const bytes = new TextEncoder().encode(msg);
    const len = bytes.length, total = ((len + 9 + 63) >> 6) << 6;
    const buf = new Uint8Array(total); buf.set(bytes); buf[len] = 0x80;
    const dv = new DataView(buf.buffer);
    dv.setUint32(total - 4, (len * 8) >>> 0); dv.setUint32(total - 8, Math.floor((len * 8) / 4294967296));
    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const W = new Uint32Array(64);
    const r = (x, n) => (x >>> n) | (x << (32 - n));
    for (let i = 0; i < total; i += 64) {
      for (let t = 0; t < 16; t++) W[t] = dv.getUint32(i + t * 4);
      for (let t = 16; t < 64; t++) {
        const s0 = r(W[t - 15], 7) ^ r(W[t - 15], 18) ^ (W[t - 15] >>> 3);
        const s1 = r(W[t - 2], 17) ^ r(W[t - 2], 19) ^ (W[t - 2] >>> 10);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let t = 0; t < 64; t++) {
        const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + KK[t] + W[t]) >>> 0;
        const t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      [a, b, c, d, e, f, g, h].forEach((v, j) => (H[j] = (H[j] + v) >>> 0));
    }
    return H.map((x) => x.toString(16).padStart(8, "0")).join("");
  }
  function randomHex(n) {
    const a = new Uint8Array(n);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  function hashPassword(pw, salt) {
    let h = sha256(salt + ":" + pw);
    for (let i = 0; i < 2000; i++) h = sha256(h + salt);
    return h;
  }
  function safeEqual(a, b) {
    if (a.length !== b.length) return false;
    let x = 0; for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return x === 0;
  }

  /* ---------- Storage ---------- */
  const all = () => read(localStorage, K.acc, []);
  const saveAll = (list) => write(localStorage, K.acc, list);
  const normUser = (u) => String(u || "").trim().toLowerCase();
  const find = (u) => all().find((a) => a.username === normUser(u));
  const publicView = (a) => a && ({ username: a.username, name: a.name, role: a.role, active: a.active, mustChange: !!a.mustChange, created: a.created, lastLogin: a.lastLogin || null });

  function makeAccount({ name, username, password, role, mustChange }) {
    const salt = randomHex(16);
    return { username: normUser(username), name: String(name).trim(), role, active: true, mustChange: !!mustChange,
      salt, hash: hashPassword(password, salt), created: new Date().toISOString(), lastLogin: null };
  }
  function seed() {
    if (all().length) return;
    saveAll([makeAccount({ name: "Shop Owner", username: "owner", password: "Leavynne2026", role: "owner", mustChange: true })]);
  }

  /* ---------- Validation ---------- */
  function passwordProblem(pw) {
    if (pw.length < 8) return "Password must be at least 8 characters.";
    if (pw.length > 64) return "Password must be 64 characters or fewer.";
    if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Password must include both letters and numbers.";
    return "";
  }
  function strength(pw) {
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return Math.min(4, s);
  }

  /* ---------- Session ---------- */
  function readSession() {
    const s = read(sessionStorage, K.sess, null) || read(localStorage, K.sess, null);
    if (!s || !s.username || !s.expires || Date.now() > s.expires) { clearSession(); return null; }
    return s;
  }
  function clearSession() { drop(sessionStorage, K.sess); drop(localStorage, K.sess); }
  function current() {
    const s = readSession(); if (!s) return null;
    const a = find(s.username);
    if (!a || !a.active) { clearSession(); return null; }
    return publicView(a);
  }
  const fail = (error, field) => ({ ok: false, error, field });

  /* ---------- Lockout ---------- */
  function lockState() { return read(localStorage, K.lock, { count: 0, until: 0 }); }
  function lockedFor() { const l = lockState(); return l.until > Date.now() ? Math.ceil((l.until - Date.now()) / 1000) : 0; }

  /* ---------- Public API ---------- */
  function signIn(username, password, remember) {
    const wait = lockedFor();
    if (wait) return fail(`Too many attempts. Please wait ${wait} seconds and try again.`);
    if (!normUser(username) || !password) return fail("Enter your username and password.", !normUser(username) ? "username" : "password");
    const a = find(username);
    const good = a && safeEqual(hashPassword(password, a.salt), a.hash);
    if (!good) {
      const l = lockState(); l.count = (l.count || 0) + 1;
      if (l.count >= 5) { l.until = Date.now() + 60000; l.count = 0; }
      write(localStorage, K.lock, l);
      return fail(l.until > Date.now() ? "Too many attempts. Sign-in is locked for 60 seconds." : `Incorrect username or password. ${5 - l.count} attempt(s) left.`, "password");
    }
    if (!a.active) return fail("This account has been disabled. Please contact the shop owner.");
    write(localStorage, K.lock, { count: 0, until: 0 });
    const list = all(); const me = list.find((x) => x.username === a.username);
    me.lastLogin = new Date().toISOString(); saveAll(list);
    clearSession();
    const sess = { username: a.username, expires: Date.now() + (remember ? 168 : 8) * HOUR };
    write(remember ? localStorage : sessionStorage, K.sess, sess);
    return { ok: true, user: publicView(me) };
  }

  function signUp({ name, username, password, confirm, code }) {
    name = String(name || "").trim(); const u = normUser(username);
    if (name.length < 2) return fail("Please enter your full name.", "name");
    if (!/^[a-z0-9._]{3,20}$/.test(u)) return fail("Username must be 3–20 characters: letters, numbers, dots or underscores.", "username");
    if (find(u)) return fail("That username is already taken.", "username");
    const p = passwordProblem(password || ""); if (p) return fail(p, "password");
    if (password !== confirm) return fail("Passwords do not match.", "confirm");
    if (String(code || "").trim().toUpperCase() !== String(SHOP.staffCode).toUpperCase()) return fail("Invalid staff invite code. Ask the shop owner for the code.", "code");
    const list = all(); list.push(makeAccount({ name, username: u, password, role: "staff" })); saveAll(list);
    return signIn(u, password, false);
  }

  function changePassword(oldPw, newPw, confirm) {
    const me = current(); if (!me) return fail("Your session has expired. Please sign in again.");
    const list = all(); const a = list.find((x) => x.username === me.username);
    if (!safeEqual(hashPassword(oldPw || "", a.salt), a.hash)) return fail("Current password is incorrect.", "old");
    const p = passwordProblem(newPw || ""); if (p) return fail(p, "password");
    if (newPw !== confirm) return fail("New passwords do not match.", "confirm");
    if (newPw === oldPw) return fail("Choose a password different from the current one.", "password");
    a.salt = randomHex(16); a.hash = hashPassword(newPw, a.salt); a.mustChange = false; saveAll(list);
    return { ok: true };
  }

  function updateName(name) {
    const me = current(); if (!me) return fail("Your session has expired.");
    name = String(name || "").trim(); if (name.length < 2) return fail("Please enter your full name.", "name");
    const list = all(); list.find((x) => x.username === me.username).name = name; saveAll(list);
    return { ok: true };
  }

  /* Owner-only actions */
  function requireOwner() { const me = current(); return me && me.role === "owner" ? me : null; }
  function listAccounts() { return requireOwner() ? all().map(publicView) : []; }
  function resetPassword(username) {
    const me = requireOwner(); if (!me) return fail("Only the owner can reset passwords.");
    const list = all(); const a = list.find((x) => x.username === normUser(username));
    if (!a) return fail("Account not found.");
    if (a.username === me.username) return fail("Use “My account” to change your own password.");
    const temp = "Temp" + (1000 + (parseInt(randomHex(2), 16) % 9000)) + randomHex(2);
    a.salt = randomHex(16); a.hash = hashPassword(temp, a.salt); a.mustChange = true; saveAll(list);
    return { ok: true, temp };
  }
  function setActive(username, active) {
    const me = requireOwner(); if (!me) return fail("Only the owner can do this.");
    const list = all(); const a = list.find((x) => x.username === normUser(username));
    if (!a || a.username === me.username) return fail("You can’t disable your own account.");
    a.active = !!active; saveAll(list); return { ok: true };
  }
  function setRole(username, role) {
    const me = requireOwner(); if (!me) return fail("Only the owner can do this.");
    if (!["owner", "staff"].includes(role)) return fail("Unknown role.");
    const list = all(); const a = list.find((x) => x.username === normUser(username));
    if (!a || a.username === me.username) return fail("You can’t change your own role.");
    a.role = role; saveAll(list); return { ok: true };
  }
  function removeAccount(username) {
    const me = requireOwner(); if (!me) return fail("Only the owner can do this.");
    const u = normUser(username); if (u === me.username) return fail("You can’t remove your own account.");
    saveAll(all().filter((a) => a.username !== u)); return { ok: true };
  }
  function signOut() { clearSession(); }

  seed();
  window.LGAuth = { current, signIn, signUp, signOut, changePassword, updateName, listAccounts, resetPassword, setActive, setRole, removeAccount, passwordProblem, strength, lockedFor, _sha256: sha256 };
})();
