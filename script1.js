document.getElementById("signupForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const file = document.getElementById("profileFile").files[0];

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);
    if (file) formData.append("file", file);

    const response = await fetch("/api/signup", {
        method: "POST",
        body: formData
    });

    const result = await response.json();
    if (result.success) {
        alert("Signup successful! Redirecting...");
        window.location.href = "/dashboard.html";
    } else {
        alert(result.message);
    }
});
