<template>
  <div id="app">
    <notifications group="notice" position="top center" :max="1" />
    <router-view />
  </div>
</template>

<style>
:root {
  --bg-dark: #070b14;
  --bg-panel: rgba(15, 23, 42, 0.85);
  --neon-blue: #38bdf8;
  --neon-green: #34d399;
  --neon-pink: #f472b6;
  --text-main: #ffffff;
  --text-muted: #cbd5e1;
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--bg-dark);
  color: var(--text-main);
  background-image: 
    radial-gradient(circle at 15% 50%, rgba(56, 189, 248, 0.08), transparent 30%),
    radial-gradient(circle at 85% 30%, rgba(52, 211, 153, 0.08), transparent 30%);
  min-height: 100vh;
}

#app {
  font-family: "Noto Sans JP", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}

h1, h2, h3, .ns-orbitron {
  font-family: "Orbitron", sans-serif;
  letter-spacing: 2px;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: var(--neon-blue);
  text-decoration: none;
  transition: text-shadow 0.3s;
}

#nav a:hover {
  text-shadow: 0 0 8px var(--neon-blue);
}

#nav a.router-link-exact-active {
  color: var(--neon-green);
}
</style>
