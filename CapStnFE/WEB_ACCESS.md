# Web Development Access Guide

## Quick Start

To access the app in a web browser via localhost, use one of these commands:

```bash
npm run web
```

or

```bash
npm run dev:web
```

Both commands execute `expo start --web` which starts the Metro bundler with web support.

## Important Notes

### ❌ Don't Use This for Web:
```bash
npm start  # This only starts Metro for mobile/Expo Go, NOT web
```

### ✅ Use This for Web:
```bash
npm run web        # Starts Expo with web support
npm run dev:web    # Same as above (alternative command)
```

## Accessing the App

After running `npm run web` or `npm run dev:web`:

1. Wait for the Metro bundler to start
2. The terminal will display a URL, typically: `http://localhost:8081`
3. Open this URL in your web browser
4. If port 8081 is occupied, Expo will use the next available port (check the terminal output)

## Alternative Method

If you've already run `npm start`:
- Press `w` in the terminal to launch the web version
- This will start the web server on top of the existing Metro bundler

## Troubleshooting

### Port Already in Use
If you see a port conflict error:
- Close other applications using the port
- Or let Expo automatically use the next available port

### Localhost Not Accessible
1. Check Windows hosts file: `C:\Windows\System32\drivers\etc\hosts`
   - Should contain: `127.0.0.1 localhost`
2. Check firewall settings - ensure port 8081 (or the port shown) is not blocked
3. Try accessing via `127.0.0.1:8081` instead of `localhost:8081`

### Windows 11 Localhost Issues
If you're on Windows 11 and localhost stopped working after an update:
- Install the latest Windows updates (KB5066835 fix)
- Or use `127.0.0.1` instead of `localhost`

## Development Scripts

- `npm start` - Start Metro bundler (mobile/Expo Go only)
- `npm run web` - Start with web support (for browser access)
- `npm run dev:web` - Same as `npm run web`
- `npm run android` - Start for Android
- `npm run ios` - Start for iOS

