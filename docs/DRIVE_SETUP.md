# Turning on Google Drive import

Decoded can import a document straight from Google Drive. This needs two things: a
Drive-scoped OAuth token, and a Google API key for the Picker UI. We use Firebase
Auth for the token (it auto-provisions the OAuth client, so you never hand-build
one) and gcloud for the API key. When both are set, the "Google Drive" button
appears in the app on its own.

## Part A: Firebase (the token)

1. Go to https://console.firebase.google.com and create a project, or reuse one.
   You can also drive this with the Firebase MCP (see below).
2. Add a Web app to the project. Firebase shows a config block. Copy these values
   into `.env.local`:

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_APP_ID=...
   ```

3. In the Firebase console: Authentication, Sign-in method, enable Google.
4. Authentication, Settings, Authorized domains: add `dgsx9pmv.insforge.site` and
   `localhost`.

That is the whole OAuth side. Firebase created and manages the OAuth client for
you, and the app requests only the `drive.file` scope (just the file you pick),
which needs no Google verification review.

## Part B: the API key for the Picker UI, via gcloud

gcloud is installed. Run the login once (only you can do this):

```
gcloud auth login
```

Then create the key:

```
./scripts/setup-drive-gcloud.sh YOUR_GCP_PROJECT_ID
```

It enables the Drive and Picker APIs and prints a line to paste into `.env.local`:

```
VITE_GOOGLE_API_KEY=...
```

Use the Google Cloud project that backs your Firebase project so the two line up.
You can also make the key by hand under APIs and Services, Credentials.

## Part C: turn it on

Rebuild and redeploy. The Drive button shows up automatically once both the
`VITE_FIREBASE_*` values and `VITE_GOOGLE_API_KEY` are present.

## The Firebase MCP (optional)

A `.mcp.json` in the repo defines the official Firebase MCP server. To use it,
restart Claude Code so it picks up the server, run `firebase login` once, and the
assistant can then create and manage the Firebase project, apps, and auth. Note
that connecting an MCP and the login are actions only you can take.

## If you would rather skip Firebase

Set `VITE_GOOGLE_CLIENT_ID` instead (a hand-made OAuth Web client in the Console)
and the app falls back to Google Identity Services. Either path works; Firebase
just removes the hand-built OAuth client.
