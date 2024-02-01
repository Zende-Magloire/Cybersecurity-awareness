const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const Api_key = process.env.OPENAI_API_KEY;
const OpenAIAPI = require("openai");
const openai = new OpenAIAPI({
  api_key: Api_key,
});

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/cybersecurity_quiz", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userQuizResultSchema = new mongoose.Schema({
  userId: String,
  correct: Number,
  questions: Number,
  topic: String,
});

const UserQuizResult = mongoose.model("UserQuizResult", userQuizResultSchema);

const topics = [
  "password security",
  "phishing awareness",
  "safe internet use",
  "social engineering",
  "data privacy and social media awareness",
];

let correct = 0;
let questions = 0;
let completedTopics = 0;

const chat_gpt_question = async () => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a cybersecurity specialist educating college students on cybersecurity 
            awareness. Let's begin by asking a multiple-choice question
            (answer choices: A, B, C, D) on the topic of ${topics[completedTopics]}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const assistantResponse = response.choices[0].message.content;
    console.log("\n" + assistantResponse);
    return assistantResponse;
  } catch (error) {
    console.error(error);
    throw new Error("Internal Server Error");
  }
};

app.get("/ask", async (req, res) => {
  try {
    const response = await chat_gpt_question();
    res.json({ assistantResponse: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/feedback", async (req, res) => {
  console.log(req.body, "feedback");
  try {
    const { question, answer } = req.body;

    const userId = req.headers.userId;

    const userResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "assistant",
          content: req.body.question,
        },
        {
          role: "user",
          content: `${req.body.question} I think the answer to this question is ${req.body.answer}. 
            Provide information on whether that answer is right or wrong and why.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const newAssistantResponse = userResponse.choices[0].message.content;
    console.log("\n" + newAssistantResponse);
    questions += 1;

    if (
      !newAssistantResponse.toLowerCase().includes("wrong") &&
      !newAssistantResponse.toLowerCase().includes("incorrect")
    ) {
      correct += 1;
    }

    if (correct === 3 || questions === 5) {
      completedTopics += 1;
    }

    const result = new UserQuizResult({
      userId,
      correct,
      questions,
      topic: topics[completedTopics],
    });

    await result.save();

    res.json({ newAssistantResponse, correct, questions });

    if (correct === 3 || questions === 5) {
      correct = 0;
      questions = 0;
    }
    console.log("leveled up", correct, questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const new_chat_gpt_question = async (userAnswer, assistantResponses) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `${assistantResponses} Given that I answered this question with ${userAnswer}, 
            Generate a new multiple-choice question (answer choices: A, B, C, D)on ${topics[completedTopics]}
            that will help increase my knowledge on the topic.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const assistantResponse = response.choices[0].message.content;
    console.log("\n" + assistantResponse);
    return assistantResponse;
  } catch (error) {
    console.error(error);
    throw new Error("Internal Server Error");
  }
};

app.post("/ask_new", async (req, res) => {
  try {
    const question = req.body.question;
    const answer = req.body.answer;
    //if correct == 3 or questions == 5, show a passed level screen & store result before switching
    //to new topic
    //if user is done with topics, go to congratulatory screen & store result
    const response = await new_chat_gpt_question(question, answer);
    res.json({ assistantResponse: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/start", (req, res) => {
  console.log("Test");
  console.log("Received ID:", req.headers.userId); // Log the received ID
  askQuestion(topics[completedTopics]);
  res.json({ message: "Server started" });
});

//test
app.get("/test", (req, res) => {
  console.log(Api_key);
  res.json({ message: "Test " });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
