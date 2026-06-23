# 🎯 Habit Spark
Habit Spark is a premium, cloud-synced habit tracking web application designed with a sleek dark-themed user interface. Built using React.js and Supabase, it empowers users to build routines, track historical consistency, unlock milestone achievements, and maintain their data securely across multiple devices.

# ⚡ Core Features
Intelligent Dashboard: Live calculations for critical consistency metrics, including current streak, longest streak, overall completion rates, and an interactive progress bar.

Automatic Maintenance Engine: Native client-side automation handles midnight resets and computes daily streak decays if a routine is broken.

7-Day Consistency Matrix: A visual, rolling calendar grid displaying a detailed historical completion timeline for every tracked habit over the past week.

Hall of Trophies: A live gamified achievement system that automatically unlocks milestone badges (🌱 First Steps, 🔥 Building Momentum, 🏆 Consistency Elite, ⚡ Flawless Victory) as progress is logged.

Secure Profile Control: A unified settings control deck allowing users to update their metadata aliases and securely alter passwords with structural confirmation validation.

Robust Authentication Pipeline: Direct email-based or username-based login flows backed securely by Supabase GoTrue Auth.

# 🛠️ Tech Stack
Frontend Framework: React.js (Vite)

Backend & Authentication: Supabase Auth

Database layer: Supabase PostgreSQL (Postgres)

Styling: Custom Vanilla CSS3 (Premium Dark Archetype)

# 🚀 Getting Started
Prerequisites
Ensure you have Node.js (v18+) and npm installed on your local development engine.

1. Clone the Repository
Bash
git clone https://github.com/YOUR_USERNAME/habit-spark.git
cd habit-spark
2. Install Project Dependencies
Bash
npm install
3. Setup Your Environment Variables
Create a .env file in the root directory of your project to hook up your Supabase client engine safely:

Code snippet
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
4. Database Schema Setup
To enable relational sync tracking, verify your Supabase database instance has the following relational table entities configured:

profiles Table
id (uuid, primary key) -> References auth.users.id

username (text, unique)

email (text)

habits Table
id (uuid, primary key)

user_id (uuid) -> References auth.users.id

name (text)

category (text)

streak (int4, default: 0)

longest_streak (int4, default: 0)

completed_today (boolean, default: false)

created_at (timestamptz)

habit_logs Table
id (bigint, primary key)

habit_id (uuid) -> References habits.id on delete cascade

user_id (uuid) -> References auth.users.id

logged_date (text) -> Format: YYYY-MM-DD

# 💻 Local Development Workflow
To boot up the local development compilation server, execute:

Bash
npm run dev
Open http://localhost:5173 inside your browser to interact with the runtime build.

# Developer: Engr. Maquee Reinhart P. Visitacion

📦 Production Deployment
This repository is pre-configured for seamless deployments via Vercel or Netlify. Simply connect your GitHub repository to your host instance and pass your environmental parameters (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) into your deployment console settings.
