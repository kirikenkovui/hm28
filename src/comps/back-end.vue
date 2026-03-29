<script setup>
import { ref, onMounted, computed } from 'vue';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://uvzsspviybmxcwyffpkh.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZ"+
                        "SIsInJlZiI6InV2enNzcHZpeWJteGN3eWZmcGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NDc2OTQsImV4cCI6MjA5MDIyMzY5NH0.fdXoza3nOW7NXNSFJi0aVgf1ZX6hMoKfQ0oiysftUdc";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const contacts = ref([]);
const isLoading = ref(false);
const fetchError = ref(null);
const textSearch = ref('');
const selectedCategory = ref('');
const selectedTag = ref('');
const selectedPremium = ref('');
const selectedRequestState = ref('');
const requestStateOptions = ['pending', 'in-progress', 'done'];
const commentDrafts = ref({});
const comments = ref({});
const priorityScores = ref({});
const priorityStorageKey = 'contactPriorities';
const deletedRequests = ref({});
const deletedStorageKey = 'deletedRequests';
const hiddenRequests = ref({});
const hiddenStorageKey = 'hiddenRequests';
const requestStates = ref({});
const requestStatesStorageKey = 'requestStates';
const sortOption = ref('deadlineAsc');

const toDisplayName = (key) => {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
};

const categoryTags = {
  investory: ['Venture Capital', 'Angel Investor', 'Seed', 'Series A', 'Private Equity', 'Exit Strategy'],
  government: ['Grants', 'Public Policy', 'Smart City', 'e-Government', 'EU Funding', 'Regulatory Compliance'],
  startup: ['SaaS', 'FinTech', 'Scalability', 'MVP', 'Bootstrapping', 'Product Market Fit', 'Pitch Deck'],
  talent_recruiting: ['Headhunting', 'Employer Branding', 'HR Tech', 'Upskilling', 'Remote Work', 'Soft Skills'],
  non_profit: ['Fundraising', 'Social Impact', 'Community Building', 'Volunteerism', 'Charity', 'NGO'],
  media: ['Journalism', 'Content Strategy', 'Broadcasting', 'Digital Media', 'Copywriting', 'Press Release'],
  operators: ['Logistics', 'Supply Chain', 'Infrastructure', 'Telecommunications', 'Operations Management'],
  service_providers: ['Consulting', 'Legal Services', 'Accounting', 'Cloud Services', 'B2B', 'Outsourcing'],
  mentors: ['Business Coaching', 'Leadership', 'Industry Expert', 'Technical Mentorship', 'Career Growth', 'Startup Advisory'],
  investment_deal: ['Due Diligence', 'Equity', 'Valuation', 'Convertible Notes', 'Cap Table', 'Term Sheet'],
  pr_marketing: ['Brand Awareness', 'Crisis Management', 'Public Relations', 'Social Media', 'Influencer Marketing', 'Reputation Management'],
  mna: ['Mergers', 'Acquisitions', 'Integration', 'Consolidation', 'Corporate Development', 'Buyout Strategies'],
  networking: ['B2B Networking', 'Events', 'Partnerships', 'Ecosystems', 'Business Matchmaking', 'Referrals']
};

const teamCategoryMap = {
  'Investment Team': ['investory', 'investment_deal'],
  'Public Affairs Team': ['government', 'pr_marketing', 'mna'],
  'Startup Support Team': ['startup', 'operators', 'service_providers'],
  'Talent Acquisition Team': ['talent_recruiting', 'mentors', 'networking'],
  'Social Impact Team': ['non_profit', 'media']
};

const categoryToTeam = Object.entries(teamCategoryMap).reduce((acc, [team, categories]) => {
  categories.forEach((category) => {
    acc[category] = team;
  });
  return acc;
}, {});

function getAssignedTeam(contact) {
  const categoryKey = (contact && contact.category ? contact.category.toString().replace(/\s+/g, '_').toLowerCase() : '');
  return categoryToTeam[categoryKey] || 'Unassigned Team';
}

const categoryOptions = computed(() => {
  return Object.keys(categoryTags).map((key) => ({
    value: key,
    label: toDisplayName(key)
  }));
});


const availableTags = computed(() => {
  return selectedCategory.value && categoryTags[selectedCategory.value]
    ? categoryTags[selectedCategory.value]
    : [];
});

const filteredContacts = computed(() => {
  const text = textSearch.value.trim().toLowerCase();

  return contacts.value.filter(contact => {    if (deletedRequests.value[contact.id]) {
      return false;
    }
    const categoryMatch = selectedCategory.value ?
      (contact.category && contact.category.toString().toLowerCase() === selectedCategory.value) : true;

    const tagMatch = selectedTag.value ?
      ((contact.tags || []).some((t) => t.toLowerCase() === selectedTag.value.toLowerCase())) : true;

    const premiumMatch = selectedPremium.value ?
      (selectedPremium.value === 'premium' ? contact.user_premium === true : contact.user_premium === false) : true;

    const requestStateMatch = selectedRequestState.value ?
      (getRequestState(contact) === selectedRequestState.value) : true;

    const textMatch = text ? [
      contact.first_name,
      contact.last_name,
      contact.company_name,
      contact.email
    ].some(field => field && field.toString().toLowerCase().includes(text)) : true;

    return categoryMatch && tagMatch && premiumMatch && requestStateMatch && textMatch;
  });
});

const sortedContacts = computed(() => {
  const list = [...filteredContacts.value];

  const normalizeName = (contact) => {
    const first = contact.first_name || '';
    const last = contact.last_name || '';
    return `${first} ${last}`.trim().toLowerCase();
  };

  const parseDeadline = (contact) => {
    const d = contact.deadline_time ? new Date(contact.deadline_time) : null;
    return d && !Number.isNaN(d.getTime()) ? d : new Date(8640000000000000);
  };

  if (sortOption.value === 'deadlineAsc') {
    list.sort((a,b)=> parseDeadline(a) - parseDeadline(b));
  } else if (sortOption.value === 'deadlineDesc') {
    list.sort((a,b)=> parseDeadline(b) - parseDeadline(a));
  } else if (sortOption.value === 'premiumHigh') {
    list.sort((a,b)=> (b.user_premium ? 1 : 0) - (a.user_premium ? 1 : 0));
  } else if (sortOption.value === 'premiumLow') {
    list.sort((a,b)=> (a.user_premium ? 1 : 0) - (b.user_premium ? 1 : 0));
  } else if (sortOption.value === 'nameAsc') {
    list.sort((a,b)=> normalizeName(a).localeCompare(normalizeName(b)));
  } else if (sortOption.value === 'nameDesc') {
    list.sort((a,b)=> normalizeName(b).localeCompare(normalizeName(a)));
  } else if (sortOption.value === 'stateAsc') {
    list.sort((a,b)=> {
      const aState = requestStateOrder.indexOf(getRequestState(a));
      const bState = requestStateOrder.indexOf(getRequestState(b));
      return aState - bState;
    });
  } else if (sortOption.value === 'stateDesc') {
    list.sort((a,b)=> {
      const aState = requestStateOrder.indexOf(getRequestState(a));
      const bState = requestStateOrder.indexOf(getRequestState(b));
      return bState - aState;
    });
  }

  const visible = list.filter(contact => !hiddenRequests.value[contact.id]);
  const hidden = list.filter(contact => hiddenRequests.value[contact.id]);

  return visible.concat(hidden);
});

async function fetchContacts() {
  isLoading.value = true;
  fetchError.value = null;
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    console.error('Supabase fetch error', error);
    fetchError.value = error;
    contacts.value = [];
  } else {
    contacts.value = data;
  }

  isLoading.value = false;
}

function loadCommentsFromStorage() {
  try {
    const saved = localStorage.getItem('contactComments');
    comments.value = saved ? JSON.parse(saved) : {};
  } catch (error) {
    comments.value = {};
    console.error('Failed to load comments from localStorage', error);
  }
}

function saveCommentsToStorage() {
  try {
    localStorage.setItem('contactComments', JSON.stringify(comments.value));
  } catch (error) {
    console.error('Failed to save comments to localStorage', error);
  }
}

function loadDeletedFromStorage() {
  try {
    const saved = localStorage.getItem(deletedStorageKey);
    deletedRequests.value = saved ? JSON.parse(saved) : {};
  } catch (error) {
    deletedRequests.value = {};
    console.error('Failed to load deleted request IDs from localStorage', error);
  }
}

function saveDeletedToStorage() {
  try {
    localStorage.setItem(deletedStorageKey, JSON.stringify(deletedRequests.value));
  } catch (error) {
    console.error('Failed to save deleted request IDs to localStorage', error);
  }
}

function loadHiddenFromStorage() {
  try {
    const saved = localStorage.getItem(hiddenStorageKey);
    hiddenRequests.value = saved ? JSON.parse(saved) : {};
  } catch (error) {
    hiddenRequests.value = {};
    console.error('Failed to load hidden requests from localStorage', error);
  }
}

