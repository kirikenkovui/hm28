<script setup>
import { defineEmits } from 'vue';

const emit = defineEmits(['loginModerator', 'loginUser']);

function loginModerator() {
  emit('loginModerator');
}

function loginUser() {
  emit('loginUser');
}
</script>

<template>
  <header class="name_plate"> 
    My Website
  </header>
  <aside  class="side_panel">
    <!-- Entry path via redirect page -->
    <RouterLink id="redirect" to="/detail/redirect">
      <button>Go to Redirect / Onboarding</button>
    </RouterLink>

    <RouterLink id="back" to="/detail/back">
      <button>Go to BackEnd</button>
    </RouterLink>
  </aside>
</template>

<style scoped>
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

/* Side panel styles */
.side_panel {
  position: fixed; /* Make it sticky to viewport */
  top: 80px; /* Below the header */
  left: 0;
  width: 160px;
  padding: 10px;
  background-color: #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-right: 1px solid #ccc;
  height: 100vh; /* Full viewport height */
  box-sizing: border-box;
}

/* Buttons inside panel */
.side_panel button {
  width: 100%; /* Full width of panel */
  padding: 10px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  border-radius: 5px;
  background-color: lightblue;
}

.side_panel button:hover {
  background-color: deepskyblue;
}

/* Main content area */
.main_content {
  margin-left: 180px; /* Leave space for side panel */
  padding: 20px;
}
</style>