// import { useEffect } from "react";
// import { useDispatch } from "react-redux";
// import { logout, setCredentials, setLoading } from "../store/slices/authSlice";

// export const useAutoLogin = () => {
//   const dispatch = useDispatch();

//   useEffect(() => {
//     const initAuth = async () => {
//       try {
//         const token = await window.electronAPI.auth.getStoredToken();
//         const user = await window.electronAPI.auth.getCurrentUser();

//         if (token && user) {
//           dispatch(setCredentials({ user, token }));
//         } else {
//           dispatch(logout());
//         }
//       } catch (err) {
//         dispatch(logout());
//       } finally {
//         dispatch(setLoading(false));
//       }
//     };

//     initAuth();
//   }, [dispatch]);
// };
