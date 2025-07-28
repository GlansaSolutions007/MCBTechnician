import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext'; // you’ll create this

export const useAuth = () => useContext(AuthContext);