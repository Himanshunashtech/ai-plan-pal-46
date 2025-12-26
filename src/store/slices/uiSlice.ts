import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
    theme: 'dark' | 'light' | 'system';
    modals: {
        [key: string]: boolean;
    };
}

const getInitialTheme = (): 'dark' | 'light' | 'system' => {
    if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | 'system';
        if (savedTheme) return savedTheme;
    }
    return 'system';
};

const initialState: UIState = {
    theme: getInitialTheme(),
    modals: {},
};

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setTheme: (state, action: PayloadAction<'dark' | 'light' | 'system'>) => {
            state.theme = action.payload;
            localStorage.setItem('theme', action.payload);
        },
        openModal: (state, action: PayloadAction<string>) => {
            state.modals[action.payload] = true;
        },
        closeModal: (state, action: PayloadAction<string>) => {
            state.modals[action.payload] = false;
        },
    },
});

export const { setTheme, openModal, closeModal } = uiSlice.actions;

export default uiSlice.reducer;
