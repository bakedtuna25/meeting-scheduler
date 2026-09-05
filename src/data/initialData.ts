import { Meeting, Note } from '../types';

export const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 'meet-1',
    title: 'Client kickoff',
    description: 'Project scope and timeline',
    date: '2026-09-10',
    startTime: '14:00',
    endTime: '15:00',
    durationMinutes: 60,
    location: 'Room A',
    attendees: [
      { email: 'alex.client@acme.com', name: 'Alex Rivera' }
    ],
    status: 'scheduled',
    reminders: {
      popupMinutes: [10, 30],
      emailMinutes: [60],
      soundAlert: true,
    },
    syncedWithGoogle: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'meet-2',
    title: 'Weekly team sync',
    description: 'Sprint review and blockers',
    date: '2026-09-08',
    startTime: '09:30',
    endTime: '10:00',
    durationMinutes: 30,
    location: 'Zoom',
    meetLink: 'https://zoom.us/j/sample123',
    attendees: [
      { email: 'sarah@team.internal', name: 'Sarah Tech' },
      { email: 'kevin@team.internal', name: 'Kevin Lead' },
      { email: 'maya@team.internal', name: 'Maya Design' },
    ],
    status: 'scheduled',
    reminders: {
      popupMinutes: [10, 15],
      emailMinutes: [30],
      soundAlert: true,
    },
    syncedWithGoogle: false,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_NOTES: Note[] = [
  {
    id: 'note-1',
    title: 'Agenda ideas',
    content: 'Q3 roadmap\n- Onboarding flow\n- Pricing tiers\n- Mobile app',
    color: 'yellow',
    isPinned: true,
    purpose: 'agenda',
    meetingId: 'meet-2',
    meetingTitle: 'Weekly team sync',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'note-2',
    title: 'Follow up',
    content: 'Send proposal to Acme by Tuesday.',
    color: 'blue',
    isPinned: false,
    purpose: 'follow_up',
    meetingId: 'meet-1',
    meetingTitle: 'Client kickoff',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'note-3',
    title: 'Parking lot',
    content: 'Design system tokens\nDark mode polish',
    color: 'green',
    isPinned: false,
    purpose: 'parking_lot',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
