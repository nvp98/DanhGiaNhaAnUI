// src/components/ErrorPage.tsx
import { Button } from 'antd';
import React from 'react';
import { BiSolidError } from 'react-icons/bi';
import { Link } from 'react-router-dom';


const ErrorPage: React.FC = () => {
 

  return (
    <div className="error-page w-[100vw] h-[100vh] flex justify-center flex-col items-center gap-3">
        <BiSolidError className='text-9xl text-red-600'/>
      <h1 className='text-6xl text-red-600 font-semibold'>ERROR PAGE</h1>
      <p className='text-2xl'>{ 'Something went wrong. Please try again later.'}</p>
      <Link to={"/"} className='mt-5'><Button type='primary'>Go to Home</Button></Link>
    </div>
  );
};

export default ErrorPage;
