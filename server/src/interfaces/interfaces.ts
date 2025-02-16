import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  userId: string;
}

export interface CreateTripInput {
  name: string;
  description?: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  budget?: number | null;
  createdBy: string;
}

export interface UpdateTripInput
  extends Partial<Omit<CreateTripInput, 'createdBy'>> {}
