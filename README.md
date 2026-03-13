# EduGenie – AI Powered Exam Preparation Assistant

EduGenie is an AI-powered study platform that helps students prepare smarter for exams by analyzing their syllabus, study resources, and previous year papers.

Instead of spending hours searching for materials, EduGenie organizes topics, provides structured summaries, enables focused study sessions, and predicts likely exam questions.

The goal is to help students focus on **what matters most for their exams.**

## Problem Statement

Students preparing for exams face several challenges:

- Study resources are scattered across PDFs, YouTube, and notes.
- Students don’t know which topics are most important.
- There is no way to estimate what questions may appear in exams.
- Students spend more time searching than studying.

Existing tools like search engines or generic AI assistants are not syllabus-aware and do not support exam-focused preparation.

## Solution

EduGenie provides an exam-focused preparation system.

Students upload their syllabus and study resources. EduGenie analyzes them and converts them into structured learning units.

The platform then helps students:

- identify important topics
- study using focused sessions
- ask topic-specific doubts
- view predicted exam questions

 ## Core Features

### 1. Syllabus Intelligence
Students upload their syllabus PDF.  
The system extracts units and topics automatically and organizes them into a structured subject dashboard.

### 2. Resource Integration
Students can upload multiple study resources such as PDFs, notes, and previous year papers.  
All resources can be accessed directly within the platform.

### 3. Focus Study Mode
Students can start a timed focus session for a specific unit.

During the session they see:
- structured unit summaries
- key concepts and formulas
- examples
- AI doubt solver

### 4. AI Doubt Solver
A study-focused AI assistant helps answer questions related to the topic being studied.

### 5. AI Exam Predictor
EduGenie generates likely exam questions based on syllabus structure and topic patterns.

Students can revisit the exam predictor page anytime to review expected questions and answers.

### 6. Cheat Sheet Generator
Each unit includes a quick revision cheat sheet with:
- mind maps
- key points
- one-line revision notes

## System Architecture

EduGenie follows a modular architecture consisting of:

Frontend → Backend APIs → Database → AI Processing

1. Frontend  
Built using React and Tailwind CSS for an interactive dashboard and study interface.

2. Backend  
Handles authentication, data processing, and AI requests.

3. Database  
Stores user profiles, subjects, units, topics, and uploaded resources.

4. AI Processing  
Used for:
- syllabus extraction
- unit summaries
- doubt solving
- exam question prediction

## Tech Stack

Frontend
- React
- Vite
- Tailwind CSS
- shadcn/ui

Backend
- Node.js APIs

Database
- Supabase / PostgreSQL

Storage
- Supabase Storage for PDF resources

AI Integration
- AI APIs for syllabus extraction, summaries, chatbot, and exam prediction

 ## User Workflow

1. User signs up and creates a profile
2. Adds subjects and uploads syllabus and resources
3. EduGenie extracts units and topics
4. User studies a unit using Focus Mode
5. AI doubt solver helps during study
6. Exam Predictor generates expected questions
7. User revises using cheat sheets

## Project info

**URL**: edugenie-233dzf6i8-24981a0556-progs-projects.vercel.app

## Installation

Clone the repository

git clone https://github.com/your-repo/edugenie

Navigate to project folder

cd edugenie

Install dependencies

npm install

Run development server

npm run dev
