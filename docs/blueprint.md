# **App Name**: CRMI TaskFlow

## Core Features:

- Authentication & User Role Management: Implement user registration, login, and logout. Manage diverse user roles (Owner, Department Head, Inspector, Reader) with role-based storage in Firestore and integration with Firebase Authentication.
- Departmental Task Listing & Filtering: Display an interactive list of tasks, presented as cards. Tasks are filtered based on the user's department, with 'Owner', 'Technical Service Center', and 'Media Center' roles having access to all tasks. Supports client-side rendering for static export.
- Task Creation & Editing Interface: Provide a form for creating new tasks with fields including title, date/time, place, description, dynamic checklist, priority, status, responsible user, and creation date. Enable editing of existing tasks according to user role permissions.
- Detailed Task View & Checklist Interaction: Dedicated pages for each task displaying all task information. Users with 'Reader' roles and higher can interact with and update checklist items (mark as done/undone) within a task.
- Role-Based Access Control for Tasks: Enforce fine-grained access control over viewing, creating, and editing tasks based on assigned user roles ('Owner', 'Department Head', 'Inspector', 'Reader') and department-specific rules, as well as exceptions for 'Technical Service Center' and 'Media Center'.
- Task Completion & Restoration Logic: Manage task status changes, including marking tasks as 'completed'. Completed tasks are hidden from most users but remain visible and can be restored by the 'Owner' role, along with status confirmation prompts.
- AI Checklist Suggestion Tool: An AI tool that suggests relevant checklist items for a new task based on its title and description, assisting users in comprehensive task planning.

## Style Guidelines:

- Primary color: Deep crimson (#BC122B). Inspired by the organization's logo, this rich red evokes professionalism and dynamic action, ideal for interactive elements like buttons and highlights.
- Background color: Very light blush (#F7EFF0). A highly desaturated, warm off-white that provides a clean, modern canvas while harmonizing subtly with the primary color, contributing to a minimalist aesthetic.
- Accent color: Vibrant magenta (#E045BD). An analogous hue chosen for its strong contrast and modern flair, perfect for secondary interactive elements, special notifications, or call-to-action indicators that need to pop.
- Priority indicators: 'Low' will be green (#4CAF50), 'Medium' will be yellow (#FFC107), and 'High' will be a bright red (#F44336). These standard colors ensure clear and immediate visual differentiation for task priority.
- Headline and body text font: 'Inter' (sans-serif). Chosen for its excellent readability, modern neutrality, and clean appearance, suitable for both short headlines and longer descriptions in a minimalist interface.
- Minimalist, clean, and modern line icons. Prioritize clarity and intuitive recognition for task-related actions and navigation, complementing the overall design's sophistication.
- The layout features a card-based structure for task lists with 'white cards' and 'soft shadows' to provide visual depth and separation. The design will be fully responsive for seamless adaptation across various mobile and desktop devices.
- Subtle and purposeful micro-interactions, such as fade-in effects for content loading and gentle transitions for status changes or checklist updates, to enhance user feedback and overall experience without distracting.