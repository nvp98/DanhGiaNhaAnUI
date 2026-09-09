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
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE, persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web

import notifyReducer from './notifycationSlide';
import nhaAnSlice from './NhaAnSlice';
import authV2Slice from './authV2Slice';
import { apiSliceV2 } from '../services/apiSliceV2';

const rootReducer = combineReducers({
  notify: notifyReducer,
  nhaAn: nhaAnSlice,
  authV2: authV2Slice,
  [apiSliceV2.reducerPath]: apiSliceV2.reducer
});

const persistConfig = {
  key: 'root',
  storage,
  // Cache của RTK Query không cần (và không nên) persist qua localStorage.
  blacklist: [apiSliceV2.reducerPath]
};

const persistedReducer = persistReducer(persistConfig, rootReducer);


const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    }).concat(apiSliceV2.middleware),
});


export default store
export const persistor = persistStore(store);
