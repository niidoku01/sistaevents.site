# Sista Events & Rentals

## Project info

A premium event rental services platform for weddings, corporate events, and celebrations.

## 🔒 Security Features

This application includes comprehensive security measures:

- **Helmet.js** - HTTP security headers (XSS, clickjacking protection)
- **Rate Limiting** - Protection against DDoS and brute force attacks
- **Input Validation** - Sanitization of all user inputs
- **CORS Configuration** - Restricted cross-origin access
- **File Upload Security** - Type and size restrictions
- **Security Headers** - Content Security Policy, X-Frame-Options, etc.

📖 **Full documentation**: See [SECURITY.md](./SECURITY.md) and [SECURITY_TESTING.md](./SECURITY_TESTING.md)

## How to edit this code

**Local Development**

Clone this repo and work with your preferred IDE. Push changes to update the application.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

You can deploy this project using platforms like Netlify, Vercel, GitHub Pages, or any other static hosting service that supports React applications.
