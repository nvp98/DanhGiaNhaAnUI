import React, {useEffect} from 'react';
import { notification } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { RootType } from '../store/types';
import { unsetNotify } from '../store/notifycationSlide';
type NotificationType = 'success' | 'info' | 'warning' | 'error';

const NotificationComponent: React.FC = () => {
  const [api, contextHolder] = notification.useNotification();
  const notify = useSelector((state : RootType)=> state.notify)
  const dispatch = useDispatch()
  
useEffect(() => {

  if(notify.isNotify){
    var openNotificationWithIcon = (type: NotificationType) => {
      api[type]({
        message: notify.titleNotify,
        description: notify.messageNotify,
      });
    };
    openNotificationWithIcon(notify.typeNotify)
    dispatch(unsetNotify())
  }
   
}, [notify.isNotify])

 return (
    <>
      {contextHolder}
      
    </>
  );
};

export default NotificationComponent;