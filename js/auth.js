// login - logout

import { updateProfileView } from "./profile.js";

export function initAuth({ form, logoutBtn, errorMsg, render }) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    // Take data from form
    const identifier = document.getElementById("identifier").value;
    const password = document.getElementById("password").value;

    // Base64 encode for UTF-8 support
    const base64Credentials = btoa(
      new TextEncoder().encode(`${identifier}:${password}`).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    try {
      const res = await fetch("https://learn.reboot01.com/api/auth/signin", {
        method: "POST",
        headers: {
          Authorization: `Basic ${base64Credentials}`,
        },
      });

      if (!res.ok) throw new Error();

      const jwt = await res.json();
      localStorage.setItem("jwt", jwt);

      errorMsg.textContent = "";
      render();
      await updateProfileView();
    } catch {
      errorMsg.textContent = "Invalid username/email or password";
    }
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("jwt");
    render();
  });
}