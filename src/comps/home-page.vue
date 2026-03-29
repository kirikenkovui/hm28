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

                    <!-- Not logged in: show Login + Register buttons -->
                    <div v-if="!loggedIn" class="buttons-container">
                        <button class="nav-btn" @click="openModal('login')">Login</button>
                        <button class="nav-btn nav-btn--outline" @click="openModal('register')">Register</button>
                    </div>

                    <!-- Logged in: show role-based nav buttons + logout -->
                    <div v-else class="buttons-container">
                        <RouterLink to="/detail/front">
                            <button class="nav-btn">Front-End Form</button>
                        </RouterLink>
                        <RouterLink v-if="role === 'user'" to="/detail/my-requests">
                            <button class="nav-btn nav-btn--teal">My Requests</button>
                        </RouterLink>
                        <RouterLink v-if="role === 'moderator'" to="/detail/back">
                            <button class="nav-btn nav-btn--outline">Backend</button>
                        </RouterLink>
                        <button class="nav-btn nav-btn--logout" @click="logout">Logout</button>
                    </div>
                </div>
            </section>
        </main>

        <!-- Login / Register Modal -->
        <Transition name="fade">
            <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
                <div class="modal">
                    <button class="modal-close" @click="closeModal">&#x2715;</button>

                    <!-- Tab switcher -->
                    <div class="modal-tabs">
                        <button
                            class="tab-btn"
                            :class="{ 'tab-btn--active': modalMode === 'login' }"
                            @click="modalMode = 'login'; clearForm()"
                        >Sign In</button>
                        <button
                            class="tab-btn"
                            :class="{ 'tab-btn--active': modalMode === 'register' }"
                            @click="modalMode = 'register'; clearForm()"
                        >Register</button>
                    </div>

                    <!-- LOGIN -->
                    <template v-if="modalMode === 'login'">
                        <h2 class="modal-title">Welcome back</h2>
                        <p class="modal-sub">Sign in to continue</p>

                        <div class="form-group">
                            <label>Username or Email</label>
                            <input
                                v-model="username"
                                type="text"
                                placeholder="Enter username or email"
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

                        <p v-if="authError" class="error-msg">{{ authError }}</p>
                        <button class="submit-btn" @click="login">Sign In</button>
                    </template>

                    <!-- REGISTER -->
                    <template v-else>
                        <h2 class="modal-title">Create account</h2>
                        <p class="modal-sub">Register to track your requests</p>

                        <div class="form-group">
                            <label>Username</label>
                            <input
                                v-model="regUsername"
                                type="text"
                                placeholder="Choose a username"
                                @keyup.enter="register"
                            />
                        </div>
                        <div class="form-group">
                            <label>Email <span class="label-hint">(must match your submission)</span></label>
                            <input
                                v-model="regEmail"
                                type="email"
                                placeholder="example@gmail.com"
                                @keyup.enter="register"
                            />
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input
                                v-model="regPassword"
                                type="password"
                                placeholder="At least 6 characters"
                                @keyup.enter="register"
                            />
                        </div>
                        <div class="form-group">
                            <label>Confirm Password</label>
                            <input
                                v-model="regPasswordConfirm"
                                type="password"
                                placeholder="Repeat password"
                                @keyup.enter="register"
                            />
                        </div>

                        <p v-if="authError" class="error-msg">{{ authError }}</p>
                        <p v-if="regSuccess" class="success-msg">{{ regSuccess }}</p>
                        <button class="submit-btn" @click="register">Create Account</button>
                    </template>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// --- Hardcoded moderator credentials ---
const MODERATOR = { username: "admin", password: "admin123" };

// --- Auth state ---
const loggedIn  = ref(false);
const role      = ref(""); // 'moderator' | 'user'
const showModal = ref(false);
const modalMode = ref("login"); // 'login' | 'register'

// Login fields
const username  = ref("");
const password  = ref("");

// Register fields
const regUsername        = ref("");
const regEmail           = ref("");
const regPassword        = ref("");
const regPasswordConfirm = ref("");

const authError  = ref("");
const regSuccess = ref("");

// --- Local user storage helpers ---
function getUsers() {
    try { return JSON.parse(localStorage.getItem("radianti_users") || "[]"); }
    catch { return []; }
}
function saveUsers(users) {
    localStorage.setItem("radianti_users", JSON.stringify(users));
}
function getSession() {
    try { return JSON.parse(localStorage.getItem("radianti_session") || "null"); }
    catch { return null; }
}
function saveSession(session) {
    localStorage.setItem("radianti_session", JSON.stringify(session));
}
function clearSession() {
    localStorage.removeItem("radianti_session");
}

