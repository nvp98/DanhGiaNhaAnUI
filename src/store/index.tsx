// // store.ts

// import { configureStore, combineReducers } from '@reduxjs/toolkit';
// import { persistReducer, persistStore, Storage } from 'redux-persist';
// import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
// import authReducer from './authSlice';
// import loadReducer from './loadSlice';
// import notifyReducer from './notifycationSlide'; // corrected import name
// import { RootState } from './types';

// // Redux persist configuration
// const persistConfig = {
//   key: 'root',
//   storage,
// };

// // Combine reducers
// const rootReducer = combineReducers({
//   auth: authReducer,
//   load: loadReducer,
//   notify: notifyReducer,
// });

// // Create persisted reducer
// const persistedReducer = persistReducer(persistConfig, rootReducer);

// // Configure store
// const store = configureStore({
//   reducer: persistedReducer,

// });

// // Create persistor
// export const persistor = persistStore(store);

// export default store;


import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web

import authSlice from './authSlice';
import notifyReducer from './notifycationSlide';
import showMenuSlice from './ShowMenuSlide';
import nhaAnSlice from './NhaAnSlice';

const rootReducer = combineReducers({
  auth: authSlice,
  notify: notifyReducer,
  showMenu: showMenuSlice,
  nhaAn: nhaAnSlice
});

const persistConfig = {
  key: 'root',
  storage
};

const persistedReducer = persistReducer(persistConfig, rootReducer);


const store = configureStore({
  reducer: persistedReducer,
});


export default store
export const persistor = persistStore(store);
