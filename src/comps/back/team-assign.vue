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
const columnCount = ref(3);

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
        const d = contact.deadline_time ? new Date(contact.deadline_time) : null;
        return d && !Number.isNaN(d.getTime()) ? d : new Date(8640000000000000);
    };

    if (sortOption.value === "deadlineAsc") {
        list.sort((a, b) => parseDeadline(a) - parseDeadline(b));
    } else if (sortOption.value === "deadlineDesc") {
        list.sort((a, b) => parseDeadline(b) - parseDeadline(a));
    } else if (sortOption.value === "premiumHigh") {
        list.sort((a, b) => (b.user_premium ? 1 : 0) - (a.user_premium ? 1 : 0));
    } else if (sortOption.value === "premiumLow") {
        list.sort((a, b) => (a.user_premium ? 1 : 0) - (b.user_premium ? 1 : 0));
    } else if (sortOption.value === "nameAsc") {
        const name = (c) => `${c.first_name || ""} ${c.last_name || ""}`.trim().toLowerCase();
        list.sort((a, b) => name(a).localeCompare(name(b)));
    } else if (sortOption.value === "nameDesc") {
        const name = (c) => `${c.first_name || ""} ${c.last_name || ""}`.trim().toLowerCase();
        list.sort((a, b) => name(b).localeCompare(name(a)));
    }
    return list;
});

const gridColumns = computed(() => {
    const count = Math.max(1, Math.min(6, columnCount.value));
    return `repeat(${count}, 1fr)`;
});

