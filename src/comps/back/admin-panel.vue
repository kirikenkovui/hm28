<template>
    <div class="page-wrapper">
        <!-- Decorative background circle matching home page -->
        <div class="bg-circle"></div>

        <div class="panel-content">
            <!-- Header -->
            <div class="panel-header">
                <RouterLink to="/" class="back-link">← Home</RouterLink>
                <h1 class="panel-title">Admin Dashboard</h1>
                <p class="panel-subtitle">Manage your workspace</p>
            </div>

            <!-- Cards -->
            <div class="links-grid">
                <RouterLink class="card" to="/detail/back/main">
                    <div class="card-icon">🔍</div>
                    <h2>Main Request Search</h2>
                    <p>
                        Full request list with filtering, sorting, comments,
                        hide/delete and Notion sync.
                    </p>
                    <span class="card-arrow">→</span>
                </RouterLink>

                <RouterLink class="card" to="/detail/teamassign">
                    <div class="card-icon">👥</div>
                    <h2>Team Assignment</h2>
                    <p>
                        Select a team and view projects assigned by category
                        mapping used in the backend.
                    </p>
                    <span class="card-arrow">→</span>
                </RouterLink>
            </div>
        </div>
    </div>
</template>

<script setup></script>

<style scoped>
/* --- Layout --- */
.page-wrapper {
    min-height: 100vh;
    background: linear-gradient(135deg, #0fefaa 0%, #11ede2 100%);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: left;
    padding:4em 2rem;
}

/* Same decorative circle as home page */
.bg-circle {
    position: absolute;
    right: -220px;
    top: 50%;
    transform: translateY(-50%);
    width: 800px;
    height: 800px;
    border-radius: 50%;
    background: #ffffff;
    z-index: 1;
    pointer-events: none;
}

.panel-content {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 960px;
    display: flex;
    flex-direction: column;
    gap: 3rem;
    padding-left: 5em;
}

/* --- Header --- */
.panel-header {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.back-link {
    font-family: "Red Hat Text", sans-serif;
    font-weight: 600;
    font-size: 0.95rem;
    color: #171642;
    text-decoration: none;
    opacity: 0.6;
    transition: opacity 0.2s;
    width: fit-content;
}

.back-link:hover {
    opacity: 1;
}

.panel-title {
    font-family: "Sora", sans-serif;
    font-weight: 800;
    font-size: 3.375rem; /* 54pt */
    color: #171642;
    line-height: 1.1;
    margin: 0;
}

.panel-subtitle {
    font-family: "Red Hat Text", sans-serif;
    font-weight: 400;
    font-size: 1.25rem;
    color: #171642;
    opacity: 0.7;
    margin: 0;
}

/* --- Cards Grid --- */
.links-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.5rem;
    width: 100%;
}

.card {
    background: #ffffff;
    border: 2px solid transparent;
    border-radius: 1.5rem;
    padding: 2.25rem 2rem;
    color: #171642;
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(23, 22, 66, 0.06);
}

.card:hover {
    transform: translateY(-5px);
    border-color: #171642;
    box-shadow: 0 12px 40px rgba(23, 22, 66, 0.14);
}

.card-icon {
    font-size: 2rem;
    line-height: 1;
}

.card h2 {
    font-family: "Sora", sans-serif;
    font-weight: 800;
    font-size: 1.4rem;
    color: #171642;
    margin: 0;
    line-height: 1.2;
}

.card p {
    font-family: "Red Hat Text", sans-serif;
    font-weight: 400;
    font-size: 1rem;
    color: #676789;
    margin: 0;
    line-height: 1.6;
    flex: 1;
}

.card-arrow {
    font-size: 1.2rem;
    font-weight: 700;
    color: #171642;
    opacity: 0;
    transform: translateX(-8px);
    transition: all 0.3s ease;
    align-self: flex-end;
}

.card:hover .card-arrow {
    opacity: 1;
    transform: translateX(0);
}

/* --- Responsive --- */
@media (max-width: 768px) {
    .panel-title {
        font-size: 2.5rem;
    }

    .bg-circle {
        width: 500px;
        height: 500px;
        right: -150px;
    }

    .links-grid {
        grid-template-columns: 1fr;
    }
}
</style>