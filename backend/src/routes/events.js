const express = require('express');
const EventsEngine = require('../engines/eventsEngine');
const IntelligenceEngine = require('../engines/intelligenceEngine');

const router = express.Router();

// GET /api/events/:candidateId - Get events for a candidate
router.get('/:candidateId', async (req, res) => {
    try {
        const events = await EventsEngine.getCandidateEvents(
            req.params.candidateId,
            { validated_only: req.query.validated_only === 'true' }
        );
        res.json({ events, total: events.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/events - Create a new event
router.post('/', async (req, res) => {
    try {
        const { candidate_id, event_type, title, description, impact_score } = req.body;
        if (!candidate_id || !event_type || !title) {
            return res.status(400).json({ error: 'candidate_id, event_type, and title are required' });
        }
        const event = await EventsEngine.createEvent({ candidate_id, event_type, title, description, impact_score });

        // Broadcast event creation
        if (req.app.get('wssBroadcast')) {
            req.app.get('wssBroadcast')({ type: 'event_created', data: event });
        }

        res.status(201).json(event);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/events/:id - Update an event
router.put('/:id', async (req, res) => {
    try {
        const event = await EventsEngine.updateEvent(req.params.id, req.body);
        res.json(event);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST /api/events/:id/validate - Validate (approve) an event
router.post('/:id/validate', async (req, res) => {
    try {
        const event = await EventsEngine.validateEvent(req.params.id);

        if (req.app.get('wssBroadcast')) {
            req.app.get('wssBroadcast')({ type: 'event_validated', data: event });
        }

        res.json({ message: 'Event validated and scores recalculated', event });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST /api/events/:id/reject - Reject an event
router.post('/:id/reject', async (req, res) => {
    try {
        const event = await EventsEngine.rejectEvent(req.params.id);
        res.json({ message: 'Event rejected', event });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/events/:id - Delete an event
router.delete('/:id', async (req, res) => {
    try {
        const event = await EventsEngine.deleteEvent(req.params.id);
        res.json({ message: 'Event deleted and scores recalculated', event });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /api/events/pending/all - Get all pending events
router.get('/pending/all', async (req, res) => {
    try {
        const events = await EventsEngine.getPendingEvents();
        res.json({ events, total: events.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
