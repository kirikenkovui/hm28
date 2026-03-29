<script setup>
import { ref, onMounted, computed } from "vue";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uvzsspviybmxcwyffpkh.supabase.co";
const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZ" +
    "SIsInJlZiI6InV2enNzcHZpeWJteGN3eWZmcGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NDc2OTQsImV4cCI6MjA5MDIyMzY5NH0.fdXoza3nOW7NXNSFJi0aVgf1ZX6hMoKfQ0oiysftUdc";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const contacts = ref([]);
const isLoading = ref(false);
const fetchError = ref(null);
const textSearch = ref("");
const selectedCategory = ref("");
const selectedTag = ref("");
const selectedPremium = ref("");
const selectedRequestState = ref("");
const requestStateOptions = ["pending", "in-progress", "done"];
const commentDrafts = ref({});
const comments = ref({});
const deletedRequests = ref({});
const deletedStorageKey = "deletedRequests";
const hiddenRequests = ref({});
const hiddenStorageKey = "hiddenRequests";
const requestStates = ref({});
const requestStatesStorageKey = "requestStates";
const requestPriority = ref({});
const requestPriorityStorageKey = "requestPriority";
const expandedContactId = ref(null);
const notionSyncStatus = ref("");
const sortOption = ref("deadlineAsc");

const toDisplayName = (key) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

const categoryTags = {
    investory: ["Venture Capital","Angel Investor","Seed","Series A","Private Equity","Exit Strategy"],
    government: ["Grants","Public Policy","Smart City","e-Government","EU Funding","Regulatory Compliance"],
    startup: ["SaaS","FinTech","Scalability","MVP","Bootstrapping","Product Market Fit","Pitch Deck"],
    talent_recruiting: ["Headhunting","Employer Branding","HR Tech","Upskilling","Remote Work","Soft Skills"],
    non_profit: ["Fundraising","Social Impact","Community Building","Volunteerism","Charity","NGO"],
    media: ["Journalism","Content Strategy","Broadcasting","Digital Media","Copywriting","Press Release"],
    operators: ["Logistics","Supply Chain","Infrastructure","Telecommunications","Operations Management"],
    service_providers: ["Consulting","Legal Services","Accounting","Cloud Services","B2B","Outsourcing"],
    mentors: ["Business Coaching","Leadership","Industry Expert","Technical Mentorship","Career Growth","Startup Advisory"],
    investment_deal: ["Due Diligence","Equity","Valuation","Convertible Notes","Cap Table","Term Sheet"],
    pr_marketing: ["Brand Awareness","Crisis Management","Public Relations","Social Media","Influencer Marketing","Reputation Management"],
    mna: ["Mergers","Acquisitions","Integration","Consolidation","Corporate Development","Buyout Strategies"],
    networking: ["B2B Networking","Events","Partnerships","Ecosystems","Business Matchmaking","Referrals"],
};

const teamCategoryMap = {
    "Investment Team": ["investory", "investment_deal"],
    "Public Affairs Team": ["government", "pr_marketing", "mna"],
    "Startup Support Team": ["startup", "operators", "service_providers"],
    "Talent Acquisition Team": ["talent_recruiting", "mentors", "networking"],
    "Social Impact Team": ["non_profit", "media"],
};

const categoryToTeam = Object.entries(teamCategoryMap).reduce((acc, [team, cats]) => {
    cats.forEach((c) => { acc[c] = team; });
    return acc;
}, {});

const NOTION_PROXY_ENDPOINT = "http://localhost:3001/api/notion-pages";

function getAssignedTeam(contact) {
    const key = contact?.category?.toString().replace(/\s+/g, "_").toLowerCase() || "";
    return categoryToTeam[key] || "Unassigned Team";
}

