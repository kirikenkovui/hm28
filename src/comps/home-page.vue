<template>
    <div class="page-wrapper">
        <main class="main_content">
            <section class="hero">
                <div
                    class="hero-circle"
                    :style="{
                        transform: `translateY(calc(-50% + ${offsetY}px)) translateX(${offsetX}px)`,
                    }"
                ></div>

                <div class="hero-content">
                    <h1 class="hero-title">Radianti</h1>
                    <p class="hero-subtitle">Illuminate your path forward</p>
                    <p class="hero-description">
                        We believe in creating transformative solutions that
                        empower businesses and individuals.
                    </p>

                    <!-- Not logged in: show Login button -->
                    <div v-if="!loggedIn" class="buttons-container">
                        <button class="nav-btn" @click="showModal = true">Login</button>
                    </div>

                    <!-- Logged in: show role-based nav buttons + logout -->
                    <div v-else class="buttons-container">
                        <RouterLink to="/detail/front">
                            <button class="nav-btn">Front-End Form</button>
                        </RouterLink>
                        <RouterLink v-if="role === 'moderator'" to="/detail/back">
                            <button class="nav-btn nav-btn--outline">Backend</button>
                        </RouterLink>
                        <button class="nav-btn nav-btn--logout" @click="logout">Logout</button>
                    </div>
                </div>
            </section>
        </main>

        <!-- Login Modal -->
        <Transition name="fade">
            <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
                <div class="modal">
                    <button class="modal-close" @click="closeModal">&#x2715;</button>
                    <h2 class="modal-title">Welcome back</h2>
                    <p class="modal-sub">Sign in to continue</p>

                    <div class="form-group">
                        <label>Username</label>
                        <input
                            v-model="username"
                            type="text"
                            placeholder="Enter username"
                            @keyup.enter="login"
                        />
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input
                            v-model="password"
                            type="password"
                            placeholder="Enter password"
                            @keyup.enter="login"
                        />
                    </div>

                    <p v-if="loginError" class="error-msg">{{ loginError }}</p>

                    <button class="submit-btn" @click="login">Sign In</button>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

// --- Hardcoded credentials ---
const CREDENTIALS = {
    moderator: { username: "admin", password: "admin123" },
    user:      { username: "user",  password: "user123"  },
};

// --- Auth state ---
const loggedIn  = ref(false);
const role      = ref(""); // 'moderator' | 'user'
const showModal = ref(false);
const username  = ref("");
const password  = ref("");
const loginError = ref("");

function login() {
    loginError.value = "";
    const { username: u, password: p } = { username: username.value.trim(), password: password.value };

    if (u === CREDENTIALS.moderator.username && p === CREDENTIALS.moderator.password) {
        role.value     = "moderator";
        loggedIn.value = true;
        closeModal();
    } else if (u === CREDENTIALS.user.username && p === CREDENTIALS.user.password) {
        role.value     = "user";
        loggedIn.value = true;
        closeModal();
    } else {
        loginError.value = "Invalid username or password.";
    }
}

function logout() {
    loggedIn.value = false;
    role.value     = "";
    username.value = "";
    password.value = "";
}

function closeModal() {
    showModal.value  = false;
    loginError.value = "";
    username.value   = "";
    password.value   = "";
}

// --- Floating circle animation ---
const offsetX = ref(0);
const offsetY = ref(0);
let animationId = null;
let angle = 0;
const radius = 20;
const speed = 0.006;

function animate() {
    angle += speed;
    offsetX.value = Math.cos(angle) * radius;
    offsetY.value = Math.sin(angle) * radius;
    animationId = requestAnimationFrame(animate);
}

onMounted(() => { animate(); });
onUnmounted(() => { cancelAnimationFrame(animationId); });
</script>

<style scoped>
/* --- Typography --- */
.hero-title {
    font-family: "Sora", sans-serif;
    font-weight: 800;
    font-size: 54pt;
    color: #171642;
    line-height: 1.1;
    margin-bottom: 1rem;
}

.hero-subtitle {
    font-family: "Sora", sans-serif;
    font-weight: 800;
    font-size: 30pt;
    color: #171642;
    opacity: 0.9;
}

.hero-description {
    font-family: "Red Hat Text", sans-serif;
    font-size: 20pt;
    font-weight: 400;
    color: #171642;
    opacity: 0.7;
    max-width: 600px;
}

/* --- Layout --- */
.page-wrapper {
    min-height: 100vh;
    background: #ffffff;
}

.hero {
    position: relative;
    background: linear-gradient(135deg, #0fefaa 0%, #11ede2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    overflow: hidden;
    padding: 4rem;
}

.hero-circle {
    position: absolute;
    left: -200px;
    top: 50%;
    width: 800px;
    height: 800px;
    border-radius: 50%;
    background: #ffffff;
    z-index: 1;
}

.hero-content {
    position: relative;
    z-index: 2;
    padding-left: 55%;
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 1.5rem;
}

.buttons-container {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
    flex-wrap: wrap;
    justify-content: center;
}

/* --- Buttons --- */
.nav-btn {
    padding: 1rem 2.5rem;
    font-size: 1rem;
    font-weight: 700;
    border-radius: 2rem;
    border: 2px solid #171642;
    background: #171642;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
}

.nav-btn:hover {
    background: #2a2870;
    border-color: #2a2870;
}

.nav-btn--outline {
    background: transparent;
    color: #171642;
}

.nav-btn--outline:hover {
    background: #171642;
    color: white;
}

.nav-btn--logout {
    background: transparent;
    color: #171642;
    border-color: #171642;
    opacity: 0.6;
}

.nav-btn--logout:hover {
    opacity: 1;
    background: #171642;
    color: white;
}

/* --- Modal Overlay --- */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(23, 22, 66, 0.45);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
}

.modal {
    background: #fff;
    border-radius: 1.5rem;
    padding: 2.5rem 2rem;
    width: 100%;
    max-width: 380px;
    position: relative;
    box-shadow: 0 20px 60px rgba(23, 22, 66, 0.2);
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.1rem;
    cursor: pointer;
    color: #171642;
    opacity: 0.5;
    transition: opacity 0.2s;
}

.modal-close:hover { opacity: 1; }

.modal-title {
    font-family: "Sora", sans-serif;
    font-weight: 800;
    font-size: 1.5rem;
    color: #171642;
    margin: 0;
}

.modal-sub {
    font-family: "Red Hat Text", sans-serif;
    color: #171642;
    opacity: 0.6;
    margin: 0;
    font-size: 0.95rem;
}

/* --- Form --- */
.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.form-group label {
    font-family: "Red Hat Text", sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: #171642;
}

.form-group input {
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    border: 1.5px solid #d0d0e0;
    font-size: 1rem;
    font-family: "Red Hat Text", sans-serif;
    color: #171642;
    outline: none;
    transition: border-color 0.2s;
}

.form-group input:focus {
    border-color: #0fefaa;
}

.error-msg {
    color: #e03c3c;
    font-size: 0.85rem;
    font-family: "Red Hat Text", sans-serif;
    margin: 0;
}

.submit-btn {
    margin-top: 0.5rem;
    padding: 0.85rem;
    background: #171642;
    color: white;
    border: none;
    border-radius: 2rem;
    font-size: 1rem;
    font-weight: 700;
    font-family: "Sora", sans-serif;
    cursor: pointer;
    transition: background 0.3s;
}

.submit-btn:hover { background: #2a2870; }

/* --- Transition --- */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* --- Responsive --- */
@media (max-width: 900px) {
    .hero-title { font-size: 40pt; }
    .hero-circle { width: 500px; height: 500px; }
}
</style>
