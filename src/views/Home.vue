<template>
  <div class="home">
    <h1 class="title ns-orbitron">BATTLE SORT</h1>
    <p class="subtitle">The Ultimate Sorting Match</p>
    <SelectMatch />
    <p class="version">v1.0.0 (P2P)</p>
  </div>
</template>

<script>
import SelectMatch from "@/components/SelectMatch.vue";

export default {
  name: "Home",
  components: {
    SelectMatch
  }
};
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding-top: 50px;
}

.title {
  font-size: 4rem;
  margin-bottom: 0px;
  color: var(--text-main);
  text-shadow: 0 0 10px rgba(14, 165, 233, 0.5), 0 0 20px rgba(14, 165, 233, 0.3);
  background: linear-gradient(135deg, var(--neon-blue), var(--neon-green));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 1.2rem;
  color: var(--neon-green);
  text-transform: uppercase;
  letter-spacing: 4px;
  margin-top: 5px;
  margin-bottom: 40px;
}

.version {
  margin-top: auto;
  padding-bottom: 20px;
  color: var(--text-muted);
  font-family: 'Orbitron', sans-serif;
  letter-spacing: 1px;
}
</style>
