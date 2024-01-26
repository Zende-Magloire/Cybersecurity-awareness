import React from "react";
import { useState } from "react";
import axios from 'axios';

const Form = () => {
    const [data, setData] = useState('');

    const sendData = async (e) => {
        console.log(data)
        e.preventDefault()
        try {
          const response = await axios.post('http://localhost:3000/ask', { data });
          console.log(response.data); 
        } catch (error) {
          console.error('Error:', error);
        }
      }
    
  return (
    <div>
      <form onSubmit={sendData}>
        <label>
          ID:
          <input type="text" name="name" onChange={(e) => setData(e.target.value)}/>
        </label>
        <input type="submit" value="Submit"/>
      </form>
    </div>
  );
};

export default Form;