function buildNotionCardBlocks(contact) {
    const commentsText = (comments.value[contact.id] ?? []).join("\n") || "No comments";
    const fieldItems = [
        ["Company", contact.company_name || "N/A"],
        ["Name", `${contact.first_name || ""} ${contact.last_name || ""}`.trim() || "N/A"],
        ["Email", contact.email || "N/A"],
        ["Phone", contact.phone || "N/A"],
        ["Location", contact.location || "N/A"],
        ["Deadline", contact.deadline_time || "N/A"],
        ["Premium", contact.user_premium ? "Yes" : "No"],
        ["Type", contact.business_or_person || "N/A"],
        ["Category", contact.category || "N/A"],
        ["Assigned Team", getAssignedTeam(contact)],
        ["Request State", getRequestState(contact)],
        ["Priority", getRequestPriority(contact)],
        ["Tags", (contact.tags || []).join(", ") || "N/A"],
        ["Notes", commentsText],
    ];
    return [{
        object: "block", type: "callout",
        callout: {
            rich_text: [{ type: "text", text: { content: fieldItems.map(([l, v]) => `${l}: ${v}`).join("\n") } }],
            icon: { type: "emoji", emoji: "📌" },
        },
    }];
}

async function sendContactToNotion(contact) {
    const title = contact.company_name || `${contact.first_name || "Unknown"} ${contact.last_name || ""}`.trim() || "Untitled";
    try {
        const resp = await fetch(NOTION_PROXY_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, children: buildNotionCardBlocks(contact) }),
        });
        if (!resp.ok) return { success: false, errorInfo: await resp.json().catch(() => ({})) };
        return { success: true, data: await resp.json() };
    } catch (error) {
        return { success: false, error };
    }
}

async function sendAllContactsToNotion() {
    notionSyncStatus.value = "Syncing…";
    const toSend = sortedContacts.value.filter((c) => !deletedRequests.value[c.id]);
    const results = [];
    for (const contact of toSend) {
        const result = await sendContactToNotion(contact);
        results.push({ id: contact.id, success: result.success });
    }
    const ok = results.filter((r) => r.success).length;
    notionSyncStatus.value = `Sync complete — ${ok} sent, ${results.length - ok} failed.`;
}

const categoryOptions = computed(() =>
    Object.keys(categoryTags).map((key) => ({ value: key, label: toDisplayName(key) }))
);

const availableTags = computed(() =>
    selectedCategory.value && categoryTags[selectedCategory.value]
        ? categoryTags[selectedCategory.value]
        : []
);

const filteredContacts = computed(() => {
    const text = textSearch.value.trim().toLowerCase();
    return contacts.value.filter((contact) => {
        if (deletedRequests.value[contact.id]) return false;
        const categoryMatch = selectedCategory.value
            ? contact.category?.toString().toLowerCase() === selectedCategory.value
            : true;
        const tagMatch = selectedTag.value
            ? (contact.tags || []).some((t) => t.toLowerCase() === selectedTag.value.toLowerCase())
            : true;
        const premiumMatch = selectedPremium.value
            ? selectedPremium.value === "premium" ? contact.user_premium === true : contact.user_premium === false
            : true;
        const requestStateMatch = selectedRequestState.value
            ? getRequestState(contact) === selectedRequestState.value
            : true;
        const textMatch = text
            ? [contact.first_name, contact.last_name, contact.company_name, contact.email].some(
                (f) => f && f.toString().toLowerCase().includes(text)
              )
            : true;
        return categoryMatch && tagMatch && premiumMatch && requestStateMatch && textMatch;
    });
});

const requestStateOrder = ["pending", "in-progress", "done"];

