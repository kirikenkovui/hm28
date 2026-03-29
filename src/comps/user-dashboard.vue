<script setup>
import { ref, computed, onMounted } from "vue";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "vue-router";

const supabaseUrl = "https://uvzsspviybmxcwyffpkh.supabase.co";
const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZ" +
    "SIsInJlZiI6InV2enNzcHZpeWJteGN3eWZmcGtoIiwicm9sZSI6ImFub24i" +
    "LCJpYXQiOjE3NzQ2NDc2OTQsImV4cCI6MjA5MDIyMzY5NH0.fdXoza3nO" +
    "W7NXNSFJi0aVgf1ZX6hMoKfQ0oiysftUdc";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const router = useRouter();

// --- Session ---
const session      = ref(null);
const userEmail    = ref("");
const userUsername = ref("");

function getSession() {
    try { return JSON.parse(localStorage.getItem("radianti_session") || "null"); }
    catch { return null; }
}

// --- Contacts ---
const contacts    = ref([]);
const isLoading   = ref(false);
const fetchError  = ref(null);
const expandedId  = ref(null);

// --- Read-only status data from localStorage (written by back-end.vue) ---
const requestStates = ref({});

function loadModeratorData() {
    try { requestStates.value = JSON.parse(localStorage.getItem("requestStates") || "{}"); }
    catch { requestStates.value = {}; }
}

function getRequestState(contact) {
    return requestStates.value[String(contact.id)] || contact.state || "pending";
}

// --- Team mapping (same as back-end) ---
const teamCategoryMap = {
    "Investment Team":       ["investory", "investment_deal"],
    "Public Affairs Team":   ["government", "pr_marketing", "mna"],
    "Startup Support Team":  ["startup", "operators", "service_providers"],
    "Talent Acquisition Team": ["talent_recruiting", "mentors", "networking"],
    "Social Impact Team":    ["non_profit", "media"],
};
const categoryToTeam = Object.entries(teamCategoryMap).reduce((acc, [team, cats]) => {
    cats.forEach((c) => { acc[c] = team; });
    return acc;
}, {});

function getAssignedTeam(contact) {
    const key = contact?.category?.toString().replace(/\s+/g, "_").toLowerCase() || "";
    return categoryToTeam[key] || "Unassigned";
}

const toDisplayName = (key) =>
    (key || "").replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

