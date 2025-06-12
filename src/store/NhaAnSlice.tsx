  import { createSlice, PayloadAction } from '@reduxjs/toolkit'


export interface NhaAnState {
    idNhaAn: number
  }

export const initialState: NhaAnState = {
    idNhaAn: 0,
  }

  const nhaAnSlice = createSlice({
    name: 'nhaAn',
    initialState,
    reducers: {
      set(state, action: PayloadAction<number>) {
        state.idNhaAn = action.payload
      },
    }
  })

  export const { set } = nhaAnSlice.actions

  
  export default nhaAnSlice.reducer;
