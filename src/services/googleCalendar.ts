import { Meeting, MeetingAttendee } from '../types';
import appletConfig from '../../firebase-applet-config.json';

declare global {
  interface Window {
    google?: any;
  }
}

export const DEFAULT_AI_STUDIO_CLIENT_ID =
  '92433229587-llbavsdden1foj7ottli4k9on2fnakj7.apps.googleusercontent.com';

export const USER_CUSTOM_CLIENT_ID =
  '964469019418-auop3kmkc9nuhj89er05op4tci6bbkc4.apps.googleusercontent.com';

const STORAGE_KEY_CUSTOM_CLIENT_ID = 'teamsync_active_client_id';

export function getActiveClientId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_CLIENT_ID);
    if (saved) return saved;
  } catch (e) {}
  return appletConfig?.oAuthClientId || DEFAULT_AI_STUDIO_CLIENT_ID;
}

export function setActiveClientId(clientId: string) {
  localStorage.setItem(STORAGE_KEY_CUSTOM_CLIENT_ID, clientId);
}

export const OAUTH_CLIENT_ID = getActiveClientId();

export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

const STORAGE_KEY_TOKEN = 'teamsync_gcal_token';
const STORAGE_KEY_EXPIRES = 'teamsync_gcal_expires';

export interface StoredToken {
  accessToken: string;
  expiresAt: number;
}

export function getStoredToken(): StoredToken | null {
  try {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const expires = localStorage.getItem(STORAGE_KEY_EXPIRES);
    if (token && expires) {
      const expiresAt = parseInt(expires, 10);
      if (Date.now() < expiresAt - 60000) { // 1 min buffer
        return { accessToken: token, expiresAt };
      }
    }
  } catch (e) {
    console.error('Error reading stored token', e);
  }
  return null;
}

export function saveToken(token: string, expiresInSeconds: number) {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  localStorage.setItem(STORAGE_KEY_TOKEN, token);
  localStorage.setItem(STORAGE_KEY_EXPIRES, expiresAt.toString());
}

export function clearStoredToken() {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_EXPIRES);
}

export function requestGoogleCalendarToken(
  clientId?: string,
  onSuccess: (token: string, expiresIn: number) => void = () => {},
  onError: (error: any) => void = () => {}
) {
  if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
    onError(new Error('Google Identity Services library is not loaded yet. Please try again.'));
    return;
  }

  // Ensure clientId is strictly a string and not an event object
  let resolvedClientId = '';
  if (typeof clientId === 'string' && clientId.trim().length > 0) {
    resolvedClientId = clientId.trim();
  } else {
    resolvedClientId = getActiveClientId();
  }

  if (!resolvedClientId || typeof resolvedClientId !== 'string') {
    resolvedClientId = DEFAULT_AI_STUDIO_CLIENT_ID;
  }

  try {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: resolvedClientId,
      scope: CALENDAR_SCOPE,
      callback: (response: any) => {
        if (response.error) {
          console.error('Google OAuth error:', response);
          onError(new Error(response.error_description || response.error));
          return;
        }
        if (response.access_token) {
          const expiresIn = response.expires_in ? parseInt(response.expires_in, 10) : 3600;
          saveToken(response.access_token, expiresIn);
          onSuccess(response.access_token, expiresIn);
        } else {
          onError(new Error('No access token received from Google.'));
        }
      },
    });

    client.requestAccessToken();
  } catch (err) {
    onError(err);
  }
}

/**
 * Fetch upcoming events from Google Calendar
 */
export async function fetchGoogleCalendarEvents(token: string): Promise<Meeting[]> {
  const timeMin = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // From yesterday
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    timeMin
  )}&singleEvents=true&orderBy=startTime&maxResults=50`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearStoredToken();
      throw new Error('UNAUTHORIZED');
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to fetch events (${res.status})`);
  }

  const data = await res.json();
  const items = data.items || [];

  return items.map((item: any) => {
    const startIso = item.start?.dateTime || item.start?.date;
    const endIso = item.end?.dateTime || item.end?.date;
    const startDate = startIso ? new Date(startIso) : new Date();
    const endDate = endIso ? new Date(endIso) : new Date(startDate.getTime() + 30 * 60000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`;
    const startTimeStr = `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`;
    const endTimeStr = `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;

    const durationMinutes = Math.max(
      15,
      Math.round((endDate.getTime() - startDate.getTime()) / 60000)
    );

    const attendees: MeetingAttendee[] = (item.attendees || []).map((att: any) => ({
      email: att.email,
      name: att.displayName || att.email.split('@')[0],
      responseStatus: att.responseStatus,
    }));

    const meetLink = item.hangoutLink || (item.location?.includes('http') ? item.location : undefined);

    return {
      id: `gcal-${item.id}`,
      googleEventId: item.id,
      title: item.summary || 'Untitled Meeting',
      description: item.description || '',
      date: dateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
      durationMinutes,
      location: item.location || (meetLink ? 'Google Meet' : 'Online'),
      meetLink,
      calendarHtmlLink: item.htmlLink,
      attendees,
      status: 'scheduled',
      reminders: {
        popupMinutes: [10],
        emailMinutes: [30],
        soundAlert: true,
      },
      syncedWithGoogle: true,
      createdAt: item.created || new Date().toISOString(),
    } as Meeting;
  });
}

/**
 * Create a new event in Google Calendar
 */
export async function createGoogleCalendarEvent(
  token: string,
  meeting: Omit<Meeting, 'id' | 'createdAt'>
): Promise<{ eventId: string; htmlLink?: string; hangoutLink?: string }> {
  const startDateTime = `${meeting.date}T${meeting.startTime}:00`;
  const endDateTime = `${meeting.date}T${meeting.endTime}:00`;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const reminderOverrides: Array<{ method: string; minutes: number }> = [];
  (meeting.reminders.popupMinutes || [10]).forEach((mins) => {
    reminderOverrides.push({ method: 'popup', minutes: mins });
  });
  (meeting.reminders.emailMinutes || []).forEach((mins) => {
    reminderOverrides.push({ method: 'email', minutes: mins });
  });

  const eventPayload: any = {
    summary: meeting.title,
    description: meeting.description,
    location: meeting.location,
    start: {
      dateTime: new Date(startDateTime).toISOString(),
      timeZone,
    },
    end: {
      dateTime: new Date(endDateTime).toISOString(),
      timeZone,
    },
    attendees: meeting.attendees.map((att) => ({ email: att.email })),
    reminders: {
      useDefault: false,
      overrides: reminderOverrides.length > 0 ? reminderOverrides : [{ method: 'popup', minutes: 10 }],
    },
  };

  // If user selected Google Meet
  if (meeting.location.toLowerCase().includes('meet') || meeting.location.toLowerCase().includes('online')) {
    eventPayload.conferenceData = {
      createRequest: {
        requestId: `teamsync-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventPayload),
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearStoredToken();
      throw new Error('UNAUTHORIZED');
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to create calendar event (${res.status})`);
  }

  const data = await res.json();
  return {
    eventId: data.id,
    htmlLink: data.htmlLink,
    hangoutLink: data.hangoutLink,
  };
}

/**
 * Delete event from Google Calendar
 */
export async function deleteGoogleCalendarEvent(token: string, eventId: string): Promise<boolean> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 404 && res.status !== 410) {
    if (res.status === 401) {
      clearStoredToken();
      throw new Error('UNAUTHORIZED');
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to delete calendar event (${res.status})`);
  }
  return true;
}