function formatDeadline(val) {
    if (!val) return "No deadline";
    const d = new Date(val);
    return Number.isNaN(d.getTime())
        ? val
        : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const stateColors = { pending: "#cacadd", "in-progress": "#11ede2", done: "#0fefaa" };

// --- Fetch contacts matching this user's email ---
async function fetchMyRequests() {
    if (!userEmail.value) return;
    isLoading.value  = true;
    fetchError.value = null;

    const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .ilike("email", userEmail.value)
        .order("id", { ascending: false });

    if (error) {
        fetchError.value = error;
        contacts.value   = [];
    } else {
        contacts.value = data;
    }
    isLoading.value = false;
}

function toggleExpanded(id) {
    expandedId.value = expandedId.value === id ? null : id;
}

onMounted(() => {
    const s = getSession();
    if (!s || s.role !== "user") {
        // Not logged in as a user — redirect home
        router.push("/");
        return;
    }
    session.value      = s;
    userEmail.value    = s.email || "";
    userUsername.value = s.username || "";

    loadModeratorData();
    fetchMyRequests();
});
</script>

<template>
    <div class="page-wrapper">
        <div class="bg-circle"></div>

        <div class="panel-content">
            <!-- Header -->
            <div class="panel-header">
                <RouterLink to="/" class="back-link">← Home</RouterLink>
                <h1 class="panel-title">My Requests</h1>
                <p class="panel-subtitle" v-if="userUsername">
                    Logged in as <strong>{{ userUsername }}</strong>
                    <span v-if="userEmail"> · {{ userEmail }}</span>
                </p>
            </div>

            <!-- Refresh -->
            <div class="top-actions">
                <button class="action-btn action-btn--primary" @click="fetchMyRequests" :disabled="isLoading">
                    {{ isLoading ? "Refreshing…" : "↻ Refresh" }}
                </button>
            </div>

            <!-- States -->
            <div v-if="fetchError" class="state-msg state-msg--error">
                ⚠️ {{ fetchError.message || fetchError }}
            </div>
            <div v-else-if="isLoading" class="state-msg">Loading your requests…</div>

            <template v-else>
                <!-- Empty -->
                <div v-if="contacts.length === 0" class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p class="empty-title">No requests found</p>
                    <p class="empty-sub">
                        We couldn't find any submissions linked to
                        <strong>{{ userEmail }}</strong>.<br/>
                        Make sure you used the same email when filling the form.
                    </p>
                    <RouterLink to="/detail/front">
                        <button class="action-btn action-btn--primary" style="margin-top:1rem;">
                            Submit a Request
                        </button>
                    </RouterLink>
                </div>

                <!-- Cards -->
                <div v-else class="cards-list">
                    <div
                        v-for="contact in contacts"
                        :key="contact.id"
                        class="request-card"
                        :class="{ 'request-card--expanded': expandedId === contact.id }"
                    >
                        <!-- Card header (always visible) -->
                        <div class="card-header" @click="toggleExpanded(contact.id)">
                            <div class="card-header-left">
                                <span class="card-company">
                                    {{ contact.company_name || (contact.first_name + " " + contact.last_name).trim() || "Unnamed" }}
                                </span>
                                <!-- Status pill -->
                                <span
                                    class="status-pill"
                                    :style="{
                                        background: stateColors[getRequestState(contact)] + '22',
                                        color: stateColors[getRequestState(contact)],
                                        borderColor: stateColors[getRequestState(contact)]
                                    }"
                                >{{ getRequestState(contact) }}</span>
                            </div>
                            <div class="card-header-right">
                                <span class="card-meta">{{ toDisplayName(contact.category) }}</span>
                                <span class="expand-caret">{{ expandedId === contact.id ? '▲' : '▼' }}</span>
                            </div>
                        </div>

                        <!-- Expanded body -->
                        <Transition name="slide">
                            <div v-if="expandedId === contact.id" class="card-body">

                                <!-- Progress tracker -->
                                <div class="progress-track">
                                    <div
                                        v-for="step in ['pending', 'in-progress', 'done']"
                                        :key="step"
                                        class="progress-step"
                                        :class="{
                                            'progress-step--active': getRequestState(contact) === step,
                                            'progress-step--done':
                                                ['pending','in-progress','done'].indexOf(getRequestState(contact)) >
                                                ['pending','in-progress','done'].indexOf(step)
                                        }"
                                    >
                                        <div class="step-dot"></div>
                                        <span class="step-label">{{ step }}</span>
                                    </div>
                                    <div class="progress-line"></div>
                                </div>

                                <!-- Info grid: status + team only -->
                                <div class="info-grid">
                                    <div class="info-cell">
                                        <span class="info-label">Assigned Team</span>
                                        <span class="info-value">{{ getAssignedTeam(contact) }}</span>
                                    </div>
                                    <div class="info-cell">
                                        <span class="info-label">Category</span>
                                        <span class="info-value">{{ toDisplayName(contact.category) }}</span>
                                    </div>
                                </div>

                            </div>
                        </Transition>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
/* Page shell */
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
    opacity: 0.45;
}

.panel-content {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 820px;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

/* Header */
.panel-header { display: flex; flex-direction: column; gap: 0.5rem; }

.back-link {
    font-family: "Red Hat Text", sans-serif;
    font-weight: 600;
    font-size: 0.9rem;
    color: #171642;
    text-decoration: none;
    opacity: 0.6;
    transition: opacity 0.2s;
    width: fit-content;
}
.back-link:hover { opacity: 1; }

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
    font-size: 1rem;
    color: #171642;
    opacity: 0.65;
    margin: 0;
}

/* Top actions */
.top-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }

