import type { Exhibition, ExhibitionStatus } from '../types/exhibitions';

/**
 * Calculate exhibition status display
 * Draft = unpublished, Active = published
 * Then compute timeline-based status for published exhibitions
 */
export const calculateExhibitionStatus = (exhibition: Exhibition): {
  computed: ExhibitionStatus;
  stored: ExhibitionStatus;
  canOverride: boolean;
  message: string;
  isPublished: boolean;
} => {
  const now = new Date();
  const regStart = new Date(exhibition.registrationStartDate);
  const regEnd = new Date(exhibition.registrationEndDate);
  const eventStart = new Date(exhibition.onsiteStartDate);
  const eventEnd = new Date(exhibition.onsiteEndDate);

  let computed: ExhibitionStatus = exhibition.status;
  let message = '';
  let canOverride = true;
  const isPublished = exhibition.status !== 'draft';

  // If draft, keep it as draft
  if (exhibition.status === 'draft') {
    return {
      computed: 'draft',
      stored: 'draft',
      canOverride: true,
      message: 'Exhibition is in draft mode. Publish to make it visible.',
      isPublished: false,
    };
  }

  // For published exhibitions, calculate based on dates
  if (now < regStart) {
    // Before registration starts - UPCOMING
    computed = 'active';
    message = `Upcoming - Registration opens ${regStart.toLocaleDateString()}`;
  } else if (now >= regStart && now <= regEnd) {
    // During registration period
    computed = 'registration_open';
    message = `Registration open until ${regEnd.toLocaleDateString()}`;
  } else if (now > regEnd && now < eventStart) {
    // After registration closes but before event
    computed = 'active';
    message = 'Registration closed, event starts soon';
    canOverride = true;
  } else if (now >= eventStart && now <= eventEnd) {
    // During the event
    computed = 'live_event';
    message = `Event is live until ${eventEnd.toLocaleDateString()}`;
    canOverride = false;
  } else if (now > eventEnd) {
    // After event ends - auto deactivate registration
    computed = 'completed';
    message = 'Event completed - Registration closed automatically';
    canOverride = false;
  }

  return {
    computed,
    stored: exhibition.status,
    canOverride,
    message,
    isPublished,
  };
};

/**
 * Get status display info with enhanced details
 */
export const getStatusInfo = (status: ExhibitionStatus, exhibition?: Exhibition) => {
  const configs: Record<ExhibitionStatus, { color: string; text: string; icon: string; description: string }> = {
    draft: {
      color: 'default',
      text: 'Draft',
      icon: '📝',
      description: 'Not published yet',
    },
    active: {
      color: 'blue',
      text: 'Upcoming',
      icon: '🔔',
      description: 'Published - Event upcoming',
    },
    registration_open: {
      color: 'green',
      text: 'Registration Open',
      icon: '🎫',
      description: 'Accepting registrations',
    },
    live_event: {
      color: 'orange',
      text: 'Live Event',
      icon: '🎪',
      description: 'Event is currently happening',
    },
    completed: {
      color: 'purple',
      text: 'Completed',
      icon: '🏁',
      description: 'Event ended - No registrations allowed',
    },
  };

  const config = configs[status] || configs.draft;

  if (exhibition) {
    const statusCalc = calculateExhibitionStatus(exhibition);
    return {
      ...config,
      computed: statusCalc.computed,
      message: statusCalc.message,
      canOverride: statusCalc.canOverride,
      isPublished: statusCalc.isPublished,
    };
  }

  return config;
};

/**
 * Get days remaining/elapsed text
 */
/**
 * Check if an exhibition can accept new registrations
 */
export const canAcceptRegistrations = (exhibition: Exhibition): {
  allowed: boolean;
  reason: string;
} => {
  const now = new Date();
  const regStart = new Date(exhibition.registrationStartDate);
  const regEnd = new Date(exhibition.registrationEndDate);
  const eventEnd = new Date(exhibition.onsiteEndDate);

  // Draft exhibitions don't accept registrations
  if (exhibition.status === 'draft') {
    return {
      allowed: false,
      reason: 'Exhibition is not published yet',
    };
  }

  // Check if registration period has ended
  if (now > regEnd) {
    return {
      allowed: false,
      reason: 'Registration period has ended',
    };
  }

  // Check if event has been completed
  if (now > eventEnd) {
    return {
      allowed: false,
      reason: 'Event has been completed',
    };
  }

  // Check if registration hasn't started yet
  if (now < regStart) {
    return {
      allowed: false,
      reason: `Registration opens on ${regStart.toLocaleDateString()}`,
    };
  }

  return {
    allowed: true,
    reason: 'Registration is open',
  };
};

/**
 * Get days remaining/elapsed text
 */
export const getDaysText = (exhibition: Exhibition): {
  text: string;
  type: 'upcoming' | 'ongoing' | 'completed';
  days: number;
} => {
  const now = new Date();
  const eventStart = new Date(exhibition.onsiteStartDate);
  const eventEnd = new Date(exhibition.onsiteEndDate);

  const daysToStart = Math.ceil((eventStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const daysToEnd = Math.ceil((eventEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (now < eventStart) {
    // Upcoming
    if (daysToStart === 0) return { text: 'Starts today!', type: 'upcoming', days: 0 };
    if (daysToStart === 1) return { text: 'Starts tomorrow', type: 'upcoming', days: 1 };
    return { text: `Starts in ${daysToStart} days`, type: 'upcoming', days: daysToStart };
  } else if (now >= eventStart && now <= eventEnd) {
    // Ongoing
    if (daysToEnd === 0) return { text: 'Ends today!', type: 'ongoing', days: 0 };
    if (daysToEnd === 1) return { text: 'Ends tomorrow', type: 'ongoing', days: 1 };
    return { text: `${daysToEnd} days remaining`, type: 'ongoing', days: daysToEnd };
  } else {
    // Completed
    const daysAgo = Math.abs(daysToEnd);
    if (daysAgo === 0) return { text: 'Ended today', type: 'completed', days: 0 };
    if (daysAgo === 1) return { text: 'Ended yesterday', type: 'completed', days: 1 };
    return { text: `Ended ${daysAgo} days ago`, type: 'completed', days: daysAgo };
  }
};

