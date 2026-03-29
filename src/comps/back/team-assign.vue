<script setup>
import { ref, onMounted, computed } from "vue";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uvzsspviybmxcwyffpkh.supabase.co";
const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2enNzcHZpeWJteGN3eWZmcGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NDc2OTQsImV4cCI6MjA5MDIyMzY5NH0.fdXoza3nOW7NXNSFJi0aVgf1ZX6hMoKfQ0oiysftUdc";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const contacts = ref([]);
const isLoading = ref(false);
const fetchError = ref(null);
const selectedTeam = ref("");
const sortOption = ref("deadlineAsc");
const columnCount = ref(3); // Number of columns for the grid

const teamCategoryMap = {
    "Investment Team": ["investory", "investment_deal"],
    "Public Affairs Team": ["government", "pr_marketing", "mna"],
    "Startup Support Team": ["startup", "operators", "service_providers"],
    "Talent Acquisition Team": ["talent_recruiting", "mentors", "networking"],
    "Social Impact Team": ["non_profit", "media"],
};

const categoryToTeam = Object.entries(teamCategoryMap).reduce(
    (acc, [team, categories]) => {
        categories.forEach((category) => {
            acc[category] = team;
        });
        return acc;
    },
    {},
);

const teams = computed(() => Object.keys(teamCategoryMap));

function getAssignedTeam(contact) {
    const categoryKey =
        contact && contact.category
            ? contact.category.toString().replace(/\s+/g, "_").toLowerCase()
            : "";
    return categoryToTeam[categoryKey] || "Unassigned Team";
}

async function fetchContacts() {
    isLoading.value = true;
    fetchError.value = null;
    const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        fetchError.value = error;
        contacts.value = [];
    } else {
        contacts.value = data;
    }
    isLoading.value = false;
}

const filteredContacts = computed(() => {
    if (!selectedTeam.value) return contacts.value;
    return contacts.value.filter(
        (contact) => getAssignedTeam(contact) === selectedTeam.value,
    );
});

const sortedContacts = computed(() => {
    const list = [...filteredContacts.value];

    const parseDeadline = (contact) => {
        const d = contact.deadline_time
            ? new Date(contact.deadline_time)
            : null;
        return d && !Number.isNaN(d.getTime()) ? d : new Date(8640000000000000);
    };

    if (sortOption.value === "deadlineAsc") {
        list.sort((a, b) => parseDeadline(a) - parseDeadline(b));
    } else if (sortOption.value === "deadlineDesc") {
        list.sort((a, b) => parseDeadline(b) - parseDeadline(a));
    } else if (sortOption.value === "premiumHigh") {
        list.sort(
            (a, b) => (b.user_premium ? 1 : 0) - (a.user_premium ? 1 : 0),
        );
    } else if (sortOption.value === "premiumLow") {
        list.sort(
            (a, b) => (b.user_premium ? 1 : 0) - (a.user_premium ? 1 : 0),
        );
    } else if (sortOption.value === "nameAsc") {
        const normalizeName = (contact) =>
            `${contact.first_name || ""} ${contact.last_name || ""}`
                .trim()
                .toLowerCase();
        list.sort((a, b) => normalizeName(a).localeCompare(normalizeName(b)));
    } else if (sortOption.value === "nameDesc") {
        const normalizeName = (contact) =>
            `${contact.first_name || ""} ${contact.last_name || ""}`
                .trim()
                .toLowerCase();
        list.sort((a, b) => normalizeName(b).localeCompare(normalizeName(a)));
    }
    return list;
});

// Computed property for the grid template columns based on columnCount
const gridColumns = computed(() => {
    // Ensure columnCount is between 1 and 6
    const count = Math.max(1, Math.min(6, columnCount.value));
    return `repeat(${count}, 1fr)`;
});

onMounted(fetchContacts);
</script>

