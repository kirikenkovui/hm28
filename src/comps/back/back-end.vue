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
const notionSyncStatus = ref("No notion sync yet");
const sortOption = ref("deadlineAsc");

const toDisplayName = (key) => {
    return key.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
};

const categoryTags = {
    investory: [
        "Venture Capital",
        "Angel Investor",
        "Seed",
        "Series A",
        "Private Equity",
        "Exit Strategy",
    ],
    government: [
        "Grants",
        "Public Policy",
        "Smart City",
        "e-Government",
        "EU Funding",
        "Regulatory Compliance",
    ],
    startup: [
        "SaaS",
        "FinTech",
        "Scalability",
        "MVP",
        "Bootstrapping",
        "Product Market Fit",
        "Pitch Deck",
    ],
    talent_recruiting: [
        "Headhunting",
        "Employer Branding",
        "HR Tech",
        "Upskilling",
        "Remote Work",
        "Soft Skills",
    ],
    non_profit: [
        "Fundraising",
        "Social Impact",
        "Community Building",
        "Volunteerism",
        "Charity",
        "NGO",
    ],
    media: [
        "Journalism",
        "Content Strategy",
        "Broadcasting",
        "Digital Media",
        "Copywriting",
        "Press Release",
    ],
    operators: [
        "Logistics",
        "Supply Chain",
        "Infrastructure",
        "Telecommunications",
        "Operations Management",
    ],
    service_providers: [
        "Consulting",
        "Legal Services",
        "Accounting",
        "Cloud Services",
        "B2B",
        "Outsourcing",
    ],
    mentors: [
        "Business Coaching",
        "Leadership",
        "Industry Expert",
        "Technical Mentorship",
        "Career Growth",
        "Startup Advisory",
    ],
    investment_deal: [
        "Due Diligence",
        "Equity",
        "Valuation",
        "Convertible Notes",
        "Cap Table",
        "Term Sheet",
    ],
    pr_marketing: [
        "Brand Awareness",
        "Crisis Management",
        "Public Relations",
        "Social Media",
        "Influencer Marketing",
        "Reputation Management",
    ],
    mna: [
        "Mergers",
        "Acquisitions",
        "Integration",
        "Consolidation",
        "Corporate Development",
        "Buyout Strategies",
    ],
    networking: [
        "B2B Networking",
        "Events",
        "Partnerships",
        "Ecosystems",
        "Business Matchmaking",
        "Referrals",
    ],
};

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

const NOTION_PROXY_ENDPOINT = "http://localhost:3001/api/notion-pages"; // backend server must be running (npm run server)

// Optional: mapping for text labels, for readability in generated block.
const notionFieldLabels = {
    company_name: "Company",
    first_name: "First Name",
    last_name: "Last Name",
    email: "Email",
    phone: "Phone",
    location: "Location",
    deadline_time: "Deadline",
    user_premium: "Premium",
    business_or_person: "Type",
    category: "Category",
    tags: "Tags",
    request_state: "Request State",
    assigned_team: "Assigned Team",
    comments: "Notes",
};

function getAssignedTeam(contact) {
    const categoryKey =
        contact && contact.category
            ? contact.category.toString().replace(/\s+/g, "_").toLowerCase()
            : "";
    return categoryToTeam[categoryKey] || "Unassigned Team";
}

