/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();
const DEFAULT_AVATAR = "/defaultAvatar/default_avatar_1.svg";

const normalizeAuthUser = (userData) => {
    if (!userData) return null;

    return {
        ...userData,
        accountID: userData.accountID ?? userData.accountId ?? userData.id ?? userData.userID,
        username: userData.username ?? userData.tenDangNhap,
        tenHienThi: userData.tenHienThi ?? userData.displayName ?? userData.username,
        avatar:
            userData.avatar ||
            userData.avatarUrl ||
            userData.avatarURL ||
            userData.anhDaiDien ||
            userData.duongDanAvatar ||
            DEFAULT_AVATAR,
    };
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');

        if (!savedUser) return null;

        try {
            return normalizeAuthUser(JSON.parse(savedUser));
        } catch {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            return null;
        }
    });

    const loading = false;

    const login = (userData) => {
        const normalizedUser = normalizeAuthUser(userData);

        setUser(normalizedUser);
        localStorage.setItem('user', JSON.stringify(normalizedUser));

        if (normalizedUser?.token) {
            localStorage.setItem('token', normalizedUser.token);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
