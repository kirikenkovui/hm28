<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { createClient } from '@supabase/supabase-js';
import Comp from '././tag-element.vue';

const supabaseUrl = "https://uvzsspviybmxcwyffpkh.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZ"+
                        "SIsInJlZiI6InV2enNzcHZpeWJteGN3eWZmcGtoIiwicm9sZSI6ImFub24"+
                        "iLCJpYXQiOjE3NzQ2NDc2OTQsImV4cCI6MjA5MDIyMzY5NH0.fdXoza3nO"+
                        "W7NXNSFJi0aVgf1ZX6hMoKfQ0oiysftUdc";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const categoryTags = {
  investory: [
    'Venture Capital', 'Angel Investor', 'Seed', 'Series A', 'Private Equity', 'Exit Strategy'
  ],
  government: [
    'Grants', 'Public Policy', 'Smart City', 'e-Government', 'EU Funding', 'Regulatory Compliance'
  ],
  startup: [
    'SaaS', 'FinTech', 'Scalability', 'MVP', 'Bootstrapping', 'Product Market Fit', 'Pitch Deck'
  ],
  talent_recruiting: [
    'Headhunting', 'Employer Branding', 'HR Tech', 'Upskilling', 'Remote Work', 'Soft Skills'
  ],
  non_profit: [
    'Fundraising', 'Social Impact', 'Community Building', 'Volunteerism', 'Charity', 'NGO'
  ],
  media: [
    'Journalism', 'Content Strategy', 'Broadcasting', 'Digital Media', 'Copywriting', 'Press Release'
  ],
  operators: [
    'Logistics', 'Supply Chain', 'Infrastructure', 'Telecommunications', 'Operations Management'
  ],
  service_providers: [
    'Consulting', 'Legal Services', 'Accounting', 'Cloud Services', 'B2B', 'Outsourcing'
  ],
  mentors: [
    'Business Coaching', 'Leadership', 'Industry Expert', 'Technical Mentorship', 'Career Growth', 'Startup Advisory'
  ],
  investment_deal: [
    'Due Diligence', 'Equity', 'Valuation', 'Convertible Notes', 'Cap Table', 'Term Sheet'
  ],
  pr_marketing: [
    'Brand Awareness', 'Crisis Management', 'Public Relations', 'Social Media', 'Influencer Marketing', 'Reputation Management'
  ],
  mna: [
    'Mergers', 'Acquisitions', 'Integration', 'Consolidation', 'Corporate Development', 'Buyout Strategies'
  ],
  networking: [
    'B2B Networking', 'Events', 'Partnerships', 'Ecosystem', 'Business Matchmaking', 'Referrals'
  ]
};

const toDisplayName = (key) => {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
};

const categoryOptions = computed(() => {
  return Object.keys(categoryTags).map((key) => ({
    key,
    label: toDisplayName(key)
  }));
});

const categoryTag = computed(() => {
  const key = form.value.category ? form.value.category.toString().replace(/\s+/g, '_').toLowerCase() : '';
  return categoryTags[key] || [];
});

const form = ref({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    phone: '',
    linkedinProfile: '',
    location: '',
    userPremium: false,
    businessOrPerson: 'business',
    shortDescription: '',
    deadlineTime: '',
    category: '',
    selectedTags: []
});

const availableTags = computed(() => {
  const key = form.value.category ? form.value.category.toString().replace(/\s+/g, '_').toLowerCase() : '';
  const categoryList = categoryTags[key] || [];
  return categoryList.filter(t => !form.value.selectedTags.includes(t));
});

const tagPlaceholder = computed(() => {
  if (!form.value.category) return 'Please select category first';
  if (!availableTags.value.length) return 'No tags available for selected category';
  return availableTags.value.slice(0, 3).join(', ');
});

watch(
  () => form.value.category,
  (newCategory, oldCategory) => {
    if (newCategory && oldCategory && newCategory !== oldCategory) {
      form.value.selectedTags = [];
    }
  }
);

const isPersonal = computed(() => form.value.businessOrPerson === 'personal');

const contacts = ref([]);
const contactLoading = ref(false);
const contactError = ref(null);

async function loadContacts() {
  contactLoading.value = true;
  contactError.value = null;
  const { data, error } = await supabase.from('contacts').select('*').order('id', { ascending: false });
  if (error) {
    console.error('Supabase fetch error', error);
    contactError.value = error;
    contacts.value = [];
  } else {
    contacts.value = data;
  }
  contactLoading.value = false;
}

onMounted(() => {
  loadContacts();
});

function autoResize(event) {
  const textarea = event.target;
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}

function addTag(tag) {
  if (!tag || !tag.trim()) return;
  if (!form.value.selectedTags.includes(tag)) {
    form.value.selectedTags.push(tag);
  }
}

function removeTag(tag) {
  const index = form.value.selectedTags.indexOf(tag);
  if (index > -1) form.value.selectedTags.splice(index, 1);
}

function onFileChange(event) {
  const file = event.target.files[0];
  form.value.pitchMaterial = file || null;
}

