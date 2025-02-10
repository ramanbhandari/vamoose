import { Prisma } from "@prisma/client";
import { NotFoundError, ConflictError, BadRequestError, DatabaseError, BaseError } from "./errors";

export const handlePrismaError = (error: unknown): Error => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case "P2002":
                return new ConflictError("Unique constraint failed.");
            case "P2003":
                return new BadRequestError("Foreign key constraint failed.");
            case "P2004":
                return new BadRequestError("A constraint failed on the database.");
            case "P2007":
                return new BadRequestError("Data validation error");
            case "P2025":
                return new NotFoundError("Record not found.");
            default:
                return new DatabaseError(`Prisma error: ${error.message}`);
        }
    }

    if (error instanceof BaseError) {
        return error;
    }

    return new DatabaseError("An unexpected database error occurred.");
};