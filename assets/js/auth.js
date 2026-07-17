function showStatus(el, message, ok) {
  el.textContent = message;
  el.classList.remove("ok", "err");
  el.classList.add("show", ok ? "ok" : "err");
}

/* ---------- Login ---------- */
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("login-status");
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const btn = loginForm.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Signing in…";

    const { error } = await dlaSupabase.auth.signInWithPassword({ email, password });

    if (error) {
      showStatus(status, error.message, false);
      btn.disabled = false;
      btn.textContent = "Sign in";
    } else {
      window.location.href = "dashboard.html";
    }
  });
}

/* ---------- Signup ---------- */
const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("signup-status");
    const firstName = document.getElementById("signup-first").value.trim();
    const lastName = document.getElementById("signup-last").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const tier = document.getElementById("signup-tier").value;
    const btn = signupForm.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Creating account…";

    const { data, error } = await dlaSupabase.auth.signUp({ email, password });

    if (error) {
      showStatus(status, error.message, false);
      btn.disabled = false;
      btn.textContent = "Create account";
      return;
    }

    // handle_new_user trigger already inserted a bare members row.
    // Fill in the rest now that we have a session (or will on confirm).
    if (data.user) {
      await dlaSupabase
        .from("members")
        .update({ first_name: firstName, last_name: lastName, membership_tier: tier })
        .eq("id", data.user.id);
    }

    showStatus(
      status,
      "Account created. Check your email to confirm, then sign in.",
      true
    );
    signupForm.reset();
    btn.disabled = false;
    btn.textContent = "Create account";
  });
}

/* ---------- Logout (used on dashboard) ---------- */
async function dlaLogout() {
  await dlaSupabase.auth.signOut();
  window.location.href = "login.html";
}
