# CivicFix AI – Project Specification Sheet

## 1. Project Overview

**Project Name:** CivicFix AI  
**Category:** AI-Powered Civic Grievance Management System  
**Track:** Track 1 – Civic Pulse, Digital Governance & Public Information

**Description:**

CivicFix AI is a web application that helps citizens report civic infrastructure problems such as potholes, damaged roads, overflowing garbage, water leakage and drainage issues.

Citizens can upload images of problems. AI analyzes the images, identifies the issue, estimates its severity and categorizes the complaint. Citizens can track their complaints, while administrators can manage and update complaint statuses through an admin dashboard.

## 2. Main Objectives

- Make civic complaint reporting simple.
- Use AI to identify civic problems from images.
- Automatically categorize complaints.
- Estimate complaint severity.
- Help administrators manage complaints.
- Provide transparent complaint tracking.

## 3. User Roles

### A. Citizen
- Register and log in.
- Report a civic problem.
- Upload an image of the problem.
- Enter the problem location and description.
- View AI-generated analysis.
- Submit complaints.
- Track complaint status.
- View complaint history.

### B. Administrator
- Log in through an admin account.
- View all submitted complaints.
- View complaint images and AI analysis.
- Filter complaints by category and severity.
- Update complaint status.
- View dashboard statistics.
- Manage reported complaints.

## 4. Core Features

### Feature 1: User Authentication
- User registration.
- User login and logout.
- Secure password storage.
- Role-based access for citizens and administrators.

### Feature 2: Report a Civic Issue

Create a complaint form containing:
- Problem title.
- Problem description.
- Problem category.
- Image upload.
- Location.
- Submit button.

Supported categories:
- Potholes.
- Road damage.
- Garbage accumulation.
- Water leakage.
- Drainage blockage.
- Other civic issues.

### Feature 3: AI Image Analysis

When a citizen uploads an image:
- Analyze the uploaded image using an AI vision model.
- Identify the civic problem.
- Generate a short description.
- Suggest the complaint category.
- Estimate severity as Low, Medium or High.

Display the AI analysis before complaint submission so the citizen can review and correct it.

### Feature 4: Complaint Management

Every submitted complaint should have:
- Unique complaint ID.
- Citizen details.
- Problem category.
- Uploaded image.
- Location.
- AI-generated description.
- Severity level.
- Submission date.
- Current status.

Complaint statuses:
- Submitted.
- Under Review.
- In Progress.
- Resolved.
- Rejected.

### Feature 5: Citizen Dashboard

Display:
- Total complaints submitted.
- Pending complaints.
- Complaints in progress.
- Resolved complaints.
- Recent complaints.
- Complaint tracking information.

### Feature 6: Admin Dashboard

Display:
- Total complaints.
- Pending complaints.
- High-priority complaints.
- Complaints in progress.
- Resolved complaints.

Admin functionalities:
- View all complaints.
- Search complaints by ID.
- Filter by category and severity.
- View uploaded images.
- Update complaint status.
- Add administrative remarks.

## 5. Technology Stack

Frontend:
- React.js
- HTML5
- CSS3
- Bootstrap or Tailwind CSS

Backend:
- Node.js
- Express.js

Database:
- MongoDB

AI Integration:
- Python or Node.js AI service.
- Gemini API with image understanding, or another compatible vision model.

Image Storage:
- Cloudinary or local development storage.

Authentication:
- JWT authentication.
- bcrypt password hashing.

## 6. Basic Application Workflow

1. Citizen registers or logs in.
2. Citizen opens the Report Issue page.
3. Citizen uploads a civic problem image.
4. AI analyzes the image.
5. System displays the detected problem, category and severity.
6. Citizen enters the location and confirms the complaint.
7. System generates a unique complaint ID.
8. Complaint is stored in MongoDB.
9. Administrator views the complaint.
10. Administrator updates the complaint status.
11. Citizen tracks the latest status through their dashboard.

## 7. Main Application Pages

1. Home Page – Project introduction and how it works.
2. Register Page – Citizen registration.
3. Login Page – User and administrator login.
4. Citizen Dashboard – Complaint statistics and history.
5. Report Issue Page – Complaint submission and AI analysis.
6. Complaint Details Page – Complete complaint information and tracking.
7. Admin Dashboard – Overall complaint statistics.
8. Manage Complaints Page – Review and update complaints.

## 8. UI/UX Requirements

- Clean, modern and responsive design.
- Simple navigation.
- Professional dashboard layout.
- Use cards for statistics.
- Use tables for complaint management.
- Use clear status labels.
- Provide image previews before uploading.
- Show loading indicators during AI analysis.
- Display proper success and error messages.
- Support desktop and mobile devices.

## 9. Database Collections

### Users
- name
- email
- password
- role
- createdAt

### Complaints
- complaintId
- userId
- title
- description
- category
- imageUrl
- location
- latitude
- longitude
- aiAnalysis
- severity
- status
- adminRemarks
- createdAt
- updatedAt

## 10. AI Requirements

The AI should:
- Analyze civic issue images.
- Identify the most likely issue.
- Generate a short explanation.
- Recommend a category.
- Assign a suggested severity.
- Return structured JSON results.

Example AI response:

{
  "detectedIssue": "Road Pothole",
  "category": "Potholes",
  "severity": "High",
  "description": "A large pothole is visible on the road and may create a safety risk.",
  "confidence": 0.92
}

AI results must be treated as suggestions, not verified facts. Citizens and administrators should be able to correct incorrect classifications and severity levels.

## 11. Security Requirements

- Hash passwords before storing them.
- Protect private dashboard routes.
- Implement role-based authorization.
- Validate uploaded image types and file sizes.
- Keep API keys in environment variables.
- Prevent unauthorized complaint updates.
- Citizens must only access their own complaints.
- Administrators can access all complaints.

## 12. Development Priorities

Build the project in this order:

1. Frontend design and navigation.
2. Backend and database setup.
3. User authentication.
4. Complaint reporting.
5. AI image analysis.
6. Citizen dashboard.
7. Admin dashboard.
8. Complaint status management.
9. Testing and bug fixing.
10. Deployment.

## 13. Final Expected Output

A fully functional, responsive web application where citizens can report civic infrastructure problems using images, receive AI-generated issue classification and severity suggestions, submit complaints and track their progress.

Administrators should be able to review complaints, prioritize reported issues and update their resolution status.

**Important:** Build a working end-to-end application. Do not create only static UI pages or dummy buttons. All forms, authentication, database operations, AI integration and dashboard actions must work.
Act as a senior full-stack developer. Read the complete CivicFix AI specification carefully.

Before coding:
1. Analyze the requirements.
2. Design the project folder structure.
3. Identify the required dependencies and APIs.
4. Create a step-by-step implementation plan.

Then implement the application module by module.

Important instructions:
- Write clean, beginner-friendly and maintainable code.
- Use reusable React components.
- Connect the frontend, backend and MongoDB properly.
- Implement real authentication and authorization.
- Integrate actual AI image analysis.
- Do not use hardcoded dashboard statistics or fake AI results.
- Add proper validation and error handling.
- Create an .env.example file.
- Include clear instructions to install and run the application locally.
- Test each major feature before moving to the next module.

Start by setting up the project structure and implementing the first working module. Do not skip requirements from the specification.