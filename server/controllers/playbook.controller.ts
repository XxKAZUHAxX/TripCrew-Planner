import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import Trip from '../models/Trip.js';

// Returns instructions, the winning destination, and the checklist with the
// caller's own completion state resolved per task.
export async function getPlaybook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const trip = await Trip.findById(req.trip._id).populate('winningDestination');
        if (!trip) {
            res.status(404).json({ message: 'Trip not found' });
            return;
        }
        const userId = req.user.id;
        const checklist = trip.checklistTemplates.map((task) => ({
            id: task._id,
            label: task.label,
            createdBy: task.createdBy,
            completedByCount: task.completedBy.length,
            completedByMe: task.completedBy.some((u) => u.equals(userId)),
        }));
        res.json({
            instructions: trip.instructions,
            winningDestination: trip.winningDestination,
            checklist,
        });
    } catch (err) {
        next(err);
    }
}

// Creator or a granted playbook editor (enforced by middleware on the route).
export async function updateInstructions(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { instructions } = req.body;
        if (typeof instructions !== 'string') {
            res.status(400).json({ message: 'instructions must be a string' });
            return;
        }
        req.trip.instructions = instructions;
        await req.trip.save();
        res.json({ instructions: req.trip.instructions });
    } catch (err) {
        next(err);
    }
}

export async function addTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { label } = req.body;
        if (!label || typeof label !== 'string') {
            res.status(400).json({ message: 'label is required' });
            return;
        }
        req.trip.checklistTemplates.push({
            label,
            createdBy: new Types.ObjectId(req.user.id),
            completedBy: [],
        });
        await req.trip.save();
        const task = req.trip.checklistTemplates[req.trip.checklistTemplates.length - 1]!;
        res.status(201).json({
            task: { id: task._id, label: task.label, createdBy: task.createdBy },
        });
    } catch (err) {
        next(err);
    }
}

// Toggles ONLY the caller's completion state. The user id comes from the
// verified token (req.user.id) — never from the request body — so a member
// can never alter another member's state.
export async function toggleTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const task = req.trip.checklistTemplates.id(req.params.taskId!);
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        const userId = req.user.id;
        const idx = task.completedBy.findIndex((u) => u.equals(userId));
        if (idx >= 0) {
            task.completedBy.splice(idx, 1);
        } else {
            task.completedBy.push(new Types.ObjectId(userId));
        }
        await req.trip.save();
        res.json({
            task: {
                id: task._id,
                label: task.label,
                completedByMe: idx < 0,
                completedByCount: task.completedBy.length,
            },
        });
    } catch (err) {
        next(err);
    }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const task = req.trip.checklistTemplates.id(req.params.taskId!);
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        // Creator or the task author may remove a template.
        const isAuthor = task.createdBy.equals(req.user.id);
        const isCreator = req.trip.isCreator(req.user.id);
        if (!isAuthor && !isCreator) {
            res.status(403).json({ message: 'Only the task author or trip creator can delete it' });
            return;
        }
        task.deleteOne();
        await req.trip.save();
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}
