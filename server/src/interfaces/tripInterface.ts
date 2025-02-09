export interface CreateTripInput {
    name: string;
    description?: string;
    destination: string;
    startDate: Date;
    endDate: Date;
    budget?: number | null;
    createdBy: number;

    //Remove this field after middleware is configured
    userId?: number
}