<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { createClient } from '@supabase/supabase-js';
import Comp from '../tag-element.vue';

const supabaseUrl = "https://uvzsspviybmxcwyffpkh.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZ"+
                        "SIsInJlZiI6InV2enNzcHZpeWJteGN3eWZmcGtoIiwicm9sZSI6ImFub24"+
                        "iLCJpYXQiOjE3NzQ2NDc2OTQsImV4cCI6MjA5MDIyMzY5NH0.fdXoza3nO"+
                        "W7NXNSFJi0aVgf1ZX6hMoKfQ0oiysftUdc";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const props = defineProps({  categoryTag: String
});

const categoryTags = {
  investory: [
    'Venture Capital', 'Angel Investor', 'Pre-seed', 'Series A', 'Private Equity', 'Exit Strategy'
  ],
  government: [
    'Granty', 'Legislatíva', 'Smart City', 'Public Sector', 'EU Funds', 'Policy Making'
  ],
  startup: [
    'SaaS', 'FinTech', 'Scalability', 'MVP', 'Bootstrapping', 'Product-Market Fit', 'Pitching'
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
    'Consulting', 'Legal Tech', 'Accounting', 'Cloud Services', 'B2B Services', 'Outsourcing'
  ],
  mentors: [
    'Business Coaching', 'Leadership', 'Industry Expert', 'Technical Mentorship', 'Career Growth'
  ],
  investment_deal: [
    'Due Diligence', 'Equity', 'Valuation', 'Convertible Note', 'Cap Table', 'Term Sheet'
  ],
  pr_marketing: [
    'Brand Awareness', 'Crisis Management', 'Public Relations', 'Social Media', 'Influencer Marketing'
  ],
  mna: [
    'Mergers', 'Acquisitions', 'Integration', 'Consolidation', 'Corporate Development', 'Buyout'
  ],
  networking: [
    'B2B Networking', 'Events', 'Partnerships', 'Ecosystem', 'Business Matchmaking', 'Referrals'
  ]
};

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

const route = useRoute();

watch(
  () => route.query.mode,
  (mode) => {
    if (mode === 'personal' || mode === 'business') {
      form.value.businessOrPerson = mode;
    }
  },
  { immediate: true }
);

watch(
  () => route.query.category,
  (categoryValue) => {
    if (categoryValue) {
      const normalized = categoryValue.toString().trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
      form.value.category = normalized;
    }
  },
  { immediate: true }
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
  <header class="name_plate"> 
    My Website
  </header>

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
        <input id="email" v-model="form.email" name="email" type="email" placeholder="" required />
      </div>

      <!-- Company (business only) -->
      <div class="user-entry" v-if="!isPersonal">
        <label for="companyName">Company name :</label>
        <input id="companyName" v-model="form.companyName" name="companyName" :required="!isPersonal" />
      </div>

      <!-- Phone -->
      <div class="user-entry">
        <label for="phone">Phone :</label>
        <input id="phone" v-model="form.phone" name="phone" type="tel" placeholder="0 000 000 000" required/>
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
      <div class="user-entry" v-if="isPersonal">
        <label for="deadlineTime">Preferred deadline :</label>
        <input id="deadlineTime" v-model="form.deadlineTime" name="deadlineTime" type="date" />
      </div>

      <!-- Category -->
      <div class="user-entry">
        <label for="category">Category :</label>
        <select id="category" v-model="form.category">
          <option v-for="categ in categoryTag" :value="categ">{{categ}}</option>
        </select>
      </div>

      <!-- Tags -->
      <div class="user-entry">
        <label for="tagSelect">Select Tag : (placeholder: {{ tagPlaceholder }})</label>
        <select id="tagSelect" @change="event => addTag(event.target.value)" :disabled="!form.category" >
          <option value="" disabled>Select tag</option>
          <option v-for="tag in availableTags" :key="tag" :value="tag">{{ tag }}</option>
        </select>
        <p v-if="!form.selectedTags.length" style="font-size:0.9em; color: #555;">Suggested tags: {{ tagPlaceholder }}</p>
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
/* Page Gradient Background */
body {
  background: linear-gradient(135deg, #119cff, #85d7ff);
  min-height: 100vh;
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
}

.name_plate {
  position: sticky;
  top: 0;
  background-color: rgb(17, 156, 255);
  padding: 12px;
  border-bottom: 1px solid black;
  border-radius: 10px;
  z-index: 1000;
  text-align: center;
  font-weight: bold;
  font-size: 24px;
  color: white;
}

/* Center form horizontally */
#wrapper {
  display: flex;
  justify-content: center;
  padding: 40px 16px;
}

/* Form */
.user-form {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 10px;
  background-color: #ffffff; /* solid white form */
}

/* Input groups */
.user-entry {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
#userPremium{
  display: flex;          /* keep label and checkbox in a row */
  flex-direction: row;
  align-items: center;    /* vertically align with label */
  justify-content: center; /* align to the left edge */
}
/* First + Last Name row */
.name-row {
  display: flex;
  gap: 10px;
}

.name-field {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* Inputs & select */
input,
select,
textarea {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
}

/* Textarea auto-grow */
textarea {
  min-height: 40px;
  max-height: 150px;
  resize: vertical;
  overflow-y: auto;
}

/* Button */
button {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  border-radius: 6px;
  background-color: rgb(17, 156, 255);
  color: white;
}
#input-one {
  display: flex;          /* keep label and checkbox in a row */
  flex-direction: row;
  align-items: self-start;    /* vertically align with label */
  justify-content: flex-start; /* align to the left edge */
}
button:hover {
  background-color: rgb(10, 130, 210);
}

#premium_user input[type="checkbox"] {
  margin: 0;              /* remove default spacing */
}
/* Mobile */
@media (max-width: 480px) {
  .name-row {
    flex-direction: column;
  }
}
</style>