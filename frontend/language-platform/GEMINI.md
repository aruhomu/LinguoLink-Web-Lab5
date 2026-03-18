CONTEXT FILE: LinguoLink (React + Firebase) Lab 4 - FINAL VERSION WITH UI FIXES



PROJECT ROLE AND USER

User Role: UI/UX Designer / Student.

Project Name: LinguoLink (Language learning platform).

Task: University Laboratory Work 4 (Variant 14).



TECH STACK

Frontend: React.js (Hooks: useState, useEffect).

Backend: Firebase Authentication (Email/Password) and Cloud Firestore.



VARIANT 14 SPECIFIC LOGIC



&nbsp;   Private Content Access: The My Cabinet and Practice section (id practice) must be PRIVATE. It is visible only if user state is not null. Guests see a login prompt.



&nbsp;   Per-User Progress: Room status (viewed/not viewed) must be unique to each user. Progress data is stored in the user\_progress collection where the Document ID is the user's UID.



&nbsp;   Dynamic Progress Calculation: The percentage in ProgressChart is calculated as (viewedRooms.length / totalRooms.length) \* 100.



&nbsp;   Feedback Management: Reading feedbacks is PUBLIC (available to guests). Submitting feedbacks is PRIVATE (available only to authenticated users).



UI/UX REFINEMENT SPECIFICATIONS



&nbsp;   Library Header Styling: Remove cramped spacing. Apply display: flex, justify-content: space-between, and align-items: center to the banner. Set horizontal padding to 40px and vertical padding to 20px. Ensure the filter dropdown is perfectly centered.



&nbsp;   Scroll and Layering Fix: The white Library Header banner must not overlap or crawl over the main top navigation menu (header) when scrolling down. Ensure the main site header has a higher z-index (e.g., 1000) than the library banner. Use appropriate sticky/fixed positioning logic to keep the layout clean.



&nbsp;   Auth Form Redesign: Remove all dashed borders used for debugging. Style the Register and Login forms as professional cards: white background (#ffffff), soft box-shadow (0 4px 15px rgba(0,0,0,0.1)), 12px border-radius, and consistent brand typography. Ensure the form design matches the overall slate and white aesthetic of the page.



&nbsp;   Spacing and Margins: Ensure consistent gaps between sections. The Library banner should have balanced margins to separate it visually from the sections above and below.



DATABASE ARCHITECTURE

Collection: rooms (Global) - Lesson metadata (name, description, image, default status).

Collection: user\_progress (Per-User) - Doc ID: user.uid. Field: viewedRooms (Array of room IDs).

Collection: feedbacks (Global) - Stores name, message, timestamp, and userId.

Collection: user\_stats (Per-User) - Doc ID: user.uid. Tracks quiz scores and total completion rate.



VERIFICATION CHECKLIST FOR CODE EXECUTION



&nbsp;   Authentication: Ensure onAuthStateChanged is used in App.js to maintain session persistence. Verify that the logout button successfully clears the user state.



&nbsp;   Firestore Integration: Confirm that Mark as viewed triggers a Firestore update for the specific user and that the UI reflects this change without a page reload.



&nbsp;   Conditional Rendering: Verify that the Practice section is hidden from unauthenticated users.



&nbsp;   Math Accuracy: Confirm the progress bar percentage updates correctly based on the real-time count of viewed rooms in Firestore.



&nbsp;   Layering Check: Scroll down the page to ensure the Library banner correctly slides behind the main navigation bar and doesn't overlap its content.



&nbsp;   Form Styling: Ensure Register/Login forms look like clean production-ready cards with no debug borders.



INSTRUCTIONS FOR AI (GEMINI CLI MODE)



&nbsp;   Code Generation: Provide clean, modular React code using try/catch blocks for all Firebase async calls.



&nbsp;   Styling: Prioritize modern UI/UX principles. Use a clean, slate-colored theme consistent with the header. Fix z-index issues to prevent element overlapping during scroll.



&nbsp;   Data Migration: Replace all remaining LocalStorage logic with Firestore queries for user-specific data.



&nbsp;   Documentation: Be ready to explain the logic of Firebase hooks and Firestore security rules for the project report.

