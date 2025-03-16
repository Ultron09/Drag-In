document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.querySelector("form");

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent form from submitting the default way

        const username = document.querySelector(".input-group input[type='text']").value;
        const password = document.querySelector(".input-group input[type='password']").value;

        const response = await fetch("http://127.0.0.1:3000/loginfun", { // Adjust URL if needed
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.message === "Login successful!") {
            alert("Login successful!");
            localStorage.setItem("username", data.username); // Store username
            window.location.href = "dashboard.html"; // Redirect to dashboard
        } else {
            alert("Invalid username or password. Please try again.");
        }
    });
});
