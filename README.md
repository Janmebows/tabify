# Tabify

A small tool to open tabs automatically while listening to spotify.
Designed to streamline play-along sessions.

Based on the Spotify developer start up project
## Using the app

You will need to register your app and get your own credentials from the
[Spotify for Developers Dashboard](https://developer.spotify.com/dashboard/)

To do so, go to your Spotify for Developers Dashboard, create your
application and register the following callback URI:

`http://localhost:{PORT}/auth/callback`
Where `{PORT}` is the port configured in your `.env` file (see below).

Once you have created your app, create a file called `.env` in the root folder
of the repository with the required credentials and configuration:

```bash
SPOTIFY_CLIENT_ID #Client_ID Configured in Spotify developers dashboard
SPOTIFY_CLIENT_SECRET #Client_Secret configured in Spotify developers dashboard
OPEN_COMMAND # Command to run on CLI for opening tabs. A safe value on linux is xdg-open
TAB_DIRECTORY # Parent-most Directory tab files are found in
SERVER_PORT #Port for the backend / main application
PORT #Port for the frontend (must be different to server port)
```

## Installation

These examples run on Node.js. On its
[website](http://www.nodejs.org/download/) you can find instructions on how to
install it.

Once installed, clone the repository and install its dependencies running:

```bash
npm install
```

## Running the example

Start both client and server with the following command:

```bash
npm run dev
```

The React application will start on `http://localhost:{PORT}`
