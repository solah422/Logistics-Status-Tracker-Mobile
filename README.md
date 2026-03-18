# Logistics Status Tracker

A lightning-fast, mobile-first web application designed for tracking logistics documentation, declaration forms, and customs statuses on the go. Upload any CSV or JSON database and instantly search, filter, and share records.

## ✨ Features

*   **Universal File Support**: Upload any standard `.csv` or `.json` database file. Data is persisted locally so you don't have to re-upload on your next visit.
*   **Virtual Scrolling**: Powered by TanStack Virtual, the app can effortlessly render massive datasets (10,000+ records) on mobile devices without any lag or performance drops.
*   **Advanced Search & Highlighting**: Global search across all fields with real-time yellow highlighting of matching text inside the cards.
*   **Multi-Filter System**: Apply multiple specific column filters simultaneously (e.g., Status contains "Pending" AND Priority contains "High").
*   **Smart Sorting**: Sort your database by any column in Ascending or Descending order. The app intelligently detects numbers and currencies to sort them mathematically rather than alphabetically.
*   **Customizable Card Views**: Use the Settings menu to define exactly what data appears on the summary cards. Choose your Primary Identifier, Status Badge, Priority Badge, and up to 4 additional quick-view fields.
*   **Dynamic Badges**: Automatically color-codes status and priority badges based on context (e.g., Red for "Urgent" or "Error", Green for "Complete", Yellow for "Pending").
*   **Smart Data Formatting**: Automatically detects ISO dates and formats them into readable strings (e.g., "Mar 15, 2026"). Automatically formats columns named "Price", "Cost", "Duty", etc., into USD currency.
*   **Grouped Detail View**: Keeps large databases clean by splitting the detail modal into "Key Information" and an expandable "Additional Details" accordion.
*   **Quick Share & Copy**: Instantly copy a formatted record to your clipboard or share it via the native mobile share sheet to text or email colleagues.
*   **Premium UI/UX**: Features a sleek dark-mode default interface, smooth Framer Motion animations, and subtle Web Audio API sound effects (pops, swooshes, clicks) for a native app feel.

## 📱 Android App Ready

This project is pre-configured with [Capacitor](https://capacitorjs.com/) to be easily converted into a native Android application.

To build the Android APK:
1. Ensure you have Android Studio installed.
2. Run the following commands in your terminal:
   ```bash
   npm install
   npm run build
   npx cap add android
   npx cap sync
   npx cap open android
   ```
3. Build the APK from within Android Studio.

## 🛠️ Tech Stack

*   **Framework**: React 18 + TypeScript + Vite
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **Animations**: Framer Motion (motion/react)
*   **Virtualization**: @tanstack/react-virtual
*   **CSV Parsing**: PapaParse
*   **Native Wrapper**: Capacitor
