import { createSlice } from '@reduxjs/toolkit';

export interface ShowMenuState {
  isShowMenu: boolean;
}



const initialState: ShowMenuState = {
  isShowMenu: true
};

const ShowMenuSlice = createSlice({
  name: 'ShowMenu',
  initialState,
  reducers: {
    setMenu(state) {
      state.isShowMenu = !state.isShowMenu;
    }
  },
});

export const { setMenu } = ShowMenuSlice.actions;

export default ShowMenuSlice.reducer;
