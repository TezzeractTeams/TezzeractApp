import { Request, Response } from 'express';

interface CalBookingRequest {
  start: string; // ISO 8601 format
  attendee: {
    name: string;
    email: string;
    timeZone: string;
    phoneNumber?: string;
    language?: string;
  };
  eventTypeId?: number;
  eventTypeSlug?: string;
  username?: string;
  guests?: string[];
  metadata?: Record<string, any>;
  lengthInMinutes?: number;
}

// Book a meeting using Cal.com API
export const bookMeeting = async (req: Request, res: Response) => {
  try {
    if (!req.auth?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      start,
      attendee,
      eventTypeId,
      eventTypeSlug,
      username,
      guests,
      metadata,
    } = req.body;

    // Validate required fields
    if (!start || !attendee || !attendee.name || !attendee.email || !attendee.timeZone) {
      return res.status(400).json({
        error: 'Missing required fields: start, attendee.name, attendee.email, attendee.timeZone are required',
      });
    }

    // Validate that either eventTypeId or (eventTypeSlug and username) is provided
    if (!eventTypeId && (!eventTypeSlug || !username)) {
      return res.status(400).json({
        error: 'Either eventTypeId or both eventTypeSlug and username must be provided',
      });
    }

    // Get Cal.com API key from environment
    const calApiKey = process.env.CAL_API_KEY;
    if (!calApiKey) {
      console.error('CAL_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'Cal.com API key not configured' });
    }

    // Prepare Cal.com API request
    const calApiUrl = 'https://api.cal.com/v2/bookings';
    const calRequestBody: CalBookingRequest = {
      start,
      attendee: {
        name: attendee.name,
        email: attendee.email,
        timeZone: attendee.timeZone,
        ...(attendee.phoneNumber && { phoneNumber: attendee.phoneNumber }),
        ...(attendee.language && { language: attendee.language }),
      },
      ...(eventTypeId && { eventTypeId }),
      ...(eventTypeSlug && { eventTypeSlug }),
      ...(username && { username }),
      ...(guests && guests.length > 0 && { guests }),
      ...(metadata && { metadata }),
    };

    // Make request to Cal.com API
    const response = await fetch(calApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13',
        Authorization: `Bearer ${calApiKey}`,
      },
      body: JSON.stringify(calRequestBody),
    });

    const responseData = await response.json() as { message?: string; [key: string]: any };

    if (!response.ok) {
      console.error('Cal.com API error:', responseData);
      return res.status(response.status).json({
        error: responseData.message || 'Failed to create booking with Cal.com',
        details: responseData,
      });
    }

    // Return success response
    res.status(201).json({
      message: 'Meeting booked successfully',
      booking: responseData,
    });
  } catch (error) {
    console.error('Book meeting error:', error);
    res.status(500).json({ error: 'Failed to book meeting' });
  }
};
