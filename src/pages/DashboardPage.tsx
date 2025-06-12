import React, { useEffect, useState } from "react";
import LayoutComponent from "../components/LayoutComponent";
import {  Spin } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { RootType } from "../store/types";
import "dayjs/locale/en";

import LogoutAction from "../acctions/LogoutAction";
import { useNavigate } from "react-router-dom";


const DashboardPage: React.FC = () => {
    const auth = useSelector((state: RootType) => state.auth)
    const notify = useSelector((state: RootType) => state.notify)
    const [loading, setLoading] = useState(false);
   
    const dispatch = useDispatch()
    const navigator = useNavigate();




    const getData = async () => {
        setLoading(true)

        setLoading(false)
    }
    useEffect(
        () => {
            getData()
        }, [notify.isNotify]
    )

    useEffect(() => {
        if(!auth.isAuthenticated){
            navigator("/login")
        }
        if (auth.user?.timesave) {
            const specificTime = new Date(auth.user.timesave);
            const now = new Date();
            const differenceInMilliseconds = now.getTime() - specificTime.getTime();

            const differenceInHours = differenceInMilliseconds / (1000 * 60 * 60);

            console.log(differenceInHours)

            if (differenceInHours >= 2) {
                LogoutAction(dispatch, navigator);
            }

        }
    }, [])

   

    return <>
        <LayoutComponent menuSelect="history">
            <>
                {
                    loading ? <>
                        <div className="!min-h-[100%] flex justify-center items-center">
                            <Spin />
                        </div>

                    </> :
                        <>
                            
                           <div className="w-full h-full p-4">
                            <div className="w-full h-full bg-white rounded-xl shadow border overflow-hidden">
                                <div className="w-full h-full aspect-w-16 aspect-h-9">
                                <iframe
                                    title="Báo cáo Power BI"
                                    src="https://app.powerbi.com/view?r=eyJrIjoiOWIyNDI3MjUtY2UzYS00OGU5LWFlMjItN2YyMDZmNzE5MDFlIiwidCI6ImIxNThlOWE1LTA2OTEtNGU0Zi1iYmExLTQxN2I5OWVjZDBhMCIsImMiOjEwfQ%3D%3D"
                                    className="w-full h-full border-0"
                                    allowFullScreen
                                ></iframe>
                                </div>
                            </div>
                            </div>
                        </>
                }

            </>


        </LayoutComponent>



    </>

}

export default DashboardPage;