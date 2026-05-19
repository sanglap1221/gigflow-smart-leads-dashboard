import { Request, Response, NextFunction } from 'express';
import { Lead } from '../models/Lead.js';
import { AppError } from '../utils/appError.js';

// Helper to escape values for CSV to prevent CSV injection and formatting breaks
const escapeCSVValue = (val: any): string => {
  if (val === null || val === undefined) return '';
  let str = String(val);
  str = str.replace(/"/g, '""');
  if (
    str.includes(',') ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r')
  ) {
    return `"${str}"`;
  }
  return str;
};

// @desc    Get all leads (with filtering, search, pagination, RBAC)
// @route   GET /api/leads
// @access  Private
export const getLeads = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, source, assignedTo, search, page = '1', limit = '10' } = req.query;

    const query: any = {};

    // RBAC: Standard Users can only view leads assigned to themselves
    if (req.user && req.user.role === 'USER') {
      query.assignedTo = req.user._id;
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (status) {
      query.status = status;
    }
    if (source) {
      query.source = source;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skipNum = (pageNum - 1) * limitNum;

    const total = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: leads.length,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
      data: leads,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single lead by ID
// @route   GET /api/leads/:id
// @access  Private
export const getLead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lead = await Lead.findById(req.params.id).populate(
      'assignedTo',
      'name email role'
    );

    if (!lead) {
      return next(new AppError('Lead not found', 404));
    }

    // RBAC: Standard user cannot view other users' assigned leads
    if (
      req.user &&
      req.user.role === 'USER' &&
      lead.assignedTo?.toString() !== req.user._id.toString()
    ) {
      return next(new AppError('Not authorized to view this lead', 403));
    }

    res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new lead
// @route   POST /api/leads
// @access  Private
export const createLead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, phone, status, source, assignedTo, notes } = req.body;

    // RBAC: Standard user can only create/assign a lead to themselves
    let finalAssignedTo = assignedTo;
    if (req.user && req.user.role === 'USER') {
      finalAssignedTo = req.user._id;
    }

    const lead = await Lead.create({
      name,
      email,
      phone,
      status,
      source,
      assignedTo: finalAssignedTo,
      notes,
    });

    const populatedLead = await Lead.findById(lead._id).populate(
      'assignedTo',
      'name email role'
    );

    res.status(201).json({
      success: true,
      data: populatedLead,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a lead
// @route   PUT /api/leads/:id
// @access  Private
export const updateLead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let lead = await Lead.findById(req.params.id);

    if (!lead) {
      return next(new AppError('Lead not found', 404));
    }

    // RBAC: Standard user can only update their own assigned leads
    if (
      req.user &&
      req.user.role === 'USER' &&
      lead.assignedTo?.toString() !== req.user._id.toString()
    ) {
      return next(new AppError('Not authorized to update this lead', 403));
    }

    const { name, email, phone, status, source, assignedTo, notes } = req.body;

    // RBAC: Standard user cannot reassign lead assignment
    let finalAssignedTo = assignedTo;
    if (req.user && req.user.role === 'USER') {
      finalAssignedTo = lead.assignedTo;
    }

    lead = await Lead.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        phone,
        status,
        source,
        assignedTo: finalAssignedTo,
        notes,
      },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email role');

    res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a lead
// @route   DELETE /api/leads/:id
// @access  Private (ADMIN, MANAGER only)
export const deleteLead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return next(new AppError('Lead not found', 404));
    }

    await Lead.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export leads to CSV
// @route   GET /api/leads/export
// @access  Private
export const exportLeadsCSV = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, source, assignedTo, search } = req.query;

    const query: any = {};

    // RBAC filtering
    if (req.user && req.user.role === 'USER') {
      query.assignedTo = req.user._id;
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (status) {
      query.status = status;
    }
    if (source) {
      query.source = source;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    const headers = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Status',
      'Source',
      'Assigned To (Name)',
      'Assigned To (Email)',
      'Notes',
      'Created At',
    ];

    const rows = leads.map((lead) => {
      const assignedName = lead.assignedTo
        ? (lead.assignedTo as any).name
        : 'Unassigned';
      const assignedEmail = lead.assignedTo
        ? (lead.assignedTo as any).email
        : 'N/A';
      return [
        lead._id.toString(),
        lead.name,
        lead.email,
        lead.phone || '',
        lead.status,
        lead.source,
        assignedName,
        assignedEmail,
        lead.notes || '',
        lead.createdAt.toISOString(),
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map(escapeCSVValue).join(',')),
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=leads_export_${Date.now()}.csv`
    );
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