// --- Restore session on mount ---
onMounted(() => {
    const session = getSession();
    if (session) {
        loggedIn.value = true;
        role.value     = session.role;
    }
    animate();
});

function openModal(mode) {
    modalMode.value = mode;
    clearForm();
    showModal.value = true;
}

function closeModal() {
    showModal.value = false;
    clearForm();
}

function clearForm() {
    username.value          = "";
    password.value          = "";
    regUsername.value       = "";
    regEmail.value          = "";
    regPassword.value       = "";
    regPasswordConfirm.value = "";
    authError.value         = "";
    regSuccess.value        = "";
}

function login() {
    authError.value = "";
    const u = username.value.trim();
    const p = password.value;

    // Check moderator
    if (u === MODERATOR.username && p === MODERATOR.password) {
        loggedIn.value = true;
        role.value     = "moderator";
        saveSession({ role: "moderator", username: u });
        closeModal();
        return;
    }

    // Check registered users (match by username or email)
    const users = getUsers();
    const found = users.find(
        (user) => (user.username === u || user.email === u) && user.password === p
    );

    if (found) {
        loggedIn.value = true;
        role.value     = "user";
        saveSession({ role: "user", username: found.username, email: found.email });
        closeModal();
    } else {
        authError.value = "Invalid username or password.";
    }
}

function register() {
    authError.value  = "";
    regSuccess.value = "";

    const u  = regUsername.value.trim();
    const e  = regEmail.value.trim().toLowerCase();
    const p  = regPassword.value;
    const p2 = regPasswordConfirm.value;

    if (!u || !e || !p || !p2) {
        authError.value = "Please fill in all fields.";
        return;
    }
    if (p.length < 6) {
        authError.value = "Password must be at least 6 characters.";
        return;
    }
    if (p !== p2) {
        authError.value = "Passwords do not match.";
        return;
    }
    // Username cannot be the reserved moderator name
    if (u === MODERATOR.username) {
        authError.value = "That username is not available.";
        return;
    }

    const users = getUsers();
    if (users.find((user) => user.username === u)) {
        authError.value = "Username is already taken.";
        return;
    }
    if (users.find((user) => user.email === e)) {
        authError.value = "An account with that email already exists.";
        return;
    }

    users.push({ username: u, email: e, password: p });
    saveUsers(users);

    regSuccess.value = "Account created! You can now sign in.";
    // Auto-switch to login after a short delay
    setTimeout(() => {
        modalMode.value  = "login";
        regSuccess.value = "";
        username.value   = u;
    }, 1500);
}

function logout() {
    loggedIn.value = false;
    role.value     = "";
    clearSession();
    router.push("/");
}

// --- Floating circle animation ---
const offsetX    = ref(0);
const offsetY    = ref(0);
let animationId  = null;
let angle        = 0;
const radius     = 20;
const speed      = 0.006;

function animate() {
    angle += speed;
    offsetX.value = Math.cos(angle) * radius;
    offsetY.value = Math.sin(angle) * radius;
    animationId   = requestAnimationFrame(animate);
}

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

.nav-btn--teal {
    background: #0fefaa;
    border-color: #0fefaa;
    color: #171642;
}

.nav-btn--teal:hover {
    background: #0cd090;
    border-color: #0cd090;
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
    max-width: 400px;
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

/* --- Tabs --- */
.modal-tabs {
    display: flex;
    gap: 0;
    border-radius: 2rem;
    background: #f0f0f8;
    padding: 0.25rem;
    margin-bottom: 0.5rem;
}

.tab-btn {
    flex: 1;
    padding: 0.55rem 1rem;
    font-family: "Red Hat Text", sans-serif;
    font-weight: 700;
    font-size: 0.9rem;
    border: none;
    border-radius: 2rem;
    cursor: pointer;
    background: transparent;
    color: #171642;
    opacity: 0.5;
    transition: all 0.2s;
}

.tab-btn--active {
    background: #171642;
    color: #ffffff;
    opacity: 1;
}

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

.label-hint {
    font-weight: 400;
    opacity: 0.55;
    font-size: 0.78rem;
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

.success-msg {
    color: #0a8f65;
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