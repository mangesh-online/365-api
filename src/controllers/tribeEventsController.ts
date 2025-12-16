import { Request, Response } from 'express';
import { AppDataSource } from '../database.js';
import { TribeEvent } from '../entities/TribeEvent.js';
import { Tribe } from '../entities/Tribe.js';
import { TribeMember } from '../entities/TribeMember.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { In } from 'typeorm';

/**
 * Create a new tribe event (Admin only)
 */
export const createTribeEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { tribeId } = req.params;
    const {
      title,
      description,
      eventDate,
      eventTime,
      durationMinutes,
      eventType,
      location,
      meetingLink,
      maxAttendees = 0,
      tags = [],
      coverImage,
    } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Validate required fields
    if (!title || !description || !eventDate) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, eventDate',
      });
      return;
    }

    // Check if user is admin of the tribe
    const tribeMemberRepository = AppDataSource.getRepository(TribeMember);
    const member = await tribeMemberRepository.findOne({
      where: { tribeId, userId },
    });

    if (!member || !member.isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Only tribe admins can create events',
      });
      return;
    }

    // Create event
    const eventRepository = AppDataSource.getRepository(TribeEvent);
    const event = eventRepository.create({
      tribeId,
      creatorId: userId,
      title,
      description,
      eventDate: new Date(eventDate),
      eventTime,
      durationMinutes,
      eventType: eventType || 'virtual',
      location,
      meetingLink,
      maxAttendees,
      tags,
      coverImage,
      attendees: [],
      attendeeCount: 0,
      status: 'upcoming',
    });

    const savedEvent = await eventRepository.save(event);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: savedEvent,
    });
  } catch (error) {
    console.error('Error creating tribe event:', error);
    res.status(500).json({ success: false, message: 'Failed to create event' });
  }
};

/**
 * Get all events for a tribe
 */
export const getTribeEvents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { tribeId } = req.params;
    const { status = 'upcoming', limit = 50 } = req.query;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Check if user is a member
    const tribeMemberRepository = AppDataSource.getRepository(TribeMember);
    const member = await tribeMemberRepository.findOne({
      where: { tribeId, userId },
    });

    if (!member) {
      res.status(403).json({
        success: false,
        message: 'Only tribe members can view events',
      });
      return;
    }

    // Fetch events
    const eventRepository = AppDataSource.getRepository(TribeEvent);
    let query = eventRepository
      .createQueryBuilder('event')
      .where('event.tribeId = :tribeId', { tribeId })
      .leftJoinAndSelect('event.creator', 'creator');

    if (status !== 'all') {
      query = query.andWhere('event.status = :status', { status });
    }

    query = query
      .orderBy('event.eventDate', 'ASC')
      .take(parseInt(limit as string));

    const events = await query.getMany();

    res.json({
      success: true,
      data: events,
      totalCount: events.length,
    });
  } catch (error) {
    console.error('Error fetching tribe events:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
};

/**
 * Get single event details
 */
export const getEventDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { tribeId, eventId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Check if user is a member
    const tribeMemberRepository = AppDataSource.getRepository(TribeMember);
    const member = await tribeMemberRepository.findOne({
      where: { tribeId, userId },
    });

    if (!member) {
      res.status(403).json({
        success: false,
        message: 'Only tribe members can view events',
      });
      return;
    }

    const eventRepository = AppDataSource.getRepository(TribeEvent);
    const event = await eventRepository.findOne({
      where: { id: eventId, tribeId },
      relations: ['creator'],
    });

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch event details' });
  }
};

/**
 * Update an event (Admin only)
 */
export const updateTribeEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { tribeId, eventId } = req.params;
    const updates = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Check if user is admin
    const tribeMemberRepository = AppDataSource.getRepository(TribeMember);
    const member = await tribeMemberRepository.findOne({
      where: { tribeId, userId },
    });

    if (!member || !member.isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Only tribe admins can update events',
      });
      return;
    }

    const eventRepository = AppDataSource.getRepository(TribeEvent);
    const event = await eventRepository.findOne({
      where: { id: eventId, tribeId },
    });

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    // Update allowed fields
    const allowedFields = [
      'title',
      'description',
      'eventDate',
      'eventTime',
      'durationMinutes',
      'eventType',
      'location',
      'meetingLink',
      'maxAttendees',
      'tags',
      'coverImage',
      'status',
    ];

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        (event as any)[key] = updates[key];
      }
    });

    const updatedEvent = await eventRepository.save(event);

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent,
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ success: false, message: 'Failed to update event' });
  }
};

/**
 * Delete an event (Admin only)
 */
export const deleteTribeEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { tribeId, eventId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Check if user is admin
    const tribeMemberRepository = AppDataSource.getRepository(TribeMember);
    const member = await tribeMemberRepository.findOne({
      where: { tribeId, userId },
    });

    if (!member || !member.isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Only tribe admins can delete events',
      });
      return;
    }

    const eventRepository = AppDataSource.getRepository(TribeEvent);
    const event = await eventRepository.findOne({
      where: { id: eventId, tribeId },
    });

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    await eventRepository.remove(event);

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
};

/**
 * RSVP to an event
 */
export const rsvpToEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { tribeId, eventId } = req.params;
    const { status } = req.body; // 'going', 'maybe', 'not_going'

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Check if user is a member
    const tribeMemberRepository = AppDataSource.getRepository(TribeMember);
    const member = await tribeMemberRepository.findOne({
      where: { tribeId, userId },
      relations: ['user'],
    });

    if (!member) {
      res.status(403).json({
        success: false,
        message: 'Only tribe members can RSVP to events',
      });
      return;
    }

    const eventRepository = AppDataSource.getRepository(TribeEvent);
    const event = await eventRepository.findOne({
      where: { id: eventId, tribeId },
    });

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    // Check max attendees
    if (
      event.maxAttendees > 0 &&
      status === 'going' &&
      event.attendeeCount >= event.maxAttendees
    ) {
      res.status(400).json({
        success: false,
        message: 'Event is at maximum capacity',
      });
      return;
    }

    // Update or add attendee
    const attendees = event.attendees || [];
    const existingAttendeeIndex = attendees.findIndex((a) => a.userId === userId);

    if (existingAttendeeIndex >= 0) {
      // Update existing RSVP
      if (status === 'not_going') {
        // Remove attendee
        attendees.splice(existingAttendeeIndex, 1);
        event.attendeeCount = Math.max(0, event.attendeeCount - 1);
      } else {
        // Update status
        attendees[existingAttendeeIndex].rsvpStatus = status;
        attendees[existingAttendeeIndex].rsvpAt = new Date();
      }
    } else {
      // Add new attendee
      if (status !== 'not_going') {
        attendees.push({
          userId,
          userName: member.user?.name || 'Unknown',
          userAvatar: member.user?.avatar,
          rsvpStatus: status,
          rsvpAt: new Date(),
        });
        if (status === 'going') {
          event.attendeeCount += 1;
        }
      }
    }

    event.attendees = attendees;
    const updatedEvent = await eventRepository.save(event);

    res.json({
      success: true,
      message: 'RSVP updated successfully',
      data: updatedEvent,
    });
  } catch (error) {
    console.error('Error updating RSVP:', error);
    res.status(500).json({ success: false, message: 'Failed to update RSVP' });
  }
};