async function submitForm() {
  // No pitch-material file is required for now. If a file is added in the future,
  // the upload branch below can be re-enabled.
  let pitchMaterialUrl = null;

  // Optional: keep this block for future file upload support. If you want to
  // disable uploads entirely, leave this intact but skip the upload branch.
  if (form.value.pitchMaterial) {
    const file = form.value.pitchMaterial;
    const filePath = `pitch-materials/${Date.now()}_${file.name}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pitch-materials')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('Supabase upload failed', uploadError);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('pitch-materials')
      .getPublicUrl(filePath);

    pitchMaterialUrl = publicUrlData.publicUrl;
  }

  const { data, error } = await supabase.from('contacts').insert([
    {
      first_name: form.value.firstName,
      last_name: form.value.lastName,
      email: form.value.email,
      company_name: form.value.companyName,
      phone: form.value.phone,
      linkedin_profile: form.value.linkedinProfile,
      location: form.value.location,
      user_premium: form.value.userPremium,
      business_or_person: form.value.businessOrPerson,
      short_description: form.value.shortDescription,
      deadline_time: form.value.deadlineTime,
      category: form.value.category,
      tags: form.value.selectedTags,
      pitch_material_url: pitchMaterialUrl
    }
  ]);

  if (error) {
    console.error('Supabase insert error', error);
    return;
  }

  console.log('Supabase insert success', data);

  // Refresh the fetched list so back-end-like display shows latest data.
  await loadContacts();

  form.value = {
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    phone: '',
    linkedinProfile: '',
    location: '',
    userPremium: false,
    businessOrPerson: 'business',
    shortDescription: '',
    deadlineTime: '',
    category: '',
    selectedTags: []
  };
}
</script>


<template>

  <section id="wrapper">
    <form @submit.prevent="submitForm" class="user-form">

      <!-- First + Last Name -->
      <div class="user-entry">
        <div class="name-row">
          <div class="name-field">
            <label for="firstName">First Name :</label>
            <input id="firstName" v-model="form.firstName" name="firstName" placeholder="First name" required/>
          </div>

          <div class="name-field">
            <label for="lastName">Last Name :</label>
            <input id="lastName" v-model="form.lastName" name="lastName" placeholder="Last name" required />
          </div>
        </div>
      </div>

      <!-- Email -->
      <div class="user-entry">
        <label for="email">Email :</label>
        <input id="email" v-model="form.email" name="email" type="email" placeholder="example@gmail.com" required />
      </div>

      <!-- Company (business only) -->
      <div class="user-entry" v-if="!isPersonal">
        <label for="companyName">Company name :</label>
        <input id="companyName" v-model="form.companyName" name="companyName" :required="!isPersonal" />
      </div>

      <!-- Phone -->
      <div class="user-entry">
        <label for="phone">Phone :</label>
        <input id="phone" v-model="form.phone" name="phone" type="tel" placeholder="+0 000 000 000" required/>
      </div>

      <!-- LinkedIn Profile -->
      <div class="user-entry">
        <label for="linkedinProfile">LinkedIn profile :</label>
        <input id="linkedinProfile" v-model="form.linkedinProfile" name="linkedinProfile" type="url" placeholder="https://linkedin.com/in/your-profile" />
      </div>

      <!-- Location -->
      <div class="user-entry">
        <label for="location">Location :</label>
        <input id="location" v-model="form.location" name="location" placeholder="City, Country" />
      </div>

      <!-- Premium status -->
      <div id="premium_user">
        <label for="userPremium">User Status :</label>
        <select id="userPremium" v-model="form.userPremium">
          <option :value="true">Premium user</option>
          <option :value="false">Normal user</option>
        </select>
      </div>

      <!-- Business or Person -->
      <div class="user-entry">
        <label for="businessOrPerson">Business or person :</label>
        <select id="businessOrPerson" v-model="form.businessOrPerson">
          <option value="business">Business</option>
          <option value="person">Person</option>
        </select>
      </div>

      <!-- Short Description -->
      <div class="user-entry">
        <label for="shortDescription">Short description :</label>
        <textarea
          id="shortDescription"
          v-model="form.shortDescription"
          name="shortDescription"
          placeholder=" . . . "
          rows="2"
          @input="autoResize"
        ></textarea>
      </div>

      <!-- Deadline (personal only) -->
      <div class="user-entry">
        <label for="deadlineTime">Preferred deadline :</label>
        <input id="deadlineTime" v-model="form.deadlineTime" name="deadlineTime" type="date" />
      </div>

      <!-- Category -->
      <div class="user-entry">
        <label for="category">Category :</label>
        <select id="category" v-model="form.category">
          <option value="" disabled>Select category</option>
          <option v-for="item in categoryOptions" :key="item.key" :value="item.key">{{ item.label }}</option>
        </select>
      </div>

      <!-- Tags -->
      <div class="user-entry">
        <label for="tagSelect" placeholder: {{ tagPlaceholder }})>Select Tag :</label>
        <select id="tagSelect" @change="event => addTag(event.target.value)" :disabled="!form.category" >
          <option value="" disabled>Select tag</option>
          <option v-for="tag in availableTags" :key="tag" :value="tag">{{ tag }}</option>
        </select>
        <p v-if="!form.selectedTags.length" class="suggested-tags">Suggested tags: {{ tagPlaceholder }}</p>
      </div>

      <!-- Selected tags -->
      <div>
        <Comp
          class="selected-tagg"
          v-for="tag in form.selectedTags"
          :key="tag"
          :tag="tag"
          @delete="removeTag"
        />
      </div>

      <button type="submit">Submit</button>
    </form>
  </section>
</template>
<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Base styles */
body {
  min-height: 100vh;
  font-family: 'Red Hat Text', sans-serif;
  color: #171642;
  background-color: #ffffff;
}

#wrapper{
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Layout */
.page-wrapper {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 5rem 2.5rem;
  background-color: #ffffff;
}

/* Form container */
.user-form {
  width: 100%;
  max-width: 55%;
  background-color: #FFFFFF;
  padding: 2.5rem;
  border-radius: 1rem;
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.1);
  border: 2px solid #CACADD;
  margin:5% 0;
}

/* Form elements */
.user-entry {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.user-entry label {
  /* P2: Red Hat Text Regular 20 pt */
  font-family: 'Red Hat Text', sans-serif;
  font-weight: 400;
  font-size: 1rem; /* 20pt = 20/16 * 1rem = 1.25rem */
  margin-bottom: 0.25rem;
  color: #171642;
}

/* Name row */
.name-row {
  display: flex;
  gap: 1rem;
}

.name-field {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Inputs, selects, textareas */
input,
select,
textarea {
  width: 100%;
  padding: 1rem;
  /* P1: Red Hat Text Regular 30 pt for inputs */
  font-family: 'Red Hat Text', sans-serif;
  font-weight: 400;
  font-size: 1.5rem; /* 30pt = 30/16 * 1rem = 1.875rem */
  border: 2px solid #CACADD;
  border-radius: 0.5rem;
  background-color: #ffffff;
  color: #171642;
  transition: all 0.3s ease;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #0FEFAA;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(15, 250, 170, 0.1);
}

input:hover,
select:hover,
textarea:hover {
  border-color: #676789;
}

/* Textarea auto-grow */
textarea {
  min-height: 2rem;
  resize: vertical;
}

/* Button */
button {
  width: 100%;
  /* H3: Sora Extra Bold 30 pt for button text */
  font-family: 'Sora', sans-serif;
  font-weight: 800;
  font-size: 1.875rem; /* 30pt */
  padding: 1rem 2.5rem;
  cursor: pointer;
  border: none;
  border-radius: 0.5rem;
  background: #0FEFAA;
  color: #ffffff;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0.25rem 0.75rem rgba(15, 250, 170, 0.3);
}

/* Button pseudo-element for shine effect */
button::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
  animation: shine 3s infinite;
}

/* Button hover effects */
button:hover {
  transform: translateY(-0.125rem) scale(1.01);
  box-shadow: 0 0.1rem 1.3rem rgba(15, 250, 170, 0.5), 0 0 1.2rem rgba(15, 250, 170, 0.4);
  background: #44eae2;
  animation: pulse 2s infinite;
}

button:active {
  transform: translateY(0px) scale(1);
  box-shadow: 0 0.125rem 0.375rem rgba(15, 250, 170, 0.2);
}

/* Animations */
@keyframes shine {
  0% {
    transform: rotate(0deg) translateX(-100%);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: rotate(0deg) translateX(100%);
    opacity: 0;
  }
}

@keyframes pulse {
  0%, 50% {
    box-shadow: 0 0.5rem 1.5rem rgba(15, 250, 170, 0.5), 0 0 2rem rgba(15, 250, 170, 0.4);
  }
  50% {
    box-shadow: 0 0.5rem 2rem rgba(15, 250, 170, 0.7), 0 0 3rem rgba(15, 250, 170, 0.6);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .page-wrapper {
    padding: 3.75rem 1.25rem;
  }

  .user-form {
    padding: 2rem;
  }

  .user-entry label {
    font-size: 1.125rem; /* 18pt */
  }

  input,
  select,
  textarea {
    font-size: 1.6875rem; /* 27pt */
  }

  button {
    font-size: 1.6875rem; /* 27pt */
    padding: 0.875rem 1.875rem;
  }
}

@media (max-width: 480px) {
  .page-wrapper {
    padding: 2.5rem 0.9375rem;
  }

  .user-form {
    padding: 1.5rem;
  }

  .user-entry label {
    font-size: 1rem; /* 16pt */
  }

  input,
  select,
  textarea {
    font-size: 1.5rem; /* 24pt */
  }

  button {
    font-size: 1.5rem; /* 24pt */
    padding: 0.75rem 1.5rem;
  }

  .name-row {
    flex-direction: column;
  }
}

/* Suggested tags text */
.suggested-tags {
  /* P2: Red Hat Text Regular 20 pt, but smaller for suggestion text */
  font-family: 'Red Hat Text', sans-serif;
  font-weight: 400;
  font-size: 1rem; /* 16pt */
  color: #676789;
}
</style>
