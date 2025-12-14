# Zetseat Church Timer

A beautiful, feature-rich countdown timer application built with Next.js and Tauri for church services, meetings, and focus sessions.

![Zetseat Church Timer](public/placeholder-logo.png)

## Features

### ⏱️ Timer Functionality

- **Customizable Timer**: Set any duration from minutes to hours
- **Overtime Mode**: Continues counting when time expires
- **Warning Alerts**: Visual and audio alerts in final minutes
- **Session Tracking**: Automatically saves completed sessions

### 🖥️ Desktop Experience

- **Native Desktop App**: Built with Tauri for optimal performance
- **System Tray Integration**: Minimize to tray with quick controls
- **Global Keyboard Shortcuts**: Control timer from anywhere
- **Desktop Notifications**: Get notified when timer completes
- **Always on Top**: Keep timer visible while working
- **Fullscreen Mode**: Immersive focus experience

### 📊 Session Management

- **Session History**: View all past timer sessions
- **Smart Filtering**: Filter by date, completion status
- **Export/Import**: Backup and restore session data
- **Statistics**: Track productivity and completion rates

### 🎨 User Interface

- **Modern Design**: Clean, minimalist interface
- **Dark/Light Themes**: Adapts to system preferences
- **Responsive Layout**: Works on all screen sizes
- **Accessibility**: Full keyboard navigation support

## Installation

### Desktop Application (Recommended)

Download the latest release for your platform:

- **Windows**: `.msi` or `.exe` installer
- **macOS**: `.dmg` disk image
- **Linux**: `.deb`, `.rpm`, or `.AppImage`

[📥 Download Latest Release](https://github.com/zetseat-church/timer/releases)

### Web Version

Visit [timer.zetseat.church](https://timer.zetseat.church) to use the web version.

## Development

### Prerequisites

- **Node.js** 18+ and npm/pnpm
- **Rust** 1.70+ (for desktop app)
- **System Dependencies** (Linux only):

  ```bash
  sudo apt-get install libgtk-3-dev libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev patchelf
  ```

### Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/tesfayegirma-116/countdown-timer-with-react.git
   cd countdown-timer-with-react
   ```

2. **Install dependencies**:

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Run development server**:

   ```bash
   # Web version
   npm run dev

   # Desktop app
   npm run tauri:dev
   ```

### Building

#### Quick Build

```bash
# Build for current platform
npm run build:all

# Build with clean artifacts
npm run build:clean

# Debug build
npm run build:debug
```

#### Platform-Specific Builds

```bash
# Linux
npm run release:linux

# Windows
npm run release:windows

# macOS
npm run release:macos
```

#### Advanced Build Options

```bash
# Custom target
./scripts/build.sh --target x86_64-unknown-linux-gnu

# Clean build for Windows
./scripts/build.sh --clean --target x86_64-pc-windows-msvc

# Debug build
./scripts/build.sh --debug
```

## Usage

### Keyboard Shortcuts

#### Global Shortcuts (Desktop)

- `Ctrl+Shift+T` - Show/Hide timer window
- `Ctrl+Shift+S` - Start/Pause timer
- `Ctrl+Shift+R` - Reset timer

#### Application Shortcuts

- `Space` - Start/Pause timer
- `R` - Reset timer
- `F` - Toggle fullscreen
- `Esc` - Exit fullscreen/close dialogs
- `Ctrl+H` - Show session history
- `Ctrl+T` - Set custom time
- `Ctrl+1-5` - Quick time presets (5, 15, 25, 45, 60 minutes)

### System Tray (Desktop)

The desktop app minimizes to the system tray with these features:

- **Left Click**: Show/Hide main window
- **Right Click**: Context menu with timer controls
- **Tooltip**: Shows current timer status

### Menu Bar (Desktop)

Full native menu bar with:

- **File**: Session management, export/import
- **Timer**: Start/pause, reset, time presets
- **View**: Fullscreen, always on top, history
- **Window**: Minimize, zoom, center
- **Help**: Shortcuts, user guide, updates

## Configuration

### Settings

Access settings through:

- Desktop: Menu → Preferences
- Web: Settings panel in app

Available options:

- **Notifications**: Enable/disable desktop notifications
- **Auto-start**: Start timer automatically on app launch
- **Session Names**: Default naming patterns
- **Time Formats**: 12/24 hour display
- **Themes**: Light/dark/system preference

### Data Storage

- **Desktop**: SQLite database in app data directory
- **Web**: Browser localStorage
- **Export**: JSON format for backup/migration

## API Reference

### Tauri Commands (Desktop)

```typescript
// Timer control
await invoke('start_timer')
await invoke('pause_timer')
await invoke('reset_timer')

// Window management
await invoke('minimize_window')
await invoke('maximize_window')
await invoke('toggle_always_on_top')

// Notifications
await invoke('send_notification', { 
  title: 'Timer Complete',
  body: 'Your focus session is done!'
})

// Session management
await invoke('save_timer_session', { session })
await invoke('get_timer_sessions', { limit: 50 })
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Automatic formatting
- **Rust**: Standard rustfmt formatting

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [docs.zetseat.church/timer](https://docs.zetseat.church/timer)
- **Issues**: [GitHub Issues](https://github.com/tesfayegirma-116/countdown-timer-with-react/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tesfayegirma-116/countdown-timer-with-react/discussions)
- **Email**: <support@zetseat.church>

## Acknowledgments

- Built with [Tauri](https://tauri.app/) for cross-platform desktop apps
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Developed for [Zetseat Church](https://zetseat.church)

---

Made with ❤️ by the Zetseat Church team