.action-btn {
    padding: 0.65rem 1.5rem;
    font-family: "Red Hat Text", sans-serif;
    font-weight: 700;
    font-size: 0.9rem;
    border-radius: 2rem;
    border: 2px solid #171642;
    cursor: pointer;
    transition: all 0.25s;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    white-space: nowrap;
}
.action-btn--primary { background: #171642; color: #ffffff; border-color: #171642; }
.action-btn--primary:hover { background: #2a2870; border-color: #2a2870; }
.action-btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }

/* State messages */
.state-msg {
    font-family: "Red Hat Text", sans-serif;
    font-size: 1rem;
    color: #171642;
    opacity: 0.65;
    text-align: center;
    padding: 2rem 0;
}
.state-msg--error { opacity: 1; color: #c0392b; }

/* Empty state */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    background: rgba(255,255,255,0.6);
    border-radius: 1.5rem;
    padding: 3rem 2rem;
    text-align: center;
    backdrop-filter: blur(8px);
}
.empty-icon { font-size: 3rem; }
.empty-title {
    font-family: "Sora", sans-serif;
    font-weight: 800;
    font-size: 1.3rem;
    color: #171642;
    margin: 0;
}
.empty-sub {
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.95rem;
    color: #676789;
    line-height: 1.6;
    margin: 0;
}

/* Cards list */
.cards-list { display: flex; flex-direction: column; gap: 0.85rem; }

/* Request card */
.request-card {
    background: #ffffff;
    border-radius: 1.25rem;
    box-shadow: 0 4px 18px rgba(23,22,66,0.07);
    overflow: hidden;
    transition: border-color 0.25s, box-shadow 0.25s;
}
.request-card:hover { border-color: #171642; box-shadow: 0 8px 28px rgba(23,22,66,0.12); }
.request-card--expanded { border-color: #171642; }

/* Card header */
.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.1rem 1.4rem;
    cursor: pointer;
    flex-wrap: wrap;
}

.card-header-left { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }

.card-company {
    font-family: "Sora", sans-serif;
    font-weight: 800;
    font-size: 1rem;
    color: #171642;
}

.status-pill {
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
    border-radius: 2rem;
    padding: 0.2rem 0.65rem;
    border: 1.5px solid;
    white-space: nowrap;
}

.card-header-right { display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0; }

.card-meta {
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.82rem;
    color: #676789;
}

.expand-caret { font-size: 0.7rem; color: #171642; opacity: 0.4; user-select: none; }

/* Card body */
.card-body {
    padding: 0 1.4rem 1.4rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    border-top: 1.5px solid #f0f0f8;
    padding-top: 1.25rem;
}

/* Progress tracker */
.progress-track {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 0.5rem 0 0.25rem;
}

.progress-line {
    position: absolute;
    top: 1rem;
    left: 1rem;
    right: 1rem;
    height: 2px;
    background: #e0e0f0;
    z-index: 0;
}

.progress-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    z-index: 1;
    flex: 1;
}

.step-dot {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #e0e0f0;
    border: 2px solid #cacadd;
    transition: all 0.3s;
}

.progress-step--active .step-dot {
    background: #0fefaa;
    border-color: #0fefaa;
    box-shadow: 0 0 0 4px rgba(15,239,170,0.2);
}

.progress-step--done .step-dot {
    background: #171642;
    border-color: #171642;
}

.step-label {
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #cacadd;
    transition: color 0.3s;
}

.progress-step--active .step-label { color: #171642; }
.progress-step--done .step-label { color: #676789; }

/* Info grid */
.info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem 1.5rem;
}

.info-cell { display: flex; flex-direction: column; gap: 0.25rem; }

.info-label {
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #171642;
    opacity: 0.45;
}

.info-value {
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: #171642;
}

.priority-badge {
    display: inline-block;
    border: 1.5px solid;
    border-radius: 2rem;
    padding: 0.15rem 0.6rem;
    font-size: 0.78rem;
    width: fit-content;
}

/* Chips */
.chips-row { display: flex; flex-wrap: wrap; gap: 0.45rem; }

.chip {
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    border: 1.5px solid #cacadd;
    border-radius: 2rem;
    padding: 0.25rem 0.75rem;
    color: #171642;
    white-space: nowrap;
}
.chip--tag { background: #e8fdf5; border-color: #0fefaa; color: #0a8f65; }

/* Description */
.description-block { display: flex; flex-direction: column; gap: 0.4rem; }

.description-text {
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.9rem;
    color: #676789;
    font-style: italic;
    line-height: 1.6;
    margin: 0;
    background: #f8f8fd;
    border-radius: 0.65rem;
    padding: 0.75rem 1rem;
}

/* Notes */
.notes-block { display: flex; flex-direction: column; gap: 0.5rem; }
.notes-block--empty { opacity: 0.6; }

.note-list { display: flex; flex-direction: column; gap: 0.35rem; }

.note-item {
    background: #f4fdfb;
    border-left: 3px solid #0fefaa;
    border-radius: 0 0.5rem 0.5rem 0;
    padding: 0.55rem 0.85rem;
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.875rem;
    color: #171642;
    line-height: 1.5;
}

.note-empty {
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.875rem;
    color: #676789;
    margin: 0;
    font-style: italic;
}

/* Slide transition */
.slide-enter-active { transition: all 0.22s ease; }
.slide-leave-active { transition: all 0.18s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }

/* Responsive */
@media (max-width: 600px) {
    .info-grid { grid-template-columns: 1fr; }
    .panel-title { font-size: 2.2rem; }
}
</style>