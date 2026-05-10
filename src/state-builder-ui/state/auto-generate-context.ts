import { createContext, useContext } from 'react';

export const AutoGenerateOnMountContext = createContext<boolean>(false);
export function useAutoGenerateOnMount() { return useContext(AutoGenerateOnMountContext); }
