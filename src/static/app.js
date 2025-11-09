document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
  // Request fresh data to avoid stale/cached responses so the UI reflects recent changes
  const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message and existing items/options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build main card content
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsTitle = document.createElement("p");
        participantsTitle.className = "participants-title";
        participantsTitle.textContent = `Participants (${details.participants.length})`;
        participantsSection.appendChild(participantsTitle);

        if (details.participants.length === 0) {
          const none = document.createElement("p");
          none.className = "participants-empty";
          none.textContent = "No participants yet.";
          participantsSection.appendChild(none);
        } else {
          const ul = document.createElement("ul");
          ul.className = "participants-list no-bullets";
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";
            // Participant email
            const span = document.createElement("span");
            span.textContent = p;
            // Delete icon
            const delBtn = document.createElement("button");
            delBtn.className = "delete-participant";
            delBtn.title = "Remove participant";
            delBtn.innerHTML = "&#128465;"; // Trash can icon
            delBtn.onclick = async (e) => {
              e.stopPropagation();
              if (confirm(`Unregister ${p} from ${name}?`)) {
                try {
                  const response = await fetch(`/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`, { method: "POST" });
                  const result = await response.json();
                  if (response.ok) {
                    // Refresh activities list after successful unregister
                    await fetchActivities();
                  } else {
                    alert(result.detail || "Failed to unregister participant.");
                  }
                } catch (err) {
                  alert("Error unregistering participant.");
                }
              }
            };
            li.appendChild(span);
            li.appendChild(delBtn);
            ul.appendChild(li);
          });
          participantsSection.appendChild(ul);
        }

        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

  // Refresh activities to show updated participants list
  await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
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

  // Initialize app
  fetchActivities();
});
