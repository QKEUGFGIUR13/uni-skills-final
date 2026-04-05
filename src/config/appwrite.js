import { Client, Account } from 'appwrite';

const client = new Client();

client
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);

export const sendPasswordRecovery = async (email) => {
    try {
        await account.createRecovery(
            email,
            'https://SkillCompass.ayush-sharma.in/reset-password'
        );
        return { success: true };
    } catch (error) {
        throw error;
    }
};

export const confirmPasswordRecovery = async (userId, secret, newPassword) => {
    try {
        await account.updateRecovery(userId, secret, newPassword);
        return { success: true };
    } catch (error) {
        throw error;
    }
};

export default client;