function formatDeadline(val) {
    if (!val) return "No deadline";
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return val;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

onMounted(fetchContacts);
</script>

<template>
    <div class="page-wrapper">
        <!-- Decorative circle -->
        <div class="bg-circle"></div>

        <div class="panel-content">
            <!-- Header -->
            <div class="panel-header">
                <RouterLink to="/detail/back" class="back-link">← Dashboard</RouterLink>
                <h1 class="panel-title">Team Assignment</h1>
                <p class="panel-subtitle">Project view by team</p>
            </div>

            <!-- Controls -->
            <div class="controls-bar">
                <div class="control-group">
                    <label class="control-label">Team</label>
                    <select v-model="selectedTeam" class="control-select">
                        <option value="">All teams</option>
                        <option v-for="team in teams" :key="team" :value="team">
                            {{ team }}
                        </option>
                    </select>
                </div>

                <div class="control-group">
                    <label class="control-label">Sort by</label>
                    <select v-model="sortOption" class="control-select">
                        <option value="deadlineAsc">Deadline — soonest first</option>
                        <option value="deadlineDesc">Deadline — latest first</option>
                        <option value="premiumHigh">Premium first</option>
                        <option value="premiumLow">Premium last</option>
                        <option value="nameAsc">Name A → Z</option>
                        <option value="nameDesc">Name Z → A</option>
                    </select>
                </div>

                <div class="control-group control-group--narrow">
                    <label class="control-label">Columns</label>
                    <input
                        type="number"
                        v-model.number="columnCount"
                        min="1"
                        max="6"
                        class="control-select"
                    />
                </div>
            </div>

            <!-- States -->
            <div v-if="fetchError" class="state-msg state-msg--error">
                ⚠️ Error loading contacts: {{ fetchError.message || fetchError }}
            </div>
            <div v-else-if="isLoading" class="state-msg">
                Loading projects...
            </div>
            <div v-else-if="sortedContacts.length === 0" class="state-msg">
                No matching projects found.
            </div>

            <!-- Cards grid -->
            <div
                v-else
                class="projects-grid"
                :style="{ 'grid-template-columns': gridColumns }"
            >
                <div
                    v-for="contact in sortedContacts"
                    :key="contact.id"
                    class="project-card"
                >
                    <div class="card-top">
                        <h3 class="card-company">
                            {{ contact.company_name || "Unnamed project" }}
                        </h3>
                        <span v-if="contact.user_premium" class="premium-badge">★ Premium</span>
                    </div>

                    <div class="card-body">
                        <div class="card-row">
                            <span class="card-label">Team</span>
                            <span class="card-value">{{ getAssignedTeam(contact) }}</span>
                        </div>
                        <div class="card-row">
                            <span class="card-label">Category</span>
                            <span class="card-value">{{ contact.category || "N/A" }}</span>
                        </div>
                        <div class="card-row">
                            <span class="card-label">Contact</span>
                            <span class="card-value">
                                {{ contact.first_name || "" }} {{ contact.last_name || "N/A" }}
                            </span>
                        </div>
                        <div class="card-row">
                            <span class="card-label">Deadline</span>
                            <span class="card-value">{{ formatDeadline(contact.deadline_time) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* --- Layout --- */
.page-wrapper {
    min-height: 100vh;
    background: linear-gradient(135deg, #0fefaa 0%, #11ede2 100%);
    position: relative;
    overflow-x: hidden;
    padding: 4rem 2rem;
    display: flex;
    justify-content: center;
}

.bg-circle {
    position: fixed;
    right: -220px;
    top: 50%;
    transform: translateY(-50%);
    width: 700px;
    height: 700px;
    border-radius: 50%;
    background: #ffffff;
    z-index: 0;
    pointer-events: none;
    opacity: 0.5;
}

.panel-content {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 1400px;
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
}

/* --- Header --- */
.panel-header {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
}

.back-link {
    font-family: "Red Hat Text", sans-serif;
    font-weight: 600;
    font-size: 0.95rem;
    color: #171642;
    text-decoration: none;
    opacity: 0.6;
    transition: opacity 0.2s;
    width: fit-content;
}

.back-link:hover {
    opacity: 1;
}

.panel-title {
    font-family: "Sora", sans-serif;
    font-weight: 800;
    font-size: 3.375rem;
    color: #171642;
    line-height: 1.1;
    margin: 0;
}

.panel-subtitle {
    font-family: "Red Hat Text", sans-serif;
    font-weight: 400;
    font-size: 1.25rem;
    color: #171642;
    opacity: 0.65;
    margin: 0;
}

/* --- Controls --- */
.controls-bar {
    display: flex;
    gap: 1.25rem;
    flex-wrap: wrap;
    align-items: flex-end;
}

.control-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    flex: 1;
    min-width: 180px;
}

.control-group--narrow {
    max-width: 120px;
    flex: 0 0 auto;
}

.control-label {
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.82rem;
    font-weight: 700;
    color: #171642;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    opacity: 0.7;
}

.control-select {
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
    font-family: "Red Hat Text", sans-serif;
    color: #171642;
    background: #ffffff;
    border: 2px solid transparent;
    border-radius: 0.75rem;
    outline: none;
    transition: all 0.2s ease;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(23, 22, 66, 0.07);
}

.control-select:focus {
    border-color: #171642;
}

/* --- State messages --- */
.state-msg {
    font-family: "Red Hat Text", sans-serif;
    font-size: 1.1rem;
    color: #171642;
    opacity: 0.7;
    padding: 2rem 0;
    text-align: center;
}

.state-msg--error {
    opacity: 1;
    color: #c0392b;
}

/* --- Cards Grid --- */
.projects-grid {
    display: grid;
    gap: 1.25rem;
    width: 100%;
}

.project-card {
    background: #ffffff;
    border-radius: 1.25rem;
    padding: 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    box-shadow: 0 4px 20px rgba(23, 22, 66, 0.06);
    border: 2px solid transparent;
    transition: all 0.3s ease;
}

.project-card:hover {
    transform: translateY(-4px);
    border-color: #171642;
    box-shadow: 0 12px 36px rgba(23, 22, 66, 0.12);
}

/* Card top row */
.card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
}

.card-company {
    font-family: "Sora", sans-serif;
    font-weight: 800;
    font-size: 1.15rem;
    color: #171642;
    margin: 0;
    line-height: 1.3;
}

.premium-badge {
    font-family: "Red Hat Text", sans-serif;
    font-weight: 700;
    font-size: 0.72rem;
    background: #171642;
    color: #0fefaa;
    border-radius: 2rem;
    padding: 0.25rem 0.65rem;
    white-space: nowrap;
    flex-shrink: 0;
}

/* Card data rows */
.card-body {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
}

.card-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.5rem;
}

.card-label {
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    color: #171642;
    opacity: 0.45;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;
}

.card-value {
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.92rem;
    font-weight: 500;
    color: #171642;
    text-align: right;
}

/* --- Responsive --- */
@media (max-width: 900px) {
    .panel-title { font-size: 2.4rem; }
    .bg-circle { display: none; }
    .projects-grid { grid-template-columns: 1fr !important; }
    .control-group { min-width: 100%; }
    .control-group--narrow { max-width: 100%; }
}
</style>