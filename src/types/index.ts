import { Prisma } from "@prisma/client";

export type Client = Prisma.ClientGetPayload<{
    include: {
        goals: true;
        wallets: true;
        events: true;
        simulations: true;
        insurances: true;
    };
}>;

export type Goal = Prisma.GoalGetPayload<{
    include: {
        client: true;
    };
}>;

export type Wallet = Prisma.WalletGetPayload<{
    include: {
        client: true;
    };
}>;

export type Event = Prisma.EventGetPayload<{
    include: {
        client: true;
    };
}>;

export type Simulation = Prisma.SimulationGetPayload<{
    include: {
        client: true;
    };
}>;

export type Insurance = Prisma.InsuranceGetPayload<{
    include: {
        client: true;
    };
}>;

export type User = Prisma.UserGetPayload<{}>;

export type CreateClientData = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateClientData = Partial<CreateClientData>;

export type CreateGoalData = Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> & {
    clientId: string
};
export type UpdateGoalData = Partial<CreateGoalData>;

export type CreateWalletData = Omit<Wallet, 'id' | 'createdAt' | 'updatedAt'> & {
    clientId: string
};
export type UpdateWalletData = Partial<CreateWalletData>;

export type CreateEventData = Omit<Event, 'id' | 'createdAt' | 'updatedAt'> & {
    clientId: string
};
export type UpdateEventData = Partial<CreateEventData>;

export type CreateSimulationData = Omit<Simulation, 'id' | 'createdAt' | 'updatedAt'> & {
    clientId: string
};
export type UpdateSimulationData = Partial<CreateSimulationData>;

export interface ProjectionPoint {
    year: number;
    projectedValue: number;
};

export interface WealthProjectionParams {
    initialValue: number;
    interestRate: number;
    events: Event[];
    projectionYears: number;
};

export interface AlignmentData {
    currentPatrimony: number;
    plannedPatrimony: number;
    alignmentPercent: number;
    category: AlignmentCategory;
};

export enum AlignmentCategory {
    EXCELLENT = 'EXCELLENT',
    GOOD = 'GOOD',
    WARNING = 'WARNING',
    CRITICAL = 'CRITICAL'
}

export interface AutoSuggestion {
    type: 'INCREASE_CONTRIBUTION' | 'ADJUST_ALLOCATION' | 'REDUCE_EXPENSES';
    description: string;
    suggestedValue?: number;
    suggestedPeriod?: number;
}

export interface AuthPayload {
    userId: string;
    email: string;
    role: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    role?: 'ADVISOR' | 'VIEWER';
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface AuthResponse {
    user: {
        id: string;
        email: string;
        role: string;
        createdAt: Date;
        updatedAt: Date;
    };
    token: string;
    expiresIn: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ClientFilters {
    isActive?: boolean;
    familyProfile?: string;
    ageMin?: number;
    ageMax?: number;
    search?: string;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface SSEMessage {
    type: 'progress' | 'complete' | 'error';
    data: any;
    timestamp: Date;
}

export interface CSVImportProgress {
    total: number;
    processed: number;
    errors: string[];
    percentage: number;
}

