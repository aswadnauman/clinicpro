# AI Development Rules for Trading Business Application

This document outlines the technical stack and specific rules for using libraries and frameworks within this application. Adhering to these guidelines ensures consistency, maintainability, and alignment with the project's current architecture.

## Tech Stack Overview

This application is built using a traditional web development stack, focusing on simplicity and direct server-side rendering where applicable.

*   **Frontend:** HTML5, CSS3, and Vanilla JavaScript.
*   **Backend:** PHP for all server-side logic and API endpoints.
*   **Database:** MySQL, managed through PHP's `mysqli` extension.
*   **API Communication:** RESTful API endpoints implemented in PHP, consumed by the frontend using the native JavaScript `fetch` API.
*   **Styling:** Pure CSS is used for all visual presentation and layout. No CSS frameworks or preprocessors are currently in use.
*   **Icons:** Font Awesome is utilized for all iconography, loaded via a CDN.
*   **Client-side Navigation:** Navigation between different sections and forms is handled by direct HTML page loads, rather than a client-side routing library.
*   **Data Export:** Server-side CSV generation is implemented in PHP. Client-side PDF generation is a planned feature, with `jsPDF` being the recommended library for this purpose.

## Library and Tooling Rules

To maintain the current architecture and avoid introducing unnecessary complexity, please adhere to the following rules:

### Frontend Development
*   **JavaScript Frameworks:** Strictly **Vanilla JavaScript**. Do NOT introduce or use frameworks such as React, Vue, Angular, or similar.
*   **Styling:** Use **pure CSS**. Avoid CSS frameworks (e.g., Bootstrap, Tailwind CSS) or preprocessors (e.g., SASS, LESS). All styling should be written directly in `.css` files.
*   **Icons:** Use **Font Awesome** for all icons, loaded via its CDN.
*   **API Communication:** All asynchronous requests to the backend API must use the native **`fetch` API**.
*   **PDF Generation (Client-side):** If client-side PDF generation is implemented, use the **`jsPDF`** library.
*   **CSV Generation (Client-side):** Client-side CSV generation is not currently implemented. The backend handles CSV exports.

### Backend Development (PHP)
*   **PHP Frameworks:** Strictly **Vanilla PHP**. Do NOT introduce or use PHP frameworks such as Laravel, Symfony, CodeIgniter, etc.
*   **Database Interaction:** Use the **`mysqli` extension** for all interactions with the MySQL database. Avoid ORMs or other database abstraction layers.
*   **API Design:** Adhere to **RESTful principles** for designing and implementing API endpoints.
*   **CSV Generation (Server-side):** Handle CSV generation directly within PHP scripts, as demonstrated in `export.php`.

### Database (MySQL)
*   **Schema Management:** Database schema and initial data should be managed through SQL scripts (`.sql` files).
*   **Interaction:** Direct SQL queries are preferred within PHP scripts.

### General
*   **Build Tools:** The project does NOT use any build tools (e.g., Webpack, Vite, Gulp). Keep the development process simple and direct.
*   **File Structure:** Maintain the existing file structure, with `app.js` and `styles.css` in the root, API endpoints in `api/`, and HTML forms in `forms/`.