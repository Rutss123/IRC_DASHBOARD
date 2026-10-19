/**
 * services/commands.js
 * --------------------
 * Service layer for sending ground station commands to the backend.
 * Commands are forwarded to the rover over an authenticated UDP channel.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export async function dispatchCommand(command, params = {}, subsystem = null) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command,
        params,
        subsystem,
        operator_id: 'dashboard_console'
      })
    });
    if (!res.ok) {
      throw new Error(`Command failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`[Commands] Failed to dispatch command '${command}':`, err);
    return { success: false, error: err.message };
  }
}

export async function sendEStop(action = 'engage') {
  try {
    const res = await fetch(`${BACKEND_URL}/api/command/estop?action=${encodeURIComponent(action)}`, {
      method: 'POST'
    });
    return await res.json();
  } catch (err) {
    console.error(`[Commands] Failed to trigger E-Stop (${action}):`, err);
    return { success: false, error: err.message };
  }
}

export async function sendModeChange(mode) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/command/mode?mode=${encodeURIComponent(mode)}`, {
      method: 'POST'
    });
    return await res.json();
  } catch (err) {
    console.error(`[Commands] Failed to change rover mode to '${mode}':`, err);
    return { success: false, error: err.message };
  }
}