function buildNotionCardBlocks(contact) {
    const commentsText =
        (comments.value[contact.id] ?? []).join("\n") || "No comments";
    const fieldItems = [
        ["Company", contact.company_name || "N/A"],
        [
            "Name",
            `${contact.first_name || ""} ${contact.last_name || ""}`.trim() ||
                "N/A",
        ],
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

    const textLines = fieldItems.map(([label, value]) => `${label}: ${value}`);

    return [
        {
            object: "block",
            type: "callout",
            callout: {
                rich_text: [
                    { type: "text", text: { content: textLines.join("\n") } },
                ],
                icon: { type: "emoji", emoji: "📌" },
            },
        },
    ];
}

async function sendContactToNotion(contact) {
    const title =
        contact.company_name ||
        `${contact.first_name || "Unknown"} ${contact.last_name || ""}`.trim() ||
        "Untitled request";
    const children = buildNotionCardBlocks(contact);

    const payload = {
        title,
        children,
    };

    try {
        const resp = await fetch(NOTION_PROXY_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!resp.ok) {
            const errorData = await resp.json().catch(() => ({}));
            console.error("Notion proxy error", errorData);
            return { success: false, errorInfo: errorData };
        }

        return { success: true, data: await resp.json() };
    } catch (error) {
        console.error("Notion proxy request failed", error);
        return { success: false, error };
    }
}

async function sendAllContactsToNotion() {
    notionSyncStatus.value = "Syncing contacts to Notion...";
    const contactsToSend = sortedContacts.value.filter(
        (c) => !deletedRequests.value[c.id],
    );
    const results = [];

    for (const contact of contactsToSend) {
        const result = await sendContactToNotion(contact);
        results.push({
            id: contact.id,
            success: result.success,
            error: result.error || result.errorInfo,
        });
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.length - successCount;
    notionSyncStatus.value = `Notion sync complete: ${successCount} success, ${failedCount} failed.`;

    if (failedCount > 0) {
        console.warn(
            "Some items failed to sync:",
            results.filter((r) => !r.success),
        );
    }
    return results;
}

const categoryOptions = computed(() => {
    return Object.keys(categoryTags).map((key) => ({
        value: key,
        label: toDisplayName(key),
    }));
});

const availableTags = computed(() => {
    return selectedCategory.value && categoryTags[selectedCategory.value]
        ? categoryTags[selectedCategory.value]
        : [];
});

const filteredContacts = computed(() => {
    const text = textSearch.value.trim().toLowerCase();

    return contacts.value.filter((contact) => {
        if (deletedRequests.value[contact.id]) {
            return false;
        }
        const categoryMatch = selectedCategory.value
            ? contact.category &&
              contact.category.toString().toLowerCase() ===
                  selectedCategory.value
            : true;

        const tagMatch = selectedTag.value
            ? (contact.tags || []).some(
                  (t) => t.toLowerCase() === selectedTag.value.toLowerCase(),
              )
            : true;

        const premiumMatch = selectedPremium.value
            ? selectedPremium.value === "premium"
                ? contact.user_premium === true
                : contact.user_premium === false
            : true;

        const requestStateMatch = selectedRequestState.value
            ? getRequestState(contact) === selectedRequestState.value
            : true;

        const textMatch = text
            ? [
                  contact.first_name,
                  contact.last_name,
                  contact.company_name,
                  contact.email,
              ].some(
                  (field) =>
                      field && field.toString().toLowerCase().includes(text),
              )
            : true;

        return (
            categoryMatch &&
            tagMatch &&
            premiumMatch &&
            requestStateMatch &&
            textMatch
        );
    });
});

const sortedContacts = computed(() => {
    const list = [...filteredContacts.value];

    const normalizeName = (contact) => {
        const first = contact.first_name || "";
        const last = contact.last_name || "";
        return `${first} ${last}`.trim().toLowerCase();
    };

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
            (a, b) => (a.user_premium ? 1 : 0) - (b.user_premium ? 1 : 0),
        );
    } else if (sortOption.value === "nameAsc") {
        list.sort((a, b) => normalizeName(a).localeCompare(normalizeName(b)));
    } else if (sortOption.value === "nameDesc") {
        list.sort((a, b) => normalizeName(b).localeCompare(normalizeName(a)));
    } else if (sortOption.value === "stateAsc") {
        list.sort((a, b) => {
            const aState = requestStateOrder.indexOf(getRequestState(a));
            const bState = requestStateOrder.indexOf(getRequestState(b));
            return aState - bState;
        });
    } else if (sortOption.value === "stateDesc") {
        list.sort((a, b) => {
            const aState = requestStateOrder.indexOf(getRequestState(a));
            const bState = requestStateOrder.indexOf(getRequestState(b));
            return bState - aState;
        });
    }

    const visible = list.filter((contact) => !hiddenRequests.value[contact.id]);
    const hidden = list.filter((contact) => hiddenRequests.value[contact.id]);

    return visible.concat(hidden);
});

