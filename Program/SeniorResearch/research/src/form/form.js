import React from "react";
import { useState } from "react";
import axios from 'axios';

const Form = () => {
    const [data, setData] = useState('');
    const [chat_gpt_question, setChat_gpt_question] = useState('');
    const sendData = async (e) => {
        console.log(data)
        e.preventDefault()
        try {
          const response = await axios.get('http://localhost:3000/ask');
          setChat_gpt_question(response.data)
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
          {chat_gpt_question ? <div>
              {chat_gpt_question}
          </div> : "No question"}
    </div>
  );
};

export default Form;
