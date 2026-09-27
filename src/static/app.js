document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const authStatus = document.getElementById("auth-status");
  const loginToggle = document.getElementById("login-toggle");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const cancelLoginButton = document.getElementById("cancel-login");
  const logoutButton = document.getElementById("logout-button");
  const teacherOnlyMessage = document.getElementById("teacher-only-message");

  let adminUser = null;

  function updateAuthUI() {
    const isLoggedIn = Boolean(adminUser);
    authStatus.textContent = isLoggedIn ? `Logged in as ${adminUser}` : "Not signed in";
    loginToggle.textContent = isLoggedIn ? `👤 ${adminUser}` : "👤 Login";
    logoutButton.classList.toggle("hidden", !isLoggedIn);
    signupForm.classList.toggle("hidden", !isLoggedIn);
    teacherOnlyMessage.classList.toggle("hidden", isLoggedIn);
  }

  async function refreshAdminState() {
    try {
      const response = await fetch("/admin/me");
      if (response.ok) {
        const data = await response.json();
        adminUser = data.username;
      } else {
        adminUser = null;
      }
    } catch (error) {
      adminUser = null;
    }
    updateAuthUI();
  }

  function openLoginModal() {
    loginModal.classList.remove("hidden");
    document.getElementById("username").focus();
  }

  function closeLoginModal() {
    loginModal.classList.add("hidden");
    loginForm.reset();
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantRows = details.participants
          .map((email) => {
            const deleteButton = adminUser
              ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>`
              : "";
            return `<li><span class="participant-email">${email}</span>${deleteButton}</li>`;
          })
          .join("");

        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${participantRows}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  loginToggle.addEventListener("click", openLoginModal);
  cancelLoginButton.addEventListener("click", closeLoginModal);
  loginModal.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      closeLoginModal();
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (response.ok) {
        adminUser = result.username;
        updateAuthUI();
        closeLoginModal();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Login failed";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
      }
    } catch (error) {
      messageDiv.textContent = "Failed to log in. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error logging in:", error);
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      await fetch("/admin/logout", { method: "POST" });
    } catch (error) {
      console.error("Error logging out:", error);
    }

    adminUser = null;
    updateAuthUI();
    fetchActivities();
  });

  refreshAdminState();
  fetchActivities();
});
