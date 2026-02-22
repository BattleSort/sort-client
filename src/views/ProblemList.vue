<template>
  <div class="problem-list-container">
    <h1 class="ns-orbitron">DEBUG: ALL PROBLEMS</h1>
    <router-link to="/" class="btn-back">HOME</router-link>
    
    <div class="problem-grid">
      <div v-for="category in problems" :key="category.category + '-' + category.level" class="category-section">
        <h2 class="category-title">CATEGORY {{ category.category }} - LEVEL {{ category.level }}</h2>
        
        <div class="problems-container">
          <div v-for="problem in category.problems" :key="problem.id" class="problem-card glass-panel">
            <h3 class="problem-name">{{ problem.name }}</h3>
            <div class="problem-details">
              <div class="detail-item">
                <span class="label">ID:</span> {{ problem.id }}
              </div>
              <div class="detail-item">
                <span class="label">ELEMENTS:</span>
                <ul class="element-list">
                  <li v-for="el in problem.elements" :key="el">{{ el }}</li>
                </ul>
              </div>
              <div class="detail-item">
                <span class="label">CORRECT ORDER:</span>
                <span class="correct-order">{{ problem.correctOrder.join(' ❯ ') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mockProblems } from "../game/mockProblems";

export default {
  name: "ProblemList",
  data() {
    return {
      problems: mockProblems
    };
  }
};
</script>

<style scoped>
.problem-list-container {
  padding: 40px;
  color: #fff;
}

.ns-orbitron {
  font-family: 'Orbitron', sans-serif;
  color: var(--neon-blue);
  text-align: center;
  margin-bottom: 20px;
}

.btn-back {
  display: inline-block;
  margin-bottom: 40px;
  color: var(--text-muted);
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 4px;
}

.category-section {
  margin-bottom: 60px;
}

.category-title {
  color: var(--neon-green);
  border-bottom: 1px solid var(--neon-green);
  padding-bottom: 10px;
  margin-bottom: 25px;
}

.problems-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.problem-card {
  padding: 20px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.problem-name {
  margin-top: 0;
  font-size: 1.2rem;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.detail-item {
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.label {
  color: var(--text-muted);
  font-weight: bold;
  margin-right: 8px;
}

.element-list {
  list-style: none;
  padding: 0;
  margin: 5px 0 0 15px;
  color: #fff;
}

.element-list li::before {
  content: '•';
  color: var(--neon-blue);
  margin-right: 8px;
}

.correct-order {
  color: var(--neon-green);
  font-weight: bold;
}
</style>