async function fetchContacts() {
    isLoading.value = true;
    fetchError.value = null;
    const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        console.error("Supabase fetch error", error);
        fetchError.value = error;
        contacts.value = [];
    } else {
        contacts.value = data;
    }

    isLoading.value = false;
}

function loadCommentsFromStorage() {
    try {
        const saved = localStorage.getItem("contactComments");
        comments.value = saved ? JSON.parse(saved) : {};
    } catch (error) {
        comments.value = {};
        console.error("Failed to load comments from localStorage", error);
    }
}

function saveCommentsToStorage() {
    try {
        localStorage.setItem("contactComments", JSON.stringify(comments.value));
    } catch (error) {
        console.error("Failed to save comments to localStorage", error);
    }
}

function loadDeletedFromStorage() {
    try {
        const saved = localStorage.getItem(deletedStorageKey);
        deletedRequests.value = saved ? JSON.parse(saved) : {};
    } catch (error) {
        deletedRequests.value = {};
        console.error(
            "Failed to load deleted request IDs from localStorage",
            error,
        );
    }
}

function saveDeletedToStorage() {
    try {
        localStorage.setItem(
            deletedStorageKey,
            JSON.stringify(deletedRequests.value),
        );
    } catch (error) {
        console.error(
            "Failed to save deleted request IDs to localStorage",
            error,
        );
    }
}

function loadHiddenFromStorage() {
    try {
        const saved = localStorage.getItem(hiddenStorageKey);
        hiddenRequests.value = saved ? JSON.parse(saved) : {};
    } catch (error) {
        hiddenRequests.value = {};
        console.error(
            "Failed to load hidden requests from localStorage",
            error,
        );
    }
}

function saveHiddenToStorage() {
    try {
        localStorage.setItem(
            hiddenStorageKey,
            JSON.stringify(hiddenRequests.value),
        );
    } catch (error) {
        console.error("Failed to save hidden requests to localStorage", error);
    }
}

function loadRequestStatesFromStorage() {
    try {
        const saved = localStorage.getItem(requestStatesStorageKey);
        requestStates.value = saved ? JSON.parse(saved) : {};
    } catch (error) {
        requestStates.value = {};
        console.error("Failed to load request states from localStorage", error);
    }
}

function saveRequestStatesToStorage() {
    try {
        localStorage.setItem(
            requestStatesStorageKey,
            JSON.stringify(requestStates.value),
        );
    } catch (error) {
        console.error("Failed to save request states to localStorage", error);
    }
}

function loadRequestPriorityFromStorage() {
    try {
        const saved = localStorage.getItem(requestPriorityStorageKey);
        requestPriority.value = saved ? JSON.parse(saved) : {};
    } catch (error) {
        requestPriority.value = {};
        console.error(
            "Failed to load request priority from localStorage",
            error,
        );
    }
}

function saveRequestPriorityToStorage() {
    try {
        localStorage.setItem(
            requestPriorityStorageKey,
            JSON.stringify(requestPriority.value),
        );
    } catch (error) {
        console.error("Failed to save request priority to localStorage", error);
    }
}

function getRequestPriority(contact) {
    if (!contact || !contact.id) return "needs assignment";
    return requestPriority.value[contact.id] || "needs assignment";
}

function setRequestPriority(contactId, priority) {
    if (!contactId) return;
    requestPriority.value[contactId] = priority;
    saveRequestPriorityToStorage();
}

const requestStateOrder = ["pending", "in-progress", "done"];

function getRequestState(contact) {
    if (!contact || !contact.id) return "pending";
    const key = String(contact.id);
    return requestStates.value[key] || contact.state || "pending";
}

