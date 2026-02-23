import { User } from '../../domain/entities/User';

export class UserRepository {
    async save(user: User) {
        console.log('Saving to DB...');
    }
}
