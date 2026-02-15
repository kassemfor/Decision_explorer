# 🧠 Decision Explorer

**Strategic Causality Mapping & Analysis Engine**

[![Powered by Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Backend Fastify](https://img.shields.io/badge/Backend-Fastify-white?logo=fastify&logoColor=black)](https://www.fastify.io/)
[![Database Prisma](https://img.shields.io/badge/Database-Prisma-2D3748?logo=prisma)](https://www.prisma.io/)
[![Graph Cytoscape](https://img.shields.io/badge/Graph-Cytoscape.js-FF4500?logo=cytoscape)](https://js.cytoscape.org/)

Decision Explorer is a professional-grade tool for **Strategic Options Development and Analysis (SODA)**. It allows teams to map complex causal relationships, identify strategic goals, and discover high-leverage action points using the **Eden & Ackermann "Making Strategy"** framework.

---

## 🚀 Key Features

### 🎨 Intelligent Map Editor
- **Dynamic Canvas**: Seamlessly drag, arrange, and cluster nodes to visualize mental models.
- **Causal Linking**: Create links with **Polarity** (+/-) and **Strength** (1-5) to model complex influence chains.
- **Smart Inspector**: A detailed sidebar for refining node metadata, tags, and notes.

### 📊 Advanced Strategic Analytics
Decision Explorer doesn't just draw maps; it analyzes them using graph theory:
- **Heads (Strategic Goals)**: Identify the endpoints of your causal chains—the values and outcomes you ultimately want to achieve.
- **Tails (Action Levers)**: Locate the root causes—the points where you have the most direct influence.
- **Potent Nodes**: Discover "Silver Bullets"—actions that influence two or more strategic goals simultaneously.
- **Feedback Loops**: Automatically detect virtuous and vicious cycles (Strongly Connected Components).
- **Domain Analysis**: Identify "Busy" concepts that act as strategic hotspots or bottlenecks.

### 🛡️ Smart Hints & Badges
Nodes on the canvas are automatically badged with their strategic role:
- 🎯 **Head**: A strategic endpoint/goal.
- ⚡ **Tail**: A direct intervention point.
- 💎 **Potent**: A high-leverage action lever.
- 🔥 **Busy**: A concept with high connectivity (High Domain Score).
- 👻 **Orphan**: A disconnected concept requiring attention.

### 📂 Interoperability (Excel & PNG)
- **Excel Master Sheet**: Export your entire model (Concepts, Links, and Analysis results) into a multi-sheet `.xlsx` workbook.
- **Smart Import**: Upload Excel files to merge or create new maps using title-matching logic.
- **High-Res Export**: Capture your map as a PNG for inclusion in reports and presentations.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, Cytoscape.js, Vanilla CSS (Glassmorphism UI).
- **Backend**: Fastify (Node.js), Zod (Validation), Nanoid.
- **Core Engine**: Custom TypeScript Graph Analysis Package (`@de/graph-core`).
- **Data Layer**: Prisma ORM with PostgreSQL.
- **Excel I/O**: SheetJS (`xlsx`).

---

## 🏗️ Project Structure

```text
├── apps/
│   └── web/            # Next.js Frontend Application
├── services/
│   └── api/            # Fastify Backend API
├── packages/
│   └── graph-core/     # Core Analysis Engine (BFS, SCC, Potent Node Logic)
├── infra/              # Deployment & Docker Configuration
└── prisma/             # Database Schema & Migrations
```

---

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kassemfor/Decision_explorer.git
   cd Decision_explorer
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   cd services/api
   npx prisma migrate dev
   ```

4. **Run the Application**
   ```bash
   # From the root directory
   npm run dev
   ```
   The frontend will be available at `http://localhost:3002` and the API at `http://localhost:4000`.

---

## 📚 Methodology: Making Strategy

Decision Explorer is grounded in the work of **Colin Eden** and **Fran Ackermann**. The tool treats strategy as a "negotiated social process," where the mapping of causal chains helps stakeholders:
1.  **Explicate Belief Systems**: Make implicit assumptions visible.
2.  **Manage Complexity**: Break down "wicked problems" into manageable chains.
3.  **Identify Distinctive Competencies**: Use feedback loops to find self-sustaining competitive advantages.

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
