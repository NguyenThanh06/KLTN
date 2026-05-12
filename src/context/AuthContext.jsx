import { createContext, useContext, useState, useEffect, Children } from 'react';

const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect (() => {
        //Ktra token khi mới load app
        const token = localStorage.getItem('accessToken');
        if (token) {
            // userAccount = api.chidokhongbietnua....
            // setUser({
            //      id: ...
            //      username: ...
            //});
        }
        setIsLoading(false);
    }, []);
}