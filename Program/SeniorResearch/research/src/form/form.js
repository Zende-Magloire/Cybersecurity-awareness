import React, { useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";
import Loading from "../loading/loading";

function extractOptions(text) {
  const regex =
    /[A-Z]\) [^]+?(?=[A-Z]\)|[A-Z]\.|\n|$)|[A-Z]\. [^]+?(?=[A-Z]\)|[A-Z]\.|\n|$)/g;

  const options = text.match(regex);

  if (options && options.length > 0) {
    return options;
  } else {
    return "No options found";
  }
}

const Form = () => {
  const [data, setData] = useState("");
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [IdSubmitted, setIdSubmitted] = useState(false);
  const [questions, setQuestions] = useState(null);
  const [correct, setCorrect] = useState(null);
  const [passed, setPassed] = useState(false);
  const [completedTopics, setCompletedTopics] = useState(0); 
  const [trainingCompleted, setTrainingCompleted] = useState(false); 

  const sendAnswer = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/feedback", {
        userId: data,
        question: question,
        answer: selectedOption.label,
      });
      console.log(selectedOption, "SelectionOption");
      console.log(response.data, "dataFeedback");
      setFeedback(response?.data?.newAssistantResponse);
      setCorrect(response?.data.userProgress?.correctAnswers);
      setQuestions(response?.data.userProgress?.totalQuestionsAnswered);
      setCompletedTopics(response?.data.userProgress?.completedTopics); 
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred while sending data.");
    }
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:3000/ask");
        const dataAssistance = response.data.assistantResponse;
        setQuestion(dataAssistance);

        const extractedOptions = extractOptions(dataAssistance);

        setOptions(
          extractedOptions.map((option, index) => ({
            label: option,
            value: index,
          }))
        );
      } catch (error) {
        console.error("Error:", error);
        setError("An error occurred while fetching data.");
      }
    };

    // Fetch data only if there's no existing question
    if (!question && IdSubmitted) {
      fetchData();
    }
  }, [question, IdSubmitted]); // Empty dependency array ensures it runs only on mount

  useEffect(() => {
    if (correct == 3 || questions == 5) {
      setPassed(true);
      console.log("fail")

    } else {
      setPassed(false);
    }

    if (passed && completedTopics == 5) {
      setTrainingCompleted(true);
    }
  }, [questions, correct, passed, completedTopics]);

  const getNewQuestion = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/ask_new", {
        userId: data, 
        question: question,
        answer: selectedOption ? selectedOption.label : null,
      });
      console.log(response.data);
      setQuestion(response?.data?.assistantResponse);
      setFeedback(null);
      setSelectedOption(null);
      
      // Reset feedback when a new question is generated

      // Extract options for the new question
      const extractedOptions = extractOptions(
        response?.data?.assistantResponse
      );

      setOptions(
        extractedOptions.map((option, index) => ({
          label: option,
          value: index,
        }))
      );
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred while sending data.");
    }
  };

  const submitId = async (e) => {
    console.log(data);
    e.preventDefault();
    if (data) {
      try {
        await axios.post("http://localhost:3000/start", {
          userId: data,
        });
        setIdSubmitted(true);
      } catch (error) {
        console.error("Error:", error);
        setError("An error occurred while submitting ID.");
      }
    }
  };

  return (
    <div>
      {trainingCompleted ? (
        <p>Congratulations! You completed the training!</p>
      ) : (
        <form>
          {IdSubmitted ? (
            <p>Logged in as: {data}</p>
          ) : (
            <>
              <label>
                ID:
                <input
                  type="text"
                  name="ID"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                />
              </label>
              <input type="submit" onClick={submitId} />
            </>
          )}
        </form>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!trainingCompleted && passed && <p>Hurray! You passed the level!</p>}
      {!trainingCompleted && question && <p>{question}</p>}
      {!trainingCompleted && options.length > 0 && (
        <Select
          options={options}
          onChange={setSelectedOption}
          value={selectedOption}
          isClearable
          placeholder="Select an option"
        />
      )}
      {!trainingCompleted && selectedOption && !feedback && (
        <button type="button" onClick={sendAnswer}>
          Submit
        </button>
      )}
      {!trainingCompleted && feedback && (
        <div>
          <p>{feedback}</p>
          <button type="button" onClick={getNewQuestion}>
            Next Question
          </button>
        </div>
      )}
    </div>
  );
};


export default Form;
