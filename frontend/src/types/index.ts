export interface User {
    id: string;
    username: string;
    email: string;
    password: string;
}

export interface Waiver {
    id: string;
    userId: string;
    signature: string;
    dateSigned: Date;
}

export interface Rental {
    id: string;
    userId: string;
    kayakId: string;
    rentalStart: Date;
    rentalEnd: Date;
    passcode: string;
}

export interface Kayak {
    id: string;
    name: string;
    description: string;
    pricePerHour: number;
}