function setRequestState(contactId, state) {
    const key = String(contactId);
    requestStates.value[key] = state;
    saveRequestStatesToStorage();
}

function addComment(contactId) {
    const draft = (commentDrafts.value[contactId] || "").trim();
    if (!draft) return;

    if (!comments.value[contactId]) {
        comments.value[contactId] = [];
    }
    comments.value[contactId].push(draft);
    commentDrafts.value[contactId] = "";
    saveCommentsToStorage();
}

function deleteComment(contactId, index) {
    if (!comments.value[contactId]) return;
    comments.value[contactId].splice(index, 1);
    if (!comments.value[contactId].length) {
        delete comments.value[contactId];
    }
    saveCommentsToStorage();
}

function onCommentKeydown(contactId, event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        addComment(contactId);
    }
}

function deleteRequest(contactId) {
    if (!contactId) return;
    deletedRequests.value[contactId] = true;
    saveDeletedToStorage();
    // Keep deleted requests excluded from list immediately
}

function toggleHidden(contactId) {
    if (!contactId) return;
    if (hiddenRequests.value[contactId]) {
        delete hiddenRequests.value[contactId];
    } else {
        hiddenRequests.value[contactId] = true;
    }
    saveHiddenToStorage();
}

function toggleExpanded(contactId) {
    expandedContactId.value =
        expandedContactId.value === contactId ? null : contactId;
}

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
    <section class="backend-panel">
        <h2>Contacts from Supabase</h2>

        <button type="button" @click="fetchContacts" :disabled="isLoading">
            {{ isLoading ? "Refreshing..." : "Refresh contacts" }}
        </button>
        <button
            type="button"
            @click="sendAllContactsToNotion"
            class="notion-sync-btn"
            :disabled="isLoading"
        >
            Send all displayed to Notion
        </button>
        <router-link to="/detail/teamassign" class="team-assign-link"
            >Team Assignment View</router-link
        >

        <div v-if="fetchError" class="error">
            Error loading contacts: {{ fetchError.message || fetchError }}
        </div>

        <div v-else-if="isLoading" class="loading">Loading contacts...</div>
        <div v-else>
            <div class="search-panel">
                <label>
                    Search name/company/email:
                    <input
                        v-model="textSearch"
                        type="text"
                        placeholder="Type keywords..."
                    />
                </label>

                <label>
                    Category:
                    <select
                        v-model="selectedCategory"
                        @change="selectedTag = ''"
                    >
                        <option value="">All categories</option>
                        <option
                            v-for="item in categoryOptions"
                            :key="item.value"
                            :value="item.value"
                        >
                            {{ item.label }}
                        </option>
                    </select>
                </label>

                <label>
                    Tag:
                    <select v-model="selectedTag" :disabled="!selectedCategory">
                        <option value="">All tags</option>
                        <option
                            v-for="tag in availableTags"
                            :key="tag"
                            :value="tag"
                        >
                            {{ tag }}
                        </option>
                    </select>
                </label>

                <label>
                    Premium status:
                    <select v-model="selectedPremium">
                        <option value="">All</option>
                        <option value="premium">Premium</option>
                        <option value="standard">Standard</option>
                    </select>
                </label>

                <label>
                    Request status:
                    <select v-model="selectedRequestState">
                        <option value="">All</option>
                        <option
                            v-for="stage in requestStateOptions"
                            :key="stage"
                            :value="stage"
                        >
                            {{ stage }}
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
                        <option value="stateAsc">
                            State (pending → in-progress → done)
                        </option>
                        <option value="stateDesc">
                            State (done → in-progress → pending)
                        </option>
                    </select>
                </label>
            </div>

            <div v-if="sortedContacts.length === 0" class="no-contacts">
                No contacts found.
            </div>

            <div v-else class="cards-container">
                <div
                    v-for="contact in sortedContacts"
                    :key="contact.id"
                    :class="[
                        'contact-card',
                        {
                            hidden: hiddenRequests[contact.id],
                            expanded: expandedContactId === contact.id,
                        },
                    ]"
                >
                    <div
                        class="card-top-row"
                        @click="toggleExpanded(contact.id)"
                        style="cursor: pointer"
                    >
                        <div>
                            <strong>{{
                                contact.company_name || "Unnamed"
                            }}</strong>
                            <small class="expand-hint"
                                >[{{
                                    expandedContactId === contact.id
                                        ? "hide details"
                                        : "show details"
                                }}]</small
                            >
                        </div>
                        <div class="card-summary">
                            {{ contact.first_name || "N/A" }}
                            {{ contact.last_name || "N/A" }} •
                            {{ contact.category || "Uncategorized" }} •
                            {{ getRequestState(contact) }}
                        </div>
                        <div class="card-actions">
                            <button
                                type="button"
                                class="delete-card"
                                @click.stop="deleteRequest(contact.id)"
                            >
                                Delete
                            </button>
                            <button
                                type="button"
                                class="hide-card"
                                @click.stop="toggleHidden(contact.id)"
                            >
                                {{
                                    hiddenRequests[contact.id] ? "Show" : "Hide"
                                }}
                            </button>
                        </div>
                    </div>

                    <div
                        class="expanded-details"
                        v-if="expandedContactId === contact.id"
                    >
                        <div class="card-row name-row">
                            {{ contact.first_name || "N/A" }}
                            {{ contact.last_name || "N/A" }}
                        </div>

                        <div class="card-row description-row">
                            {{ contact.short_description || "N/A" }}
                        </div>

                        <div class="card-row meta-row">
                            <span
                                >Deadline:
                                {{ contact.deadline_time || "N/A" }}</span
                            >
                            <span
                                >Premium:
                                {{ contact.user_premium ? "Yes" : "No" }}</span
                            >
                            <span
                                >Type:
                                {{ contact.business_or_person || "N/A" }}</span
                            >
                        </div>

                        <div class="card-row contact-info-row">
                            <span v-if="contact.email"
                                >Email: {{ contact.email }}</span
                            >
                            <span v-if="contact.phone"
                                >Phone: {{ contact.phone }}</span
                            >
                            <span v-if="contact.location"
                                >Location: {{ contact.location }}</span
                            >
                        </div>

                        <div class="card-row linkedin-row">
                            LinkedIn:
                            <a
                                v-if="contact.linkedin_profile"
                                :href="contact.linkedin_profile"
                                target="_blank"
                                >profile</a
                            >
                            <span v-else>N/A</span>
                        </div>

                        <div class="card-row category-row">
                            Category: {{ contact.category || "N/A" }}
                        </div>

                        <div class="card-row team-row">
                            Assigned team: {{ getAssignedTeam(contact) }}
                        </div>

                        <div class="card-row tags-row">
                            Tags: {{ (contact.tags || []).join(", ") || "N/A" }}
                        </div>

                        <div class="card-row state-row">
                            <span class="label">State:</span>
                            <select
                                :value="getRequestState(contact)"
                                @change="
                                    (event) =>
                                        setRequestState(
                                            contact.id,
                                            event.target.value,
                                        )
                                "
                            >
                                <option value="pending">Pending</option>
                                <option value="in-progress">In Progress</option>
                                <option value="done">Done</option>
                            </select>
                        </div>

                        <div class="card-row priority-row">
                            <span class="label">Priority:</span>
                            <select
                                :value="getRequestPriority(contact)"
                                @change="
                                    (event) =>
                                        setRequestPriority(
                                            contact.id,
                                            event.target.value,
                                        )
                                "
                            >
                                <option value="need assignment">
                                    Need assignment
                                </option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="ASAP">ASAP</option>
                            </select>
                        </div>

                        <div class="comment-input">
                            <label>
                                Add Comment:
                                <input
                                    type="text"
                                    v-model="commentDrafts[contact.id]"
                                    @keydown="
                                        (event) =>
                                            onCommentKeydown(contact.id, event)
                                    "
                                    placeholder="Type and press Enter"
                                />
                            </label>
                            <button
                                type="button"
                                @click="addComment(contact.id)"
                            >
                                Save comment
                            </button>
                        </div>

                        <div
                            class="comment-list"
                            v-if="
                                comments[contact.id] &&
                                comments[contact.id].length
                            "
                        >
                            Comments:
                            <ul>
                                <li
                                    v-for="(c, idx) in comments[contact.id]"
                                    :key="`${contact.id}-${idx}`"
                                >
                                    <span>{{ c }}</span>
                                    <button
                                        type="button"
                                        class="delete-comment"
                                        @click="deleteComment(contact.id, idx)"
                                    >
                                        ×
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
<style scoped>
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

/* ─── Brand Tokens ─── */
:root {
    --white: #ffffff;
    --navy: #171642;
    --slate: #676789;
    --lavender: #cacadd;
    --mint: #0fefaa;
    --cyan: #11ede2;
    --grad: linear-gradient(135deg, #0fefaa 0%, #11ede2 100%);
}

/* ─── Page ─── */
.backend-panel {
    min-height: 100vh;
    background: var(--white);
    color: var(--navy);
    font-family: "Red Hat Text", sans-serif;
    border-left: 6px solid var(--green);
    padding: 3rem 2.5rem;
}

.backend-panel h2 {
    font-family: "Sora", sans-serif;
    font-size: clamp(1.75rem, 3vw, 2.5rem);
    font-weight: 800;
    color: var(--navy);
    margin-bottom: 2rem;
    letter-spacing: -0.01em;
}

/* ─── Header Buttons ─── */
.backend-panel > button {
    padding: 0.75rem 1.75rem;
    font-size: 0.9rem;
    font-weight: 700;
    font-family: "Red Hat Text", sans-serif;
    cursor: pointer;
    border: none;
    border-radius: 2rem;
    background: var(--grad);
    color: var(--navy);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin-right: 0.75rem;
    margin-bottom: 2rem;
    display: inline-block;
    position: relative;
    overflow: hidden;
}

.backend-panel > button::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
    );
    transition: all 0.6s ease;
}

