<script setup>
const props = defineProps({
  tag: String
})
const emit = defineEmits(["delete"])

function deleteItem() {
  emit("delete", props.tag)
}
</script>

<template>
  <label>{{ props.tag }}</label>
  <button @click="deleteItem"> X </button>
  <br>
</template>

<style scoped>

</style>