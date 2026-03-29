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

                    <div class="buttons-container">
                        <RouterLink to="/detail/front">
                            <button class="nav-btn">Front-End Form</button>
                        </RouterLink>
                        <RouterLink to="/detail/back">
                            <button class="nav-btn nav-btn--outline">
                                Backend
                            </button>
                        </RouterLink>
                    </div>
                </div>
            </section>
        </main>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

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

onMounted(() => {
    animate();
});

onUnmounted(() => {
    cancelAnimationFrame(animationId);
});
</script>

<style scoped>
/* --- Typography Setup --- */
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
    padding-left: 55%; /* Adjust based on circle size */
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 1.5rem;
}

.buttons-container {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
}

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

.nav-btn--outline {
    background: transparent;
    color: #171642;
}

@media (max-width: 900px) {
    .hero-title {
        font-size: 40pt;
    }
    .hero-circle {
        width: 500px;
        height: 500px;
    }
}
</style>
