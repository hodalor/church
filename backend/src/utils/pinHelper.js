import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const hashPin = async (pin) => bcrypt.hash(pin, SALT_ROUNDS);
export const comparePin = async (pin, pinHash) => bcrypt.compare(pin, pinHash);
