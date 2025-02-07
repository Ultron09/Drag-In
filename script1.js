document.getElementById("signupForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
    });

    const result = await response.json();

    if (result.success) {
        document.getElementById("signupBox").innerHTML = `
            <h2>Signup Successful! ✅</h2>
            <button id="goToLogin">Go to Login</button>
        `;

        document.getElementById("goToLogin").addEventListener("click", function () {
            window.location.href = "/index.html";
        });
    } else {
        alert(result.message);
    }
});