.backend-panel > button:hover {
    transform: translateY(-3px) scale(1.03);
    box-shadow: 0 0.5rem 1.5rem rgba(15, 250, 170, 0.4);
}

.backend-panel > button:hover::before {
    left: 100%;
}

.backend-panel > button:active {
    transform: translateY(-1px) scale(0.98);
}

.backend-panel > button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
}
.backend-panel > button:disabled:hover {
    transform: none;
    box-shadow: none;
}

.notion-sync-btn {
    background: var(--navy) !important;
    color: var(--white) !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.notion-sync-btn::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
    );
    transition: all 0.6s ease;
}

.notion-sync-btn:hover {
    opacity: 0.8 !important;
    transform: translateY(-3px) scale(1.03);
    box-shadow: 0 0.5rem 1.5rem rgba(15, 250, 170, 0.4);
}

.notion-sync-btn:hover::before {
    left: 100%;
}

.team-assign-link {
    display: inline-block;
    padding: 0.75rem 1.75rem;
    font-size: 0.9rem;
    font-weight: 700;
    font-family: "Red Hat Text", sans-serif;
    cursor: pointer;
    border: none;
    border-radius: 2rem;
    background: var(--grad);
    color: var(--navy);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    margin-right: 0.75rem;
    margin-bottom: 2rem;
}

.team-assign-link::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
    );
    transition: all 0.6s ease;
}

.team-assign-link:hover {
    transform: translateY(-3px) scale(1.03);
    box-shadow: 0 0.5rem 1.5rem rgba(15, 250, 170, 0.4);
}

.team-assign-link:hover::before {
    left: 100%;
}

.team-assign-link:active {
    transform: translateY(-1px) scale(0.98);
}

/* ─── Error / Loading ─── */
.error {
    background: #fff0f0;
    border: 1.5px solid #ffcccc;
    border-radius: 0.75rem;
    padding: 1rem 1.5rem;
    color: #cc0000;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
}

.loading {
    color: var(--mid);
    font-size: 1rem;
    padding: 3rem 0;
    text-align: center;
}

/* ─── Search Panel ─── */
.search-panel {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    background: #f4fdfb;
    border: 1.5px solid var(--light);
    border-top: 4px solid var(--green);
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 2.5rem;
}

.search-panel label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--mid);
    flex: 1;
    min-width: 150px;
}

.search-panel input,
.search-panel select {
    padding: 0.55rem 0.9rem;
    font-size: 0.9rem;
    font-family: "Red Hat Text", sans-serif;
    color: var(--navy);
    background: var(--white);
    border: 1.5px solid var(--light);
    border-radius: 0.5rem;
    outline: none;
    transition: border-color 0.2s;
    cursor: pointer;
}

.search-panel input:focus,
.search-panel select:focus {
    border-color: var(--green);
}

/* ─── No Contacts ─── */
.no-contacts {
    text-align: center;
    color: var(--mid);
    padding: 5rem 0;
    font-size: 1rem;
}

/* ─── Cards Grid ─── */
.cards-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 1.25rem;
}

/* ─── Contact Card ─── */
.contact-card {
    background: var(--white);
    border: 1.5px solid var(--light);
    border-radius: 1rem;
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    position: relative;
    box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.05);
}

.contact-card:hover {
    border-color: var(--green);
    transform: translateY(-3px);
    box-shadow: 0 0.5rem 1.5rem rgba(15, 250, 170, 0.2);
}

/* Enhanced card styles for expanded state */
.contact-card.expanded {
    transform: scale(1.05) !important;
    z-index: 1000 !important;
    box-shadow: 0 1rem 3rem rgba(15, 250, 170, 0.25) !important;
    border-color: var(--green) !important;
    background: var(--white) !important;
    max-width: 800px;
    margin-left: auto !important;
    margin-right: auto !important;
}

/* Hide other cards when one is expanded */
.contact-card:not(.expanded) {
    opacity: 0.6 !important;
    transform: scale(0.97) !important;
}

.contact-card.hidden {
    opacity: 0.35;
    border-style: dashed;
}

/* ─── Card Top Row (collapsed) ─── */
.card-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding-bottom: 0.75rem;
}

.card-top-row strong {
    font-family: "Sora", sans-serif;
    font-size: 1rem;
    font-weight: 800;
    color: var(--navy);
}

.expand-hint {
    font-size: 0.72rem;
    font-weight: 400;
    color: var(--green);
    margin-left: 0.5rem;
    letter-spacing: 0.02em;
    cursor: pointer;
}

.card-summary {
    font-size: 0.8rem;
    color: var(--mid);
    flex: 1;
    line-height: 1.4;
}

/* ─── Card Actions ─── */
.card-actions {
    display: flex;
    gap: 0.4rem;
    flex-shrink: 0;
}

.delete-card,
.hide-card {
    padding: 0.3rem 0.8rem;
    font-size: 0.75rem;
    font-weight: 700;
    font-family: "Red Hat Text", sans-serif;
    border-radius: 2rem;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
}

.delete-card {
    background: #ffecec;
    color: #cc0000;
}

.delete-card:hover {
    background: #cc0000;
    color: var(--white);
}

.hide-card {
    background: #f0f0f8;
    color: var(--mid);
}

.hide-card:hover {
    background: var(--navy);
    color: var(--white);
}

/* ─── Expanded Details ─── */
.expanded-details {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1.5px solid var(--light);
    animation: slideDown 0.2s ease;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-6px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* ─── Card Rows ─── */
.card-row {
    font-size: 0.875rem;
    color: var(--mid);
    line-height: 1.5;
    padding: 0.6rem 0;
    border-bottom: 1px solid #f0f0f8;
}

.card-row:last-of-type {
    border-bottom: none;
}

.name-row {
    font-family: "Sora", sans-serif;
    font-size: 0.95rem;
    font-weight: 800;
    color: var(--navy);
}

.description-row {
    font-style: italic;
    color: var(--mid);
}

.meta-row,
.contact-info-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.meta-row span,
.contact-info-row span {
    background: #f4fdfb;
    border: 1px solid var(--light);
    border-radius: 2rem;
    padding: 0.2rem 0.7rem;
    font-size: 0.78rem;
    color: var(--navy);
    white-space: nowrap;
}

.linkedin-row a {
    color: var(--green);
    font-weight: 700;
    text-decoration: none;
}

.linkedin-row a:hover {
    text-decoration: underline;
}

/* ─── State Row ─── */
.state-row,
.priority-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-bottom: none;
}

.state-row .label,
.priority-row .label {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--mid);
    white-space: nowrap;
    min-width: 56px;
}

.state-row select,
.priority-row select {
    flex: 1;
    padding: 0.4rem 0.75rem;
    font-size: 0.875rem;
    font-family: "Red Hat Text", sans-serif;
    color: var(--navy);
    background: var(--white);
    border: 1.5px solid var(--light);
    border-radius: 0.5rem;
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s;
}

.state-row select:focus,
.priority-row select:focus {
    border-color: var(--green);
}

/* Priority color coding */
.priority-row select[data-priority="ASAP"] {
    border-color: #ff4444;
    color: #cc0000;
}
.priority-row select[data-priority="high"] {
    border-color: #ff8800;
    color: #994d00;
}
.priority-row select[data-priority="medium"] {
    border-color: var(--green);
}
.priority-row select[data-priority="low"] {
    border-color: var(--light);
}
.priority-row select[data-priority="need assignment"] {
    border-style: dashed;
    color: var(--mid);
}

/* ─── Comments ─── */
.comment-input {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.75rem;
}

.comment-input label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--mid);
}

.comment-input input {
    padding: 0.55rem 0.9rem;
    font-size: 0.875rem;
    font-family: "Red Hat Text", sans-serif;
    color: var(--navy);
    border: 1.5px solid var(--light);
    border-radius: 0.5rem;
    outline: none;
    transition: border-color 0.2s;
}

.comment-input input:focus {
    border-color: var(--green);
}

.comment-input button {
    align-self: flex-start;
    padding: 0.4rem 1.25rem;
    font-size: 0.825rem;
    font-weight: 700;
    font-family: "Red Hat Text", sans-serif;
    cursor: pointer;
    border: none;
    border-radius: 2rem;
    background: var(--grad);
    color: var(--navy);
    transition: all 0.2s;
}

.comment-input button:hover {
    opacity: 0.85;
    transform: translateY(-1px);
}

/* ─── Comment List ─── */
.comment-list {
    font-size: 0.8rem;
    color: var(--mid);
    padding-top: 0.5rem;
}

.comment-list ul {
    list-style: none;
    margin-top: 0.4rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.comment-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f4fdfb;
    border-radius: 0.5rem;
    padding: 0.4rem 0.75rem;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: var(--navy);
}

.delete-comment {
    background: none;
    border: none;
    color: var(--light);
    font-size: 1rem;
    cursor: pointer;
    line-height: 1;
    transition: color 0.2s;
    padding: 0;
    flex-shrink: 0;
}

.delete-comment:hover {
    color: #cc0000;
}

/* ─── Notion Status ─── */
.notion-status {
    margin-top: 2.5rem;
    text-align: center;
    font-size: 0.875rem;
    color: var(--mid);
    min-height: 1.5rem;
}

/* ─── Responsive ─── */
@media (max-width: 768px) {
    .backend-panel {
        padding: 2rem 1rem;
    }
    .cards-container {
        grid-template-columns: 1fr;
    }
    .search-panel {
        flex-direction: column;
    }
    .search-panel label {
        min-width: 100%;
    }
    .card-top-row {
        flex-wrap: wrap;
    }
}
</style>
