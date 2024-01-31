import React from 'react';
import ReactLoading from 'react-loading';
 
const Loading = ({ type, color }) => (
    <ReactLoading type={type} color={color} height={'50%'} width={'40%'} />
);
 
export default Loading;