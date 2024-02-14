import React, { useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";

//loading
const Loading = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100px",
        width: "100%",
        fontSize: "20px",
        fontWeight: "bold",
        color: "#333",
      }}
    >
      AI is generating...
    </div>
  );
};

//extract options
function extractOptions(text) {
  const regex =
    /[A-D][\).] [^]+?(?=[A-D][\).]|\n|$)|[A-D]\. [^]+?(?=[A-D][\).]|\n|$)/g;

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
  const [loading, setLoading] = useState(false);
  const [IdSubmitted, setIdSubmitted] = useState(false);
  const [questions, setQuestions] = useState(null);
  const [correct, setCorrect] = useState(null);
  const [passed, setPassed] = useState(false);
  const [completedTopics, setCompletedTopics] = useState(0);
  const [trainingCompleted, setTrainingCompleted] = useState(false);

  //get feedback
  const sendAnswer = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:3000/feedback", {
        userId: data,
        question: question,
        answer: selectedOption.label,
      });
      //  console.log(selectedOption, "SelectionOption");
      //  console.log(response.data, "dataFeedback");
      setFeedback(response?.data?.newAssistantResponse);
      setCorrect(response?.data.userProgress?.correctAnswers);
      setQuestions(response?.data.userProgress?.totalQuestionsAnswered);
      setCompletedTopics(response?.data.userProgress?.completedTopics);
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred while sending data.");
    } finally {
      setLoading(false);
    }
  };

  //ask initial question
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get("http://localhost:3000/ask", {
          params: {
            userId: data,
          },
        });
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
      } finally {
        setLoading(false);
      }
    };

    // Fetch data only if there's no existing question
    if (!question && IdSubmitted) {
      fetchData();
    }
  }, [question, IdSubmitted, data]);

  //check if user passed
  useEffect(() => {
    if (correct == 3 || questions == 5) {
      setPassed(true);
    } else {
      setPassed(false);
    }

    if (passed && completedTopics == 5) {
      setTrainingCompleted(true);
    }
  }, [questions, correct, passed, completedTopics]);

  //get new question
  const getNewQuestion = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:3000/ask_new", {
        userId: data,
        question: question,
        answer: selectedOption ? selectedOption.label : null,
      });
      //  console.log(response.data);
      setQuestion(response?.data?.assistantResponse);
      setFeedback(null);
      setSelectedOption(null);

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
    } finally {
      setLoading(false);
    }
  };

  const submitId = async (e) => {
    //console.log(data);
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
      {loading ? (
        <Loading />
      ) : (
        <>
          {trainingCompleted ? (
            <p
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100px",
                width: "100%",
                fontSize: "20px",
                fontWeight: "bold",
                color: "blue",
              }}
            >
              Congratulations! You completed the training!
            </p>
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
          {!trainingCompleted && passed && !feedback && (
            <p
              style={{
                color: "blue",
                fontSize: "15px",
                fontWeight: "bold",
              }}
            >
              Hurray! You passed the level! You're making great progress! Let's
              dive into a new topic...
            </p>
          )}
          {!trainingCompleted && question && (
            <div>
              <p>
                <strong>{question.split("\n")[0]}</strong>
              </p>
            </div>
          )}
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
        </>
      )}
    </div>
  );
};

export default Form;
