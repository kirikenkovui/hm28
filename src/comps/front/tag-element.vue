<script setup>
const props = defineProps({
    tag: String,
});
const emit = defineEmits(["delete"]);

function deleteItem() {
    emit("delete", props.tag);
}
</script>

<template>
    <div class="tag-item">
        <span class="tag-text">{{ props.tag }}</span>
        <button class="tag-delete" @click="deleteItem">×</button>
    </div>
</template>

<style scoped>
.tag-item {
    display: inline-flex;
    align-items: center;
    /* P2: Red Hat Text Regular 20 pt for tag text */
    font-family: "Red Hat Text", sans-serif;
    font-weight: 400;
    font-size: 1.25rem; /* 20pt = 20/16 * 1rem = 1.25rem */
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 2px solid #cacadd;
    border-radius: 0.5rem;
    padding: 0.75rem 1.25rem;
    margin: 0.5rem;
    color: #171642;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.tag-item:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: #676789;
    transform: translateY(-2px);
}

.tag-text {
    margin-right: 1rem;
    color: #171642;
}

.tag-delete {
    background: none;
    border: none;
    color: #676789;
    /* H3: Sora Extra Bold 30 pt for delete button */
    font-family: "Sora", sans-serif;
    font-weight: 800;
    font-size: 1.875rem; /* 30pt = 30/16 * 1rem = 1.875rem */
    cursor: pointer;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    line-height: 1;
}

.tag-delete::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
        circle,
        rgba(255, 255, 255, 0.4) 0%,
        transparent 70%
    );
    animation: shine 3s infinite;
}

.tag-delete:hover {
    background: rgba(15, 250, 170, 0.1);
    color: #0fefaa;
    transform: scale(1.1);
}

.tag-delete:active {
    transform: scale(0.9);
}

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

/* Responsive design */
@media (max-width: 768px) {
    .tag-item {
        font-size: 1.125rem; /* 18pt */
        padding: 0.6rem 1rem;
    }

    .tag-delete {
        font-size: 1.75rem; /* 28pt */
        width: 2rem;
        height: 2rem;
    }
}

@media (max-width: 480px) {
    .tag-item {
        font-size: 1rem; /* 16pt */
        padding: 0.5rem 0.875rem;
    }

    .tag-delete {
        font-size: 1.5rem; /* 24pt */
        width: 1.75rem;
        height: 1.75rem;
    }
}
</style>