<template>
    <section class="team-assign-panel">
        <h2>Team assignment + project view</h2>

        <div class="controls">
            <label>
                Select team:
                <select v-model="selectedTeam">
                    <option value="">All teams</option>
                    <option v-for="team in teams" :key="team" :value="team">
                        {{ team }}
                    </option>
                </select>
            </label>

            <label>
                Sort by:
                <select v-model="sortOption">
                    <option value="deadlineAsc">
                        Deadline (soonest first)
                    </option>
                    <option value="deadlineDesc">
                        Deadline (latest first)
                    </option>
                    <option value="premiumHigh">Premium first</option>
                    <option value="premiumLow">Premium last</option>
                    <option value="nameAsc">Name A-Z</option>
                    <option value="nameDesc">Name Z-A</option>
                </select>
            </label>

            <label>
                Columns:
                <input
                    type="number"
                    v-model.number="columnCount"
                    min="1"
                    max="6"
                />
            </label>
        </div>

        <div v-if="fetchError" class="error">
            Error loading contacts: {{ fetchError.message || fetchError }}
        </div>
        <div v-else-if="isLoading" class="loading">Loading contacts...</div>
        <div v-else>
            <div v-if="sortedContacts.length === 0" class="no-projects">
                No matching projects found.
            </div>
            <div
                class="projects-list"
                :style="{ 'grid-template-columns': gridColumns }"
            >
                <div
                    v-for="contact in sortedContacts"
                    :key="contact.id"
                    class="project-card"
                >
                    <h3>{{ contact.company_name || "Unnamed project" }}</h3>
                    <p><strong>Team:</strong> {{ getAssignedTeam(contact) }}</p>
                    <p>
                        <strong>Category:</strong>
                        {{ contact.category || "N/A" }}
                    </p>
                    <p>
                        <strong>Name:</strong> {{ contact.first_name || "N/A" }}
                        {{ contact.last_name || "N/A" }}
                    </p>
                    <p>
                        <strong>Deadline:</strong>
                        {{ contact.deadline_time || "N/A" }}
                    </p>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.team-assign-panel {
    min-height: 100vh;
    background-color: #ffffff;
    padding: 3rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
}

/* Improved H2 styling */
.team-assign-panel h2 {
    /* H2: Sora Extra Bold 40pt */
    font-family: "Sora", sans-serif;
    font-weight: 800;
    font-size: 2.5rem; /* 40pt */
    margin: 0 0 2rem 0;
    color: #171642;
    text-align: center;
    width: 100%;
}

.controls {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
    margin-bottom: 2rem;
    width: 100%;
    max-width: 1200px;
    justify-content: center;
}

/* Enhanced label styling */
label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 180px;
}

/* Improved select styling */
label select,
label input[type="number"] {
    padding: 0.75rem 1rem;
    font-size: 1rem;
    font-family: "Red Hat Text", sans-serif;
    color: #171642;
    background: rgba(255, 255, 255, 0.9);
    border: 1.5px solid #cacadd;
    border-radius: 0.5rem;
    outline: none;
    transition: all 0.3s ease;
    cursor: pointer;
}

label select:focus,
label input[type="number"]:focus {
    border-color: #0fefaa;
    box-shadow: 0 0 0 3px rgba(15, 250, 170, 0.1);
    background: rgba(255, 255, 255, 1);
}

label select:hover,
label input[type="number"]:hover {
    border-color: #676789;
    background: rgba(255, 255, 255, 0.95);
}

/* Enhanced project card styling */
.project-card {
    background: rgba(255, 255, 255, 0.8);
    border: 1.5px solid #cacadd;
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.project-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 0.5rem 1.5rem rgba(15, 250, 170, 0.2);
    background: rgba(255, 255, 255, 0.9);
}

/* Enhanced typography inside cards */
.project-card h3 {
    /* H3: Sora Extra Bold 30pt */
    font-family: "Sora", sans-serif;
    font-weight: 800;
    font-size: 1.875rem; /* 30pt */
    margin: 0 0 0.75rem 0;
    color: #171642;
}

.project-card p {
    /* P1: Red Hat Text Regular 20pt for labels, but we'll use slightly smaller for values */
    font-family: "Red Hat Text", sans-serif;
    font-weight: 400;
    font-size: 1rem; /* 16pt for labels, values will be slightly larger */
    margin: 0.25rem 0;
    line-height: 1.4;
}

/* Make the value text slightly stronger */
.project-card p strong {
    font-weight: 600;
    color: #171642;
}

/* Projects list grid - responsive to column count */
.projects-list {
    display: grid;
    gap: 1.5rem;
    width: 100%;
    max-width: 1500px;
    /* The grid-template-columns will be set dynamically via inline style */
}

/* Responsive design */
@media (max-width: 768px) {
    .team-assign-panel {
        padding: 2rem 1rem;
    }

    .controls {
        flex-direction: column;
        align-items: stretch;
    }

    label {
        min-width: 100%;
    }

    .projects-list {
        gap: 1rem;
    }

    .project-card h3 {
        font-size: 1.625rem; /* 26pt */
    }

    .project-card p {
        font-size: 0.875rem; /* 14pt */
    }
}
</style>
