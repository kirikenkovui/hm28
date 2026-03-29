<template>
    <section class="admin-panel">
        <h1>Admin Dashboard</h1>

        <div class="links-grid">
            <router-link class="card" to="/detail/back/main">
                <h2>Main Request Search</h2>
                <p>
                    Open full request list with filtering, sorting, comments,
                    hide/delete and Notion sync.
                </p>
            </router-link>

            <router-link class="card" to="/detail/teamassign">
                <h2>Team Assignment</h2>
                <p>
                    Select team and view projects assigned by the same category
                    mapping used in backend.
                </p>
            </router-link>

            <router-link class="card" to="/detail/back/main">
                <h2>Notion Activities</h2>
                <p>
                    Send contacts to Notion, review sync status and retry failed
                    records.
                </p>
            </router-link>
        </div>
    </section>
</template>

<script setup></script>

<style scoped>
.admin-panel {
    min-height: 100vh;
    background-color: #ffffff;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.admin-panel h1 {
    /* H1: Sora Extra Bold 54pt */
    font-family: "Sora", sans-serif;
    font-weight: 800;
    font-size: 3.375rem; /* 54pt */
    margin: 0 0 1.5rem 0;
    color: #171642;
    text-align: center;
}
.links-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    width: 100%;
    max-width: 1200px;
    margin-bottom: 2rem;
}
.card {
    display: block;
    background: #ffffff;
    border: 1.5px solid #cacadd;
    border-radius: 0.75rem;
    padding: 1.5rem;
    color: #171642;
    text-decoration: none;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}
.card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #0fefaa 0%, #11ede2 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
}
.card:hover {
    transform: translateY(-3px);
    box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.1);
}
.card:hover::before {
    opacity: 0.08;
}
.card h2 {
    /* H2: Sora Extra Bold 40pt */
    font-family: "Sora", sans-serif;
    font-weight: 800;
    font-size: 2.5rem; /* 40pt */
    margin: 0 0 1rem 0;
    color: #171642;
    display: flex;
    align-items: center;
}
.card p {
    /* P1: Red Hat Text Regular 30pt */
    font-family: "Red Hat Text", sans-serif;
    font-weight: 400;
    font-size: 1.875rem; /* 30pt */
    margin: 0;
    color: #676789;
    line-height: 1.4;
}
</style>
