<script setup>
import { ref, onMounted } from 'vue';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://uvzsspviybmxcwyffpkh.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZ"+
                        "SIsInJlZiI6InV2enNzcHZpeWJteGN3eWZmcGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NDc2OTQsImV4cCI6MjA5MDIyMzY5NH0.fdXoza3nOW7NXNSFJi0aVgf1ZX6hMoKfQ0oiysftUdc";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const contacts = ref([]);
const isLoading = ref(false);
const fetchError = ref(null);

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

onMounted(fetchContacts);
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


    <pre>{{ contacts }}</pre>
    <ul>
      <li v-if="contacts.length === 0">No contacts found.</li>
      <li v-for="contact in contacts" :key="contact.id">
        <strong>{{ contact.company_name || 'Unnamed' }}</strong>
        <div>First Name: {{ contact.first_name || 'N/A' }}</div>
        <div>Last Name: {{ contact.last_name || 'N/A' }}</div>
        <div>Email: {{ contact.email || 'N/A' }}</div>
        <div>Phone: {{ contact.phone || 'N/A' }}</div>
        <div>LinkedIn: <a v-if="contact.linkedin_profile" :href="contact.linkedin_profile" target="_blank">profile</a><span v-else>N/A</span></div>
        <div>Location: {{ contact.location || 'N/A' }}</div>
        <div>Premium: {{ contact.user_premium ? 'Yes' : 'No' }}</div>
        <div>Type: {{ contact.business_or_person || 'N/A' }}</div>
        <div>Category: {{ contact.category || 'N/A' }}</div>
        <div>Tags: {{ (contact.tags || []).join(', ') }}</div>
        <div>Deadline: {{ contact.deadline_time || 'N/A' }}</div>
        <div>Description: {{ contact.short_description || 'N/A' }}</div>
      </li>
    </ul>
        </div>
  </section>
</template>

<style scoped>
.backend-panel {
  margin: 20px;
  padding: 12x;
  border: 1px solid #a5a5a5;
  background: #f9f9ff;
}
.error {
  color: red;
}
.loading {
  color: #666;
}
</style>