UniSkills – AI-Powered Personalized Learning & Career Development Platform
Overview

UniSkills is an AI-powered learning and career guidance platform designed to help students discover career opportunities, build personalized learning roadmaps, and track their academic and professional growth in a structured way.

The platform combines intelligent recommendation systems, interactive learning experiences, and real-time progress tracking to create a modern digital learning ecosystem tailored to individual goals and skill levels.

UniSkills aims to bridge the gap between traditional education and industry-ready skills by providing students with curated learning paths, AI-generated career insights, and performance-based recommendations.

Key Features
Personalized Career Path Generation
Generates customized career roadmaps based on:
User interests
Skill levels
Learning goals
Preferred domains
Helps students explore career trajectories in fields like:
Web Development
AI & Machine Learning
Data Science
Cybersecurity
UI/UX Design
Cloud Computing
AI-Powered Learning Recommendations
Integrates AI models using the GROQ API to:
Recommend relevant courses and resources
Suggest next learning steps
Provide personalized skill improvement guidance
Generate intelligent career summaries
Progress Tracking & Skill Assessment
Tracks:
Completed modules
Learning consistency
Assessment performance
Skill progression
Visual indicators and dashboards help users monitor growth over time.
Interactive Learning Modules
Dynamic and responsive learning interface
Engaging UI with animations and smooth transitions
Modular learning structure for better content organization
Career Summary Reports
Generates AI-powered career summaries and insights
Helps students understand:
Current strengths
Skill gaps
Recommended improvement areas
Career readiness status
Authentication & User Management
Secure user authentication using Appwrite
User-specific learning data and personalized dashboards
Session handling and protected routes
Responsive Modern UI
Fully responsive design for:
Desktop
Tablet
Mobile devices
Built with Tailwind CSS and Framer Motion for a modern user experience.

Tech Stack
Frontend
React.js
Vite
Tailwind CSS
Framer Motion
Backend & Database
Appwrite
Authentication
Database
Backend services
User management
AI Integration
GROQ API
AI-generated recommendations
Career insights
Personalized summaries
System Architecture
Frontend (React + Vite)
        │
        ▼
Appwrite Backend Services
(Authentication, Database, User Management)
        │
        ▼
GROQ AI Integration
(Recommendations & Career Insights)
Core Functionalities
Module	Functionality
Authentication	Secure login/signup and session management
Career Path Engine	Personalized roadmap generation
AI Recommendation Engine	Smart learning suggestions
Progress Dashboard	Learning analytics and tracking
Assessment System	Skill evaluation and scoring
Career Insights	AI-generated summaries and recommendations
Project Goals
Help students identify suitable career paths
Provide structured learning guidance
Improve skill development efficiency
Deliver personalized educational experiences
Enhance career readiness using AI-driven insights
Installation & Setup
Prerequisites

Make sure you have the following installed:

Node.js
npm or yarn
Appwrite instance/setup
GROQ API key
Clone the Repository
git clone https://github.com/your-username/uni-skills-final.git
cd uni-skills-final
Install Dependencies
npm install
Environment Variables

Create a .env file in the root directory and add the following variables:

VITE_APPWRITE_ENDPOINT=
VITE_APPWRITE_PROJECT_ID=
VITE_APPWRITE_DATABASE_ID=
VITE_APPWRITE_COLLECTION_ID=
VITE_APPWRITE_BUCKET_ID=
VITE_GROQ_API_KEY=

Add all required API keys and Appwrite configuration values before running the project.

Run Development Server
npm run dev

Folder Structure
src/
│
├── components/       # Reusable UI components
├── pages/            # Application pages/routes
├── services/         # API and backend integrations
├── hooks/            # Custom React hooks
├── context/          # Global state management
├── assets/           # Images and static assets
├── utils/            # Helper functions
└── styles/           # Global styles
Performance & Optimization
Fast build system powered by Vite
Component-based scalable architecture
Optimized rendering with React hooks
Smooth animations using Framer Motion
Responsive UI optimized for multiple devices
Security Features
Secure authentication with Appwrite
Environment-based API key management
Protected routes and user-specific access
Secure backend communication
Future Enhancements
Real-time collaborative learning
Gamification and achievement badges
AI mock interviews
Resume analysis and ATS scoring
Community discussion forums
Course marketplace integration
Multi-language support
Use Cases
Students exploring career options
Learners building technical skills
Educational institutions
Skill development platforms
Career counseling systems
Contributing

Contributions are welcome.

Steps to contribute:
Fork the repository
Create a feature branch
Commit your changes
Push the branch
Open a pull request
License

This project is licensed under the MIT License.

Author

Nihal Anand
Full Stack Developer | MERN Stack Enthusiast | AI-Integrated Web Applications Developer
