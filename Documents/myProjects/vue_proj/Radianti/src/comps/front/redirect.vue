<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const requestType = ref('business');
const category = ref('investory');

function setRequestType(type) {
  requestType.value = type;
}

function continueToFront() {
  router.push({
    path: '/detail/front',
    query: { mode: requestType.value, category: category.value }
  });
}
</script>

<template>
  <div class="request-card">
    <h2>Choose request type</h2>

    <div class="buttons">
      <button type="button" @click="setRequestType('business')" :class="{ selected: requestType === 'business' }">
        Request type business
      </button>

      <button type="button" @click="setRequestType('personal')" :class="{ selected: requestType === 'personal' }">
        Request type personal
      </button>
    </div>

    <div class="category">
      <label for="category-select">Category</label>
      <select id="category-select" v-model="category">
        <option value="investory">investory</option>
        <option value="goverment">goverment</option>
        <option value="starup">starup</option>
        <option value="talent-recruiting">talent / recruiting</option>
        <option value="neziskove-organizacie">neziskove organizacie</option>
        <option value="media">media</option>
        <option value="operators">operators</option>
        <option value="service-providers">service providers</option>
        <option value="experts-mentors">experts / mentors</option>
        <option value="investicia">investicia</option>
        <option value="PR">PR</option>
        <option value="MNA">MNA</option>
        <option value="networking">networking</option>
      </select>
    </div>

    <button type="button" @click="continueToFront" class="continue-btn">Continue</button>
  </div>
</template>

<style scoped>
.request-card {
  max-width: 400px;
  margin: 2rem auto;
  padding: 1.5rem;
  background-color: #f9f9f9; /* gentle off-white */
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  font-family: Arial, sans-serif;
  color: #333;
}

.request-card h2 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.buttons {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

button {
  padding: 0.5em 1em;
  border: 1px solid #ccc;
  background-color: #f5f5f5;
  color: #333;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s ease;
}

button:hover {
  background-color: #21dc91;
}

.selected {
  background-color: #2fb10e; /* soft teal */
  color: #fff;
  border-color: #000000;
}

.category {
  margin-bottom: 1rem;
}

select {
  width: 100%;
  padding: 0.5em;
  border-radius: 5px;
  border: 1px solid #ccc;
  background-color: #fff;
}

.continue-btn {
  width: 100%;
  background-color: #1dc204;
  color: #fff;
  font-weight: bold;
  border: none;
}

.continue-btn:hover {
  background-color: #00ed7e;
}
</style>