# 📦 LogiTrack Pro

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **The ultimate command center for modern logistics and package management.**

LogiTrack Pro is a state-of-the-art, fully responsive React application designed to streamline package tracking, optimize operational workflows, and provide real-time analytics for logistics teams. Built with performance and user experience in mind, it transforms complex supply chain data into actionable, beautifully visualized insights.

![LogiTrack Pro Banner](https://images.unsplash.com/photo-1586528116311-ad8ed7c663c0?auto=format&fit=crop&q=80&w=2000&h=600)

---

## ✨ Key Features

### 🧩 Intelligent Customizable Dashboard
Your workspace, optimized for clarity. The dashboard provides a high-level overview of your entire operation at a glance, and is fully customizable.
- **Customizable Widgets**: Pin your favorite charts, key metrics, or saved filter views for a personalized daily overview.
- **Real-Time Metrics**: Instantly view Total Packages, Completed, Pending, and Action Required shipments.
- **Visual Analytics**: Beautiful, responsive pie and bar charts powered by `recharts` for status distribution and priority breakdowns.
- **Activity Feed**: Keep track of the latest updates and movements in your supply chain.
- **Quick Notes**: A persistent scratchpad for jotting down important reminders or tracking numbers.

### 📋 Omni-View Package Management
Visualize your freight exactly how you want to.
- **Data Table View**: High-density, sortable, and filterable list for power users. Includes inline editing and collapsible rows with a visual **Progress Stepper**.
- **Kanban Board View**: Drag-and-drop cards across status columns for a visual pipeline of your operations.
- **Color-Coded Custom Tags**: Create and apply visual pill-shaped tags (e.g., "Fragile", "VIP Client", "Delayed") for quick visual scanning.
- **Context Menus**: Right-click any package to instantly Edit, Copy Tracking, Change Status, or Delete without opening a modal.
- **Priority Indicators**: Color-coded visual cues (Low, Medium, High, Urgent) ensure critical shipments never slip through the cracks.
- **Progressive Disclosure Forms**: Clean and intuitive forms that hide optional/advanced fields under an "Advanced Options" toggle.
- **Visual Date Picker**: Rich, interactive calendar popover for easy date selection.

### 🚀 Enhanced User Experience
- **Interactive Onboarding Tour**: Guided walkthrough for new users to quickly learn the application's key features.
- **Rich Empty States**: Beautiful and informative empty state screens with helpful illustrations and clear calls to action.
- **Collapsible Sidebar**: Maximize your screen real estate with a collapsible navigation sidebar.

### 📊 Professional Reporting & Analytics
Turn raw data into strategic decisions.
- **Interactive Charts**: Dive deep into processing times and performance metrics.
- **Structured PDF Export**: Generate professional, multi-page PDF reports instantly using `jsPDF` and `jspdf-autotable`. Reports include summary statistics, status distributions, processing times, and a complete tabular breakdown of all filtered packages.

### ☁️ Advanced Sync & Automation
- **First-Launch Cloud Sync**: Seamlessly link your application to an existing Google Drive JSON database on your very first launch using the File System Access API, ensuring you pick up right where you left off.
- **Data Import Mapping Tool**: Visually map columns from your CSV spreadsheet to the application's data fields for a seamless import experience.
- **Automated Archiving**: Keep your active workspace clean with smart auto-archiving for completed or cancelled shipments. Includes **Archive Timestamps** to track exactly when a package was archived, and **Real-Time UI Sync** to instantly reflect archived items without refreshing.
- **Custom Fields**: Extend the data model on the fly with custom text, number, date, or dropdown fields. **CSV Exports** now intelligently map these custom fields to their human-readable names instead of internal IDs.
- **Duplicate Detection**: Smart UI warnings alert you if you attempt to create a package with a Tracking Number or R Number that already exists in the system, preventing data entry errors.

---

## 🛠️ Tech Stack

LogiTrack Pro is built on a modern, type-safe foundation:

*   **Core**: React 18, TypeScript, Vite
*   **Styling**: Tailwind CSS (with Dark Mode support)
*   **Data Visualization**: `recharts`
*   **Icons**: `lucide-react`
*   **Utilities**: `date-fns` (time manipulation), `jspdf` & `jspdf-autotable` (reporting)
*   **Storage**: LocalStorage & IndexedDB (`idb-keyval`) for robust offline persistence and file handle management.

---

## 🚀 Getting Started

### Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18+) and `npm` installed.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/logitap-pro.git
   cd logitap-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

---

## 📁 Project Structure

```text
src/
├── components/       # Reusable UI components and main views (Dashboard, Reports, etc.)
├── store/            # React Context providers for global state management
├── types/            # TypeScript interface and type definitions
├── App.tsx           # Main application entry point and routing
├── index.css         # Global Tailwind CSS imports and custom styles
└── main.tsx          # React DOM rendering
```

---

## 💡 Usage Guide

### First Launch & Cloud Sync
1. Upon opening the app for the first time, you will be greeted by the **Welcome Screen**.
2. Click **Link Existing Database** to connect a previously exported JSON file (e.g., from your local Google Drive sync folder) using the File System Access API.
3. Alternatively, click **Start Fresh** to begin with an empty workspace.

### Managing Packages
1. Navigate to the **Packages** tab.
2. Use the **Add Package** button to create a new shipment.
3. Toggle between **Table** and **Board** views using the icons in the top right.
4. In the Board view, drag and drop cards between columns to update their status.
5. In the Table view, right-click any row to access quick actions like Edit or Delete.

### Generating Professional Reports
1. Navigate to the **Reports** tab.
2. Use the **Date Range** filter to scope your data (e.g., "Last 30 Days").
3. Review the interactive charts to ensure the data is correct.
4. Click **Export PDF** to generate a structured, multi-page document containing your summary statistics, charts data, and a full table of the filtered packages.

---

## 🤝 Contributing

We welcome contributions to make LogiTrack Pro even better! 
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Built with ❤️ for logistics professionals everywhere.*
