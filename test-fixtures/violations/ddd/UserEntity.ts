import { UserRepository } from '../../infrastructure/UserRepository'; // VIOLATION: Domain importing Infrastructure

export class UserEntity {
    id: string;
    name: string;
}
