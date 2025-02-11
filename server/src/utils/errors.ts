export class BaseError extends Error {
    public statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class NotFoundError extends BaseError {
    constructor(message = "Resource not found") {
        super(message, 404);
    }
}

export class ConflictError extends BaseError {
    constructor(message = "Conflict occurred") {
        super(message, 409);
    }
}

export class BadRequestError extends BaseError {
    constructor(message = "Bad request") {
        super(message, 400);
    }
}

export class UnauthorizedError extends BaseError {
    constructor(message = "Unauthorized") {
        super(message, 401);
    }
}

export class InternalServerError extends BaseError {
    constructor(message = "Internal Server error") {
        super(message, 500);
    }
}

export class DatabaseError extends BaseError {
    constructor(message = "Database error") {
        super(message, 500);
    }
}