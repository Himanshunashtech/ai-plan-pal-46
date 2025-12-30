import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AppError {
    id: string;
    message: string;
    code?: string;
    type: 'network' | 'auth' | 'general';
    timestamp: number;
}

interface ErrorState {
    errors: AppError[];
}

const initialState: ErrorState = {
    errors: [],
};

const errorsSlice = createSlice({
    name: 'errors',
    initialState,
    reducers: {
        pushError: (state, action: PayloadAction<Omit<AppError, 'id' | 'timestamp'>>) => {
            state.errors.push({
                ...action.payload,
                id: Math.random().toString(36).substring(7),
                timestamp: Date.now(),
            });
        },
        removeError: (state, action: PayloadAction<string>) => {
            state.errors = state.errors.filter((e) => e.id !== action.payload);
        },
        clearErrors: (state) => {
            state.errors = [];
        },
    },
});

export const { pushError, removeError, clearErrors } = errorsSlice.actions;
export default errorsSlice.reducer;