function saveHiddenToStorage() {
  try {
    localStorage.setItem(hiddenStorageKey, JSON.stringify(hiddenRequests.value));
  } catch (error) {
    console.error('Failed to save hidden requests to localStorage', error);
  }
}

function loadRequestStatesFromStorage() {
  try {
    const saved = localStorage.getItem(requestStatesStorageKey);
    requestStates.value = saved ? JSON.parse(saved) : {};
  } catch (error) {
    requestStates.value = {};
    console.error('Failed to load request states from localStorage', error);
  }
}

function saveRequestStatesToStorage() {
  try {
    localStorage.setItem(requestStatesStorageKey, JSON.stringify(requestStates.value));
  } catch (error) {
    console.error('Failed to save request states to localStorage', error);
  }
}

const requestStateOrder = ['pending', 'in-progress', 'done'];

function getRequestState(contact) {
  if (!contact || !contact.id) return 'pending';
  const key = String(contact.id);
  return (requestStates.value[key] || contact.state || 'pending');
}

function setRequestState(contactId, state) {
  const key = String(contactId);
  requestStates.value[key] = state;
  saveRequestStatesToStorage();
}

function addComment(contactId) {
  const draft = (commentDrafts.value[contactId] || '').trim();
  if (!draft) return;

  if (!comments.value[contactId]) {
    comments.value[contactId] = [];
  }
  comments.value[contactId].push(draft);
  commentDrafts.value[contactId] = '';
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
  if (event.key === 'Enter' && !event.shiftKey) {
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

onMounted(() => {
  fetchContacts();
  loadCommentsFromStorage();
  loadDeletedFromStorage();
  loadHiddenFromStorage();
  loadRequestStatesFromStorage();
});
</script>

<template>
  <section class="backend-panel">
    <h2>Contacts from Supabase</h2>
    <button type="button" @click="fetchContacts" :disabled="isLoading">
      {{ isLoading ? 'Refreshing...' : 'Refresh contacts' }}
    </button>

    <div v-if="fetchError" class="error">
      Error loading contacts: {{ fetchError.message || fetchError }}
    </div>

    <div v-else-if="isLoading" class="loading">
      Loading contacts...
    </div>
    <div v-else>
      <div class="search-panel">
        <label>
          Search name/company/email:
          <input v-model="textSearch" type="text" placeholder="Type keywords..." />
        </label>

        <label>
          Category:
          <select v-model="selectedCategory" @change="selectedTag = ''">
            <option value="">All categories</option>
            <option v-for="item in categoryOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </label>

        <label>
          Tag:
          <select v-model="selectedTag" :disabled="!selectedCategory">
            <option value="">All tags</option>
            <option v-for="tag in availableTags" :key="tag" :value="tag">{{ tag }}</option>
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
            <option v-for="stage in requestStateOptions" :key="stage" :value="stage">{{ stage }}</option>
          </select>
        </label>

        <label>
          Sort by:
          <select v-model="sortOption">
            <option value="deadlineAsc">Deadline (soonest first)</option>
            <option value="deadlineDesc">Deadline (latest first)</option>
            <option value="premiumHigh">Premium first</option>
            <option value="premiumLow">Premium last</option>
            <option value="nameAsc">Name A-Z</option>
            <option value="nameDesc">Name Z-A</option>
            <option value="stateAsc">State (pending → in-progress → done)</option>
            <option value="stateDesc">State (done → in-progress → pending)</option>
          </select>
        </label>
      </div>

      <div v-if="sortedContacts.length === 0" class="no-contacts">
        No contacts found.
      </div>

      <div v-else class="cards-container">
        <div v-for="contact in sortedContacts" :key="contact.id" :class="['contact-card', { hidden: hiddenRequests[contact.id] }]">
          <div class="card-top-row">
            <div class="company-name">
              {{ contact.company_name || 'Unnamed' }}
            </div>
            <div class="card-actions">
              <button type="button" class="delete-card" @click="deleteRequest(contact.id)">Delete</button>
              <button type="button" class="hide-card" @click="toggleHidden(contact.id)">{{ hiddenRequests[contact.id] ? 'Unhide' : 'Hide' }}</button>
            </div>
          </div>

          <!-- Row 2: First Name, Last Name -->
          <div class="card-row name-row">
            {{ contact.first_name || 'N/A' }} , {{ contact.last_name || 'N/A' }}
          </div>

          <!-- Row 3: Description (truncated) -->
          <div class="card-row description-row">
            {{ contact.short_description || 'N/A' }}
          </div>

          <!-- Row 4: Deadline, Premium, Type -->
          <div class="card-row meta-row">
            <span><strong>Deadline:</strong> {{ contact.deadline_time || 'N/A' }}</span>
            <span><strong>Premium:</strong> {{ contact.user_premium ? 'Yes' : 'No' }}</span>
            <span><strong>Type:</strong> {{ contact.business_or_person || 'N/A' }}</span>
          </div>

          <!-- Row 5: Email, Phone, Location -->
          <div class="card-row contact-info-row">
            <span v-if="contact.email"><strong>Email:</strong> {{ contact.email }}</span>
            <span v-if="contact.phone"><strong>Phone:</strong> {{ contact.phone }}</span>
            <span v-if="contact.location"><strong>Location:</strong> {{ contact.location }}</span>
          </div>

          <!-- Row 6: LinkedIn -->
          <div class="card-row linkedin-row">
            <strong>LinkedIn:</strong>
            <a v-if="contact.linkedin_profile" :href="contact.linkedin_profile" target="_blank">profile</a>
            <span v-else>N/A</span>
          </div>

          <!-- Row 7: Category -->
          <div class="card-row category-row">
            <strong>Category:</strong> {{ contact.category || 'N/A' }}
          </div>

          <!-- Row 8: Assigned Team -->
          <div class="card-row team-row">
            <strong>Assigned team:</strong> {{ getAssignedTeam(contact) }}
          </div>

          <!-- Row 9: Tags -->
          <div class="card-row tags-row">
            <strong>Tags:</strong> {{ (contact.tags || []).join(', ') || 'N/A' }}
          </div>

          <!-- Row 9: Request State -->
          <div class="card-row state-row">
            <span class="label">State:</span>
            <select
              :value="getRequestState(contact)"
              @change="event => setRequestState(contact.id, event.target.value)"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          <!-- Comments Section -->
          <div class="comment-input">
            <label>
              Add Comment:
              <input
                type="text"
                v-model="commentDrafts[contact.id]"
                @keydown="event => onCommentKeydown(contact.id, event)"
                placeholder="Type and press Enter"
              />
            </label>
            <button type="button" @click="addComment(contact.id)">Save comment</button>
          </div>

          <div class="comment-list" v-if="comments[contact.id] && comments[contact.id].length">
            <strong>Comments:</strong>
            <ul>
              <li v-for="(c, idx) in comments[contact.id]" :key="`${contact.id}-${idx}`">
                <span>{{ c }}</span>
                <button type="button" class="delete-comment" @click="deleteComment(contact.id, idx)">×</button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
* {
  font-family: 'Sora', 'Red Hat Text', sans-serif !important;
}

.backend-panel {
  margin: 20px;
  padding: 20px;
  border: none;
  /* background: linear-gradient(135deg, #ffffff 0%, #e8f9f7 50%, #e0f7ff 100%); */
  border-radius: 12px;
}

.backend-panel h2 {
  margin: 0 0 20px 0;
  color: #1a3a3a;
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.backend-panel > button {
  padding: 10px 20px;
  background: linear-gradient(135deg, #00d9a3 0%, #00b8d4 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9375rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Roboto, 'Open Sans', sans-serif;
  transition: all 0.3s ease;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 217, 163, 0.25);
}

.backend-panel > button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 217, 163, 0.35);
  background: linear-gradient(135deg, #00c896 0%, #00a3c0 100%);
}

.backend-panel > button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #c32f27;
  background: #fee2e0;
  padding: 12px 16px;
  border-radius: 6px;
  border-left: 4px solid #c32f27;
  margin-bottom: 16px;
}

.loading {
  color: #00b8d4;
  text-align: center;
  padding: 20px;
  font-size: 1rem;
  font-weight: 500;
}

.search-panel {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
  background: #ffffff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 217, 163, 0.08);
  border: 1px solid #e0f7ff;
}

.search-panel label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 500;
  color: #1a3a3a;
  font-size: 0.9375rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Roboto, 'Open Sans', sans-serif;
}

.search-panel input,
.search-panel select {
  padding: 10px 12px;
  border: 2px solid #e0f7ff;
  border-radius: 6px;
  font-size: 0.9375rem;
  transition: all 0.3s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Roboto, 'Open Sans', sans-serif;
  background-color: #f8fffe;
  color: #333;
}

.search-panel input:focus,
.search-panel select:focus {
  outline: none;
  border-color: #00d9a3;
  box-shadow: 0 0 0 3px rgba(0, 217, 163, 0.1);
  background-color: #ffffff;
}

.search-panel input:hover,
.search-panel select:hover {
  border-color: #00b8d4;
}

.search-panel select:disabled {
  background-color: #f0f8f8;
  cursor: not-allowed;
}

.no-contacts {
  text-align: center;
  color: #5f8a8a;
  padding: 40px;
  font-size: 1rem;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 217, 163, 0.08);
  border: 1px solid #e0f7ff;
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.contact-card {
  background: #ffffff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 217, 163, 0.12);
  transition: all 0.3s ease;
  border-left: 4px solid #00d9a3;
  border-top: 2px solid #e0f7ff;
}

.contact-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 217, 163, 0.2);
}

.contact-card.hidden {
  opacity: 0.45;
  filter: grayscale(0.4);
}

.card-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.company-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1a3a3a;
  margin: 0;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.card-actions button {
  border: 1px solid rgba(0, 217, 163, 0.85);
  background: rgba(0, 217, 163, 0.12);
  color: #0a5463;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.card-actions button:hover {
  background: rgba(0, 217, 163, 0.25);
  transform: translateY(-1px);
}

.card-actions .delete-card {
  border-color: rgba(255, 108, 108, 0.85);
  background: rgba(255, 108, 108, 0.16);
  color: #8f1d1d;
}

.card-actions .delete-card:hover {
  background: rgba(255, 108, 108, 0.28);
}

.card-actions .hide-card {
  border-color: rgba(0, 145, 184, 0.85);
  background: rgba(0, 145, 184, 0.16);
  color: #0f4b61;
}

.card-actions .hide-card:hover {
  background: rgba(0, 145, 184, 0.28);
}

.card-row {
  padding: 10px 0;
  font-size: 0.9375rem;
  line-height: 1.6;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Roboto, 'Open Sans', sans-serif;
}

.card-row:not(:last-child) {
  border-bottom: 1px solid #e8f9f7;
}

.company-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1a3a3a;
  padding-bottom: 12px;
  margin-bottom: 8px;
  border-bottom: 2px solid #00d9a3;
}

.name-row {
  color: #2a5555;
  font-weight: 500;
}

.description-row {
  color: #5f8a8a;
  font-size: 0.875rem;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;  line-clamp: 2;  -webkit-box-orient: vertical;
  word-break: break-word;
}

.meta-row {
  color: #5f8a8a;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  font-size: 0.875rem;
  margin: 12px 0;
}

.meta-row span {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-row strong {
  color: #1a3a3a;
  font-weight: 600;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.contact-info-row {
  color: #5f8a8a;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  font-size: 0.875rem;
  margin: 12px 0;
}

.contact-info-row span {
  display: flex;
  flex-direction: column;
  gap: 2px;
  word-break: break-word;
}

.contact-info-row strong {
  color: #1a3a3a;
  font-weight: 600;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.linkedin-row {
  color: #5f8a8a;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.linkedin-row strong {
  color: #1a3a3a;
  font-weight: 600;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.linkedin-row a {
  color: #00b8d4;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
  padding: 2px 6px;
  border-radius: 4px;
}

.linkedin-row a:hover {
  background: #e0f7ff;
  text-decoration: underline;
  color: #00d9a3;
}

.category-row,
.tags-row {
  color: #5f8a8a;
  font-size: 0.875rem;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.category-row strong,
.tags-row strong {
  color: #1a3a3a;
  font-weight: 600;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.category-row span,
.tags-row span {
  word-break: break-word;
}

.state-row .label {
  color: #1a3a3a;
  font-weight: 400;
  font-size: 0.875rem;
  margin-right: 0.5rem;
}

.state-row select {
  border-radius: 6px;
  border: 1px solid #e0f7ff;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  background: #ffffff;
  color: #1a3a3a;
}
.comment-input {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 2px solid #e8f9f7;
}

.comment-input label {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  font-weight: 500;
  color: #1a3a3a;
  font-size: 0.875rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Roboto, 'Open Sans', sans-serif;
}

.comment-input input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #e0f7ff;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.3s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Roboto, 'Open Sans', sans-serif;
  background-color: #f8fffe;
  color: #333;
}

.comment-input input:focus {
  outline: none;
  border-color: #00d9a3;
  box-shadow: 0 0 0 3px rgba(0, 217, 163, 0.1);
  background-color: #ffffff;
}

.comment-input button {
  padding: 8px 16px;
  background: linear-gradient(135deg, #00d9a3 0%, #00b8d4 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Roboto, 'Open Sans', sans-serif;
  transition: all 0.3s ease;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 217, 163, 0.2);
}

.comment-input button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 217, 163, 0.3);
  background: linear-gradient(135deg, #00c896 0%, #00a3c0 100%);
}

.comment-list {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 2px solid #e8f9f7;
}

.comment-list > strong {
  color: #1a3a3a;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.comment-list ul {
  margin: 12px 0 0 0;
  padding: 0;
  list-style: none;
}

.comment-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 10px 12px;
  background: linear-gradient(135deg, #f8fffe 0%, #e8f9f7 100%);
  border-radius: 6px;
  font-size: 14px;
  border-left: 3px solid #00d9a3;
  word-break: break-word;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Roboto, 'Open Sans', sans-serif;
}

.comment-list span {
  flex: 1;
  color: #2a5555;
}

.delete-comment {
  border: none;
  background: #ff6b6b;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-weight: bold;
  line-height: 1;
  padding: 0;
  flex-shrink: 0;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
}

.delete-comment:hover {
  background: #ff5252;
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .backend-panel {
    margin: 10px;
    padding: 15px;
  }

  .backend-panel h2 {
    font-size: 24px;
    margin-bottom: 15px;
  }

  .backend-panel > button {
    font-size: 14px;
    padding: 9px 16px;
  }

  .search-panel {
    grid-template-columns: 1fr;
    padding: 12px;
    gap: 10px;
  }

  .search-panel label {
    font-size: 14px;
    gap: 5px;
  }

  .search-panel input,
  .search-panel select {
    font-size: 14px;
    padding: 9px 10px;
  }

  .cards-container {
    grid-template-columns: 1fr;
    gap: 15px;
    margin-top: 15px;
  }

  .contact-card {
    padding: 16px;
  }

  .company-name {
    font-size: 16px;
    padding-bottom: 10px;
    margin-bottom: 8px;
  }

  .card-row {
    font-size: 14px;
    padding: 8px 0;
  }

  .meta-row,
  .contact-info-row {
    grid-template-columns: 1fr;
    font-size: 13px;
    gap: 10px;
  }

  .comment-input {
    flex-direction: column;
    gap: 8px;
  }

  .comment-input label {
    font-size: 13px;
  }

  .comment-input input {
    font-size: 14px;
    padding: 10px;
  }

  .comment-input button {
    font-size: 13px;
    padding: 8px 12px;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .backend-panel {
    margin: 8px;
    padding: 12px;
  }

  .backend-panel h2 {
    font-size: 20px;
    margin-bottom: 12px;
  }

  .backend-panel > button {
    font-size: 13px;
    padding: 8px 12px;
    min-height: 44px;
  }

  .search-panel {
    grid-template-columns: 1fr;
    padding: 10px;
    gap: 8px;
  }

  .search-panel label {
    font-size: 13px;
  }

  .search-panel input,
  .search-panel select {
    font-size: 15px;
    padding: 10px 12px;
    min-height: 44px;
  }

  .no-contacts {
    font-size: 14px;
    padding: 20px;
  }

  .cards-container {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-top: 12px;
  }

  .contact-card {
    padding: 12px;
    border-radius: 8px;
  }

  .company-name {
    font-size: 14px;
    padding-bottom: 8px;
    margin-bottom: 6px;
  }

  .name-row {
    font-size: 13px;
  }

  .card-row {
    font-size: 13px;
    padding: 6px 0;
  }

  .description-row {
    font-size: 12px;
  }

  .meta-row,
  .contact-info-row {
    grid-template-columns: 1fr;
    font-size: 12px;
    gap: 8px;
    margin: 8px 0;
  }

  .meta-row strong,
  .contact-info-row strong {
    font-size: 11px;
  }

  .linkedin-row,
  .category-row,
  .tags-row {
    font-size: 12px;
  }

  .comment-input {
    flex-direction: column;
    gap: 6px;
    margin-top: 12px;
  }

  .comment-input label {
    font-size: 12px;
  }

  .comment-input input {
    font-size: 15px;
    padding: 10px 12px;
    min-height: 44px;
  }

  .comment-input button {
    font-size: 12px;
    padding: 8px 12px;
    width: 100%;
    min-height: 44px;
  }

  .comment-list li {
    font-size: 12px;
    padding: 8px 10px;
  }

  .delete-comment {
    width: 22px;
    height: 22px;
  }
}
</style>
