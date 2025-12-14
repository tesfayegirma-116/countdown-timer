// Tauri desktop features integration
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

export interface NotificationPayload {
    title: string
    body: string
    icon?: string
    sound?: string
}

// Window Controls
export async function minimizeWindow(): Promise<void> {
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
        return await invoke('minimize_window')
    }
}

export async function maximizeWindow(): Promise<void> {
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
        return await invoke('maximize_window')
    }
}

export async function closeWindow(): Promise<void> {
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
        return await invoke('close_window')
    }
}

export async function hideWindow(): Promise<void> {
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
        return await invoke('hide_window')
    }
}

export async function showWindow(): Promise<void> {
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
        return await invoke('show_window')
    }
}

export async function centerWindow(): Promise<void> {
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
        return await invoke('center_window')
    }
}

export async function toggleAlwaysOnTop(): Promise<boolean> {
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
        return await invoke('toggle_always_on_top')
    }
    return false
}

// Notifications
export async function sendNotification(payload: NotificationPayload): Promise<void> {
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
        return await invoke('send_notification', { payload })
    }
}

export async function requestNotificationPermission(): Promise<boolean> {
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
        return await invoke('request_notification_permission')
    }
    return false
}

export async function checkNotificationPermission(): Promise<boolean> {
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
        return await invoke('check_notification_permission')
    }
    return false
}

// System Tray
export async function updateTrayTooltip(tooltip: string): Promise<void> {
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
        return await invoke('update_tray_tooltip', { tooltip })
    }
}

// Timer-specific notifications
export async function sendTimerNotification(
    type: 'started' | 'completed' | 'warning' | 'overtime' | 'paused' | 'reset',
    sessionName: string,
    duration?: string
): Promise<void> {
    const notifications = {
        started: {
            title: 'Timer Started',
            body: `Focus session '${sessionName}' has begun`,
            sound: 'default'
        },
        completed: {
            title: 'Timer Completed! 🎉',
            body: `Focus session '${sessionName}' completed successfully!`,
            sound: 'default'
        },
        warning: {
            title: 'Final Minutes ⚠️',
            body: `Focus session '${sessionName}' - 5 minutes remaining`,
            sound: 'default'
        },
        overtime: {
            title: 'Overtime 🚨',
            body: `Focus session '${sessionName}' has entered overtime`,
            sound: 'default'
        },
        paused: {
            title: 'Timer Paused',
            body: `Focus session '${sessionName}' paused`
        },
        reset: {
            title: 'Timer Reset',
            body: `Focus session '${sessionName}' has been reset`
        }
    }

    const notification = notifications[type]
    if (notification) {
        await sendNotification({
            title: notification.title,
            body: notification.body,
            icon: 'icons/icon.png',
            sound: notification.sound
        })
    }
}

// System Tray Event Listeners
export function setupTrayEventListeners(
    onStartTimer: () => void,
    onPauseTimer: () => void,
    onResetTimer: () => void,
    onToggleFocus: () => void
) {
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
        listen('tray-start-timer', () => onStartTimer())
        listen('tray-pause-timer', () => onPauseTimer())
        listen('tray-reset-timer', () => onResetTimer())
        listen('tray-toggle-focus', () => onToggleFocus())
    }
}

// Menu Event Listeners
export function setupMenuEventListeners(
    onStartPause: () => void,
    onReset: () => void,
    onSetTime: (minutes: number) => void,
    onCustomTime: () => void,
    onFullscreen: () => void,
    onShowHistory: () => void,
    onNewSession: () => void
) {
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
        listen('menu-start-pause', () => onStartPause())
        listen('menu-reset', () => onReset())
        listen('menu-set-time', (event) => onSetTime(event.payload as number))
        listen('menu-custom-time', () => onCustomTime())
        listen('menu-fullscreen', () => onFullscreen())
        listen('menu-show-history', () => onShowHistory())
        listen('menu-new-session', () => onNewSession())

        // Additional menu events
        listen('menu-save-session', () => {
            // Trigger save session
            window.dispatchEvent(new CustomEvent('menu-save-session'))
        })

        listen('menu-export-history', () => {
            // Trigger export history
            window.dispatchEvent(new CustomEvent('menu-export-history'))
        })

        listen('menu-import-history', () => {
            // Trigger import history
            window.dispatchEvent(new CustomEvent('menu-import-history'))
        })

        listen('menu-keyboard-shortcuts', () => {
            // Show keyboard shortcuts dialog
            window.dispatchEvent(new CustomEvent('menu-keyboard-shortcuts'))
        })

        listen('menu-preferences', () => {
            // Show preferences dialog
            window.dispatchEvent(new CustomEvent('menu-preferences'))
        })
    }
}

// Window State Management
export async function setupWindowStateManagement() {
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
        // Request notification permission on startup
        try {
            await requestNotificationPermission()
        } catch (error) {
            console.warn('Failed to request notification permission:', error)
        }

        // Handle window close event to minimize to tray instead
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        const appWindow = getCurrentWindow()

        appWindow.onCloseRequested(async (event) => {
            event.preventDefault()
            await hideWindow()
        })
    }
}

// Global Shortcuts
export async function registerGlobalShortcuts() {
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
        try {
            const { register } = await import('@tauri-apps/plugin-global-shortcut')

            // Ctrl+Shift+T to show/hide window
            await register('CmdOrCtrl+Shift+T', async () => {
                await showWindow()
            })

            // Ctrl+Shift+S to start/pause timer
            await register('CmdOrCtrl+Shift+S', () => {
                window.dispatchEvent(new CustomEvent('global-shortcut-toggle-timer'))
            })

            // Ctrl+Shift+R to reset timer
            await register('CmdOrCtrl+Shift+R', () => {
                window.dispatchEvent(new CustomEvent('global-shortcut-reset-timer'))
            })

        } catch (error) {
            console.warn('Failed to register global shortcuts:', error)
        }
    }
}

// Utility function to check if running in Tauri
export function isTauri(): boolean {
    return typeof window !== 'undefined' && '__TAURI__' in window
}