const sortedContacts = computed(() => {
    const list = [...filteredContacts.value];
    const name = (c) => `${c.first_name || ""} ${c.last_name || ""}`.trim().toLowerCase();
    const deadline = (c) => {
        const d = c.deadline_time ? new Date(c.deadline_time) : null;
        return d && !Number.isNaN(d.getTime()) ? d : new Date(8640000000000000);
    };
    if (sortOption.value === "deadlineAsc") list.sort((a, b) => deadline(a) - deadline(b));
    else if (sortOption.value === "deadlineDesc") list.sort((a, b) => deadline(b) - deadline(a));
    else if (sortOption.value === "premiumHigh") list.sort((a, b) => (b.user_premium ? 1 : 0) - (a.user_premium ? 1 : 0));
    else if (sortOption.value === "premiumLow") list.sort((a, b) => (a.user_premium ? 1 : 0) - (b.user_premium ? 1 : 0));
    else if (sortOption.value === "nameAsc") list.sort((a, b) => name(a).localeCompare(name(b)));
    else if (sortOption.value === "nameDesc") list.sort((a, b) => name(b).localeCompare(name(a)));
    else if (sortOption.value === "stateAsc") list.sort((a, b) => requestStateOrder.indexOf(getRequestState(a)) - requestStateOrder.indexOf(getRequestState(b)));
    else if (sortOption.value === "stateDesc") list.sort((a, b) => requestStateOrder.indexOf(getRequestState(b)) - requestStateOrder.indexOf(getRequestState(a)));
    const visible = list.filter((c) => !hiddenRequests.value[c.id]);
    const hidden = list.filter((c) => hiddenRequests.value[c.id]);
    return visible.concat(hidden);
});

async function fetchContacts() {
    isLoading.value = true;
    fetchError.value = null;
    const { data, error } = await supabase.from("contacts").select("*").order("id", { ascending: false });
    if (error) { fetchError.value = error; contacts.value = []; }
    else contacts.value = data;
    isLoading.value = false;
}

function loadFromStorage(key, ref) {
    try { const s = localStorage.getItem(key); ref.value = s ? JSON.parse(s) : {}; }
    catch { ref.value = {}; }
}
function saveToStorage(key, ref) {
    try { localStorage.setItem(key, JSON.stringify(ref.value)); } catch {}
}

function loadCommentsFromStorage() { loadFromStorage("contactComments", comments); }
function saveCommentsToStorage() { saveToStorage("contactComments", comments); }
function loadDeletedFromStorage() { loadFromStorage(deletedStorageKey, deletedRequests); }
function saveDeletedToStorage() { saveToStorage(deletedStorageKey, deletedRequests); }
function loadHiddenFromStorage() { loadFromStorage(hiddenStorageKey, hiddenRequests); }
function saveHiddenToStorage() { saveToStorage(hiddenStorageKey, hiddenRequests); }
function loadRequestStatesFromStorage() { loadFromStorage(requestStatesStorageKey, requestStates); }
function saveRequestStatesToStorage() { saveToStorage(requestStatesStorageKey, requestStates); }
function loadRequestPriorityFromStorage() { loadFromStorage(requestPriorityStorageKey, requestPriority); }
function saveRequestPriorityToStorage() { saveToStorage(requestPriorityStorageKey, requestPriority); }

function getRequestState(contact) {
    if (!contact?.id) return "pending";
    return requestStates.value[String(contact.id)] || contact.state || "pending";
}
function setRequestState(contactId, state) {
    requestStates.value[String(contactId)] = state;
    saveRequestStatesToStorage();
}
function getRequestPriority(contact) {
    if (!contact?.id) return "needs assignment";
    return requestPriority.value[contact.id] || "needs assignment";
}
function setRequestPriority(contactId, priority) {
    requestPriority.value[contactId] = priority;
    saveRequestPriorityToStorage();
}
function addComment(contactId) {
    const draft = (commentDrafts.value[contactId] || "").trim();
    if (!draft) return;
    if (!comments.value[contactId]) comments.value[contactId] = [];
    comments.value[contactId].push(draft);
    commentDrafts.value[contactId] = "";
    saveCommentsToStorage();
}
function deleteComment(contactId, index) {
    if (!comments.value[contactId]) return;
    comments.value[contactId].splice(index, 1);
    if (!comments.value[contactId].length) delete comments.value[contactId];
    saveCommentsToStorage();
}
function onCommentKeydown(contactId, event) {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); addComment(contactId); }
}
function deleteRequest(contactId) {
    if (!contactId) return;
    deletedRequests.value[contactId] = true;
    saveDeletedToStorage();
}
function toggleHidden(contactId) {
    if (!contactId) return;
    if (hiddenRequests.value[contactId]) delete hiddenRequests.value[contactId];
    else hiddenRequests.value[contactId] = true;
    saveHiddenToStorage();
}
function toggleExpanded(contactId) {
    expandedContactId.value = expandedContactId.value === contactId ? null : contactId;
}
function formatDeadline(val) {
    if (!val) return "No deadline";
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? val : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const priorityColors = { ASAP: "#e03c3c", high: "#e08800", medium: "#0fefaa", low: "#cacadd", "needs assignment": "#cacadd" };
const stateColors = { pending: "#cacadd", "in-progress": "#11ede2", done: "#0fefaa" };

onMounted(() => {
    fetchContacts();
    loadCommentsFromStorage();
    loadDeletedFromStorage();
    loadHiddenFromStorage();
    loadRequestStatesFromStorage();
    loadRequestPriorityFromStorage();
});
</script>

<template>
    <div class="page-wrapper">
        <div class="bg-circle"></div>

        <div class="panel-content">

            <!-- ── Header ── -->
            <div class="panel-header">
                <RouterLink to="/detail/back" class="back-link">← Dashboard</RouterLink>
                <h1 class="panel-title">Request Search</h1>
                <p class="panel-subtitle">{{ sortedContacts.length }} contact{{ sortedContacts.length !== 1 ? 's' : '' }} shown</p>
            </div>

            <!-- ── Top Actions ── -->
            <div class="top-actions">
                <button class="action-btn action-btn--primary" @click="fetchContacts" :disabled="isLoading">
                    {{ isLoading ? "Refreshing…" : "↻ Refresh" }}
                </button>
                <button class="action-btn action-btn--notion" @click="sendAllContactsToNotion" :disabled="isLoading">
                    📋 Sync to Notion
                </button>
                <RouterLink to="/detail/teamassign" class="action-btn action-btn--outline">
                    👥 Team View
                </RouterLink>
                <span v-if="notionSyncStatus" class="sync-status">{{ notionSyncStatus }}</span>
            </div>

            <!-- ── Error / Loading ── -->
            <div v-if="fetchError" class="state-msg state-msg--error">
                ⚠️ {{ fetchError.message || fetchError }}
            </div>
            <div v-else-if="isLoading" class="state-msg">Loading contacts…</div>

            <template v-else>
                <!-- ── Filters ── -->
                <div class="filters-bar">
                    <div class="filter-group filter-group--wide">
                        <label class="filter-label">Search</label>
                        <input
                            v-model="textSearch"
                            type="text"
                            class="filter-input"
                            placeholder="Name, company, email…"
                        />
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Category</label>
                        <select class="filter-input" v-model="selectedCategory" @change="selectedTag = ''">
                            <option value="">All categories</option>
                            <option v-for="item in categoryOptions" :key="item.value" :value="item.value">
                                {{ item.label }}
                            </option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Tag</label>
                        <select class="filter-input" v-model="selectedTag" :disabled="!selectedCategory">
                            <option value="">All tags</option>
                            <option v-for="tag in availableTags" :key="tag" :value="tag">{{ tag }}</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Premium</label>
                        <select class="filter-input" v-model="selectedPremium">
                            <option value="">All</option>
                            <option value="premium">Premium</option>
                            <option value="standard">Standard</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Status</label>
                        <select class="filter-input" v-model="selectedRequestState">
                            <option value="">All</option>
                            <option v-for="stage in requestStateOptions" :key="stage" :value="stage">{{ stage }}</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Sort</label>
                        <select class="filter-input" v-model="sortOption">
                            <option value="deadlineAsc">Deadline ↑</option>
                            <option value="deadlineDesc">Deadline ↓</option>
                            <option value="premiumHigh">Premium first</option>
                            <option value="premiumLow">Premium last</option>
                            <option value="nameAsc">Name A → Z</option>
                            <option value="nameDesc">Name Z → A</option>
                            <option value="stateAsc">State: pending → done</option>
                            <option value="stateDesc">State: done → pending</option>
                        </select>
                    </div>
                </div>

                <!-- ── Empty state ── -->
                <div v-if="sortedContacts.length === 0" class="state-msg">
                    No contacts match your filters.
                </div>

                <!-- ── Cards ── -->
                <div v-else class="cards-grid">
                    <div
                        v-for="contact in sortedContacts"
                        :key="contact.id"
                        :class="['contact-card', { 'contact-card--hidden': hiddenRequests[contact.id], 'contact-card--expanded': expandedContactId === contact.id }]"
                    >
                        <!-- Collapsed header (always visible) -->
                        <div class="card-header" @click="toggleExpanded(contact.id)">
                            <div class="card-header-left">
                                <span class="card-company">{{ contact.company_name || "Unnamed" }}</span>
                                <span
                                    class="state-pill"
                                    :style="{ background: stateColors[getRequestState(contact)] + '22', color: stateColors[getRequestState(contact)], borderColor: stateColors[getRequestState(contact)] }"
                                >{{ getRequestState(contact) }}</span>
                                <span v-if="contact.user_premium" class="premium-pill">★ Premium</span>
                            </div>
                            <div class="card-header-right">
                                <span class="card-meta">
                                    {{ contact.first_name || "" }} {{ contact.last_name || "" }}
                                    <template v-if="contact.category"> · {{ toDisplayName(contact.category) }}</template>
                                </span>
                                <div class="card-actions">
                                    <button class="btn-action btn-hide" @click.stop="toggleHidden(contact.id)">
                                        {{ hiddenRequests[contact.id] ? 'Show' : 'Hide' }}
                                    </button>
                                    <button class="btn-action btn-delete" @click.stop="deleteRequest(contact.id)">Delete</button>
                                    <span class="expand-caret">{{ expandedContactId === contact.id ? '▲' : '▼' }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Expanded details -->
                        <Transition name="slide">
                            <div v-if="expandedContactId === contact.id" class="card-body">

                                <!-- Identity block -->
                                <div class="detail-section">
                                    <p class="detail-name">{{ contact.first_name || "" }} {{ contact.last_name || "" }}</p>
                                    <p v-if="contact.short_description" class="detail-description">{{ contact.short_description }}</p>
                                </div>

                                <!-- Info chips -->
                                <div class="chips-row">
                                    <span class="chip">📅 {{ formatDeadline(contact.deadline_time) }}</span>
                                    <span class="chip">{{ contact.business_or_person || 'N/A' }}</span>
                                    <span class="chip">{{ toDisplayName(contact.category || 'uncategorized') }}</span>
                                    <span class="chip">{{ getAssignedTeam(contact) }}</span>
                                </div>

                                <!-- Contact info -->
                                <div class="chips-row">
                                    <span v-if="contact.email" class="chip chip--contact">✉ {{ contact.email }}</span>
                                    <span v-if="contact.phone" class="chip chip--contact">📞 {{ contact.phone }}</span>
                                    <span v-if="contact.location" class="chip chip--contact">📍 {{ contact.location }}</span>
                                    <a v-if="contact.linkedin_profile" :href="contact.linkedin_profile" target="_blank" class="chip chip--link">LinkedIn ↗</a>
                                </div>

                                <!-- Tags -->
                                <div v-if="contact.tags && contact.tags.length" class="chips-row">
                                    <span v-for="tag in contact.tags" :key="tag" class="chip chip--tag">{{ tag }}</span>
                                </div>

                                <!-- State + Priority selects -->
                                <div class="selects-row">
                                    <div class="select-group">
                                        <label class="select-label">State</label>
                                        <select
                                            class="inline-select"
                                            :value="getRequestState(contact)"
                                            :style="{ borderColor: stateColors[getRequestState(contact)] }"
                                            @change="(e) => setRequestState(contact.id, e.target.value)"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="done">Done</option>
                                        </select>
                                    </div>
                                    <div class="select-group">
                                        <label class="select-label">Priority</label>
                                        <select
                                            class="inline-select"
                                            :value="getRequestPriority(contact)"
                                            :style="{ borderColor: priorityColors[getRequestPriority(contact)] }"
                                            @change="(e) => setRequestPriority(contact.id, e.target.value)"
                                        >
                                            <option value="needs assignment">Needs assignment</option>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="ASAP">ASAP</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Comments -->
                                <div class="comments-section">
                                    <p class="select-label">Notes</p>
                                    <div v-if="comments[contact.id] && comments[contact.id].length" class="comment-list">
                                        <div
                                            v-for="(c, idx) in comments[contact.id]"
                                            :key="`${contact.id}-${idx}`"
                                            class="comment-item"
                                        >
                                            <span>{{ c }}</span>
                                            <button class="btn-delete-comment" @click="deleteComment(contact.id, idx)">×</button>
                                        </div>
                                    </div>
                                    <div class="comment-input-row">
                                        <input
                                            type="text"
                                            class="comment-input"
                                            v-model="commentDrafts[contact.id]"
                                            @keydown="(e) => onCommentKeydown(contact.id, e)"
                                            placeholder="Add a note and press Enter…"
                                        />
                                        <button class="btn-add-comment" @click="addComment(contact.id)">Add</button>
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
/* ── Page shell ── */
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
    max-width: 1100px;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

/* ── Header ── */
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
    opacity: 0.6;
    margin: 0;
}

/* ── Top actions ── */
.top-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-items: center;
}

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

.action-btn--primary {
    background: #171642;
    color: #ffffff;
    border-color: #171642;
}
.action-btn--primary:hover { background: #2a2870; border-color: #2a2870; }
.action-btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }

.action-btn--notion {
    background: #ffffff;
    color: #171642;
    border-color: #171642;
}
.action-btn--notion:hover { background: #171642; color: #ffffff; }

.action-btn--outline {
    background: transparent;
    color: #171642;
    border-color: #171642;
}
.action-btn--outline:hover { background: #171642; color: #ffffff; }

.sync-status {
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.85rem;
    color: #171642;
    opacity: 0.7;
    padding-left: 0.5rem;
}

/* ── State messages ── */
.state-msg {
    font-family: "Red Hat Text", sans-serif;
    font-size: 1rem;
    color: #171642;
    opacity: 0.65;
    text-align: center;
    padding: 2rem 0;
}
.state-msg--error { opacity: 1; color: #c0392b; }

/* ── Filters ── */
.filters-bar {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    align-items: flex-end;
    background: rgba(255,255,255,0.55);
    border-radius: 1.25rem;
    padding: 1.25rem 1.5rem;
    backdrop-filter: blur(8px);
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    flex: 1;
    min-width: 140px;
}
.filter-group--wide { min-width: 220px; flex: 2; }

.filter-label {
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    color: #171642;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    opacity: 0.65;
}

.filter-input {
    padding: 0.65rem 0.9rem;
    font-size: 0.9rem;
    font-family: "Red Hat Text", sans-serif;
    color: #171642;
    background: #ffffff;
    border: 2px solid transparent;
    border-radius: 0.75rem;
    outline: none;
    transition: border-color 0.2s;
    box-shadow: 0 2px 8px rgba(23,22,66,0.06);
}
.filter-input:focus { border-color: #171642; }

/* ── Cards grid ── */
.cards-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

/* ── Contact card ── */
.contact-card {
    background: #ffffff;
    border-radius: 1.25rem;
    border: 2px solid transparent;
    box-shadow: 0 4px 18px rgba(23,22,66,0.07);
    overflow: hidden;
    transition: border-color 0.25s, box-shadow 0.25s;
}
.contact-card:hover { border-color: #171642; box-shadow: 0 8px 28px rgba(23,22,66,0.12); }
.contact-card--hidden { opacity: 0.4; border-style: dashed; }
.contact-card--expanded { border-color: #171642; }

/* ── Card header (always visible) ── */
.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.1rem 1.4rem;
    cursor: pointer;
    flex-wrap: wrap;
}

.card-header-left {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
}

.card-company {
    font-family: "Sora", sans-serif;
    font-weight: 800;
    font-size: 1rem;
    color: #171642;
}

.state-pill, .premium-pill {
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
    border-radius: 2rem;
    padding: 0.2rem 0.65rem;
    border: 1.5px solid;
    white-space: nowrap;
}

.premium-pill {
    background: #171642;
    color: #0fefaa;
    border-color: #171642;
}

.card-header-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    flex-shrink: 0;
}

.card-meta {
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.82rem;
    color: #676789;
}

.card-actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.btn-action {
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.25rem 0.75rem;
    border-radius: 2rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-hide { background: #f0f0f8; color: #676789; }
.btn-hide:hover { background: #171642; color: #ffffff; }

.btn-delete { background: #fff0f0; color: #cc0000; }
.btn-delete:hover { background: #cc0000; color: #ffffff; }

.expand-caret {
    font-size: 0.7rem;
    color: #171642;
    opacity: 0.4;
    user-select: none;
}

/* ── Card body (expanded) ── */
.card-body {
    padding: 0 1.4rem 1.4rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    border-top: 1.5px solid #f0f0f8;
    padding-top: 1.1rem;
}

.detail-section { display: flex; flex-direction: column; gap: 0.3rem; }
.detail-name {
    font-family: "Sora", sans-serif;
    font-weight: 800;
    font-size: 1.05rem;
    color: #171642;
    margin: 0;
}
.detail-description {
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.9rem;
    color: #676789;
    font-style: italic;
    margin: 0;
    line-height: 1.5;
}

/* ── Chips ── */
.chips-row { display: flex; flex-wrap: wrap; gap: 0.45rem; }

.chip {
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    background: #f4fdfb;
    border: 1.5px solid #cacadd;
    border-radius: 2rem;
    padding: 0.25rem 0.75rem;
    color: #171642;
    white-space: nowrap;
}
.chip--contact { background: #f0f0f8; border-color: #d0d0e8; }
.chip--tag { background: #e8fdf5; border-color: #0fefaa; color: #0a8f65; }
.chip--link {
    text-decoration: none;
    background: #171642;
    color: #0fefaa;
    border-color: #171642;
    transition: opacity 0.2s;
}
.chip--link:hover { opacity: 0.8; }

/* ── Selects row ── */
.selects-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.select-group {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    flex: 1;
    min-width: 140px;
}

.select-label {
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #171642;
    opacity: 0.5;
    margin: 0;
}

.inline-select {
    padding: 0.5rem 0.75rem;
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.875rem;
    color: #171642;
    background: #ffffff;
    border: 2px solid #cacadd;
    border-radius: 0.65rem;
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s;
}
.inline-select:focus { border-color: #171642; }

/* ── Comments ── */
.comments-section {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
}

.comment-list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.comment-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f4fdfb;
    border-radius: 0.6rem;
    padding: 0.45rem 0.75rem;
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.875rem;
    color: #171642;
    gap: 0.5rem;
}

.btn-delete-comment {
    background: none;
    border: none;
    color: #cacadd;
    font-size: 1.1rem;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    flex-shrink: 0;
    transition: color 0.2s;
}
.btn-delete-comment:hover { color: #cc0000; }

.comment-input-row {
    display: flex;
    gap: 0.5rem;
}

.comment-input {
    flex: 1;
    padding: 0.55rem 0.9rem;
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.875rem;
    color: #171642;
    background: #ffffff;
    border: 2px solid #cacadd;
    border-radius: 0.65rem;
    outline: none;
    transition: border-color 0.2s;
}
.comment-input:focus { border-color: #171642; }

.btn-add-comment {
    padding: 0.55rem 1.25rem;
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.875rem;
    font-weight: 700;
    background: #171642;
    color: #ffffff;
    border: none;
    border-radius: 0.65rem;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
}
.btn-add-comment:hover { background: #2a2870; }

/* ── Slide transition ── */
.slide-enter-active { transition: all 0.22s ease; }
.slide-leave-active { transition: all 0.18s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }

/* ── Responsive ── */
@media (max-width: 768px) {
    .panel-title { font-size: 2.4rem; }
    .bg-circle { display: none; }
    .filters-bar { flex-direction: column; }
    .filter-group, .filter-group--wide { min-width: 100%; flex: unset; }
    .card-header { flex-direction: column; align-items: flex-start; }
    .card-header-right { width: 100%; justify-content: space-between; }
    .selects-row { flex-direction: column; }
}
</style>
