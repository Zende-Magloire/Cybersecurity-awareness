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
const { User, Question, Topic } = require("./model/Schema");
app.use(cors());
app.use(express.json());

mongoose.connect(
  "mongodb+srv://zen:SfsiyJY1Sc8h1RGC@cluster0.p4zw6be.mongodb.net/?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const db = mongoose.connection;

db.on("error", (err) => {
  console.log(err);
});
db.once("open", () => {
  console.log("DB started successfully");
});

const topics = [
  "password security",
  "phishing awareness",
  "safe internet use",
  "social engineering",
  "data privacy and social media awareness",
];

let questions = 0;
let answers = ["A", "B", "C", "D"];
let correct_answer = null;

const chat_gpt_question = async () => {
  try {
    const randomIndex = Math.floor(Math.random() * answers.length);

    const randomString = answers[randomIndex];

    correct_answer = randomString;
    console.log(correct_answer);
    completedTopics = 0;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a cybersecurity specialist educating college students on cybersecurity 
            awareness. Let's begin by asking a multiple-choice question
            (answer choices: A, B, C, D) on the topic of ${topics[completedTopics]}.
            Make answer choice ${correct_answer} the correct one, the others wrong.`,
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
    const response = await chat_gpt_question(req.query.userId);
    res.json({ assistantResponse: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const createNewTopic = async (topicName, userId) => {
  try {
    // Find if a topic with the same name exists for the current user
    let existingTopic = await Topic.findOne({
      userId: userId,
      name: topicName,
    });

    if (existingTopic) {
      // If the topic exists, return it or update it if necessary
      console.log("Topic already exists for the user, updating...");
      return existingTopic;
    } else {
      // If the topic doesn't exist, create a new one
      console.log("Creating new topic...");
      const newTopic = new Topic({
        userId: userId,
        name: topicName,
        questions: [],
      });
      const savedTopic = await newTopic.save();
      console.log("New topic created:", savedTopic);
      return savedTopic;
    }
  } catch (error) {
    console.error("Error creating or updating topic:", error);
    throw new Error("Failed to create or update topic");
  }
};

async function updateUserTopicPerformance(userId, topicId, isCorrect) {
  try {
    // Find the user by userId
    const user = await User.findById(userId);

    let topicPerformance = user.topicsPerformance.find((tp) =>
      tp.topic.equals(topicId)
    );

    if (!topicPerformance) {
      // If topic performance doesn't exist, create a new one
      topicPerformance = {
        topic: topicId,
        totalQuestionsAnswered: 1,
        correctAnswers: isCorrect ? 1 : 0,
      };
      user.topicsPerformance.push(topicPerformance);
    } else {
      // If topic performance exists, update the counts
      topicPerformance.totalQuestionsAnswered++;
      if (isCorrect) {
        topicPerformance.correctAnswers++;
      }
      if (
        topicPerformance.correctAnswers === 3 ||
        topicPerformance.totalQuestionsAnswered === 5
      ) {
        user.completedTopics++;
      }
    }

    await user.save();
    return {
      correctAnswers: topicPerformance.correctAnswers,
      totalQuestionsAnswered: topicPerformance.totalQuestionsAnswered,
      completedTopics: user.completedTopics,
    };
  } catch (error) {
    console.error("Error updating user's topic performance:", error);
    return -1;
  }
}

app.post("/feedback", async (req, res) => {
  console.log(req.body, "feedback");
  try {
    const { question, answer, userId } = req.body;

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

    const currentDatabaseUser = await User.findOne({ username: userId });

    // console.log(currentDatabaseUser, "user id");
    let topicToUse = null;

    if (currentDatabaseUser) {
      const topicName = topics[currentDatabaseUser.completedTopics];
      topicToUse = await Topic.findOne({
        userId: currentDatabaseUser._id,
        name: topicName,
      });

      if (!topicToUse) {
        topicToUse = await createNewTopic(topicName, currentDatabaseUser._id);
      }

      const savedQuestion = new Question({
        text: question,
      });

      console.log("Question saved");
      //console.log("Question saved:", savedQuestion);
      console.log("topicToUse");
      //console.log("topicToUse", topicToUse);

      topicToUse.questions.push(savedQuestion);

      await topicToUse.save();
      console.log("topic saved");
      //console.log("Topic saved:", topicToUse);

      const user_answer = answer;
      const isCorrect = user_answer.startsWith(correct_answer);
      // console.log(isCorrect, "isCorrect");

      const userProgress = await updateUserTopicPerformance(
        currentDatabaseUser._id,
        topicToUse._id,
        isCorrect
      );
      // console.log("progress", userProgress);

      res.json({ newAssistantResponse, userProgress });
    } else {
      console.error("User not found");
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const new_chat_gpt_question = async (
  userAnswer,
  assistantResponses,
  userId
) => {
  try {
    // Retrieve the user from the database
    //console.log(userId)
    const currentUser = await User.findOne({ username: userId });

    //console.log("current", currentUser);
    // Use the completed topics count to determine the current topic
    const currentTopicIndex = currentUser.completedTopics;
    const currentTopicName = topics[currentTopicIndex];

    const randomIndex = Math.floor(Math.random() * answers.length);

    const randomString = answers[randomIndex];

    correct_answer = randomString;
    console.log(correct_answer);

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `${assistantResponses} Given that I answered this question with ${userAnswer}, 
            Generate a new multiple-choice question (answer choices: A, B, C, D) on ${currentTopicName}
            that will help increase my knowledge on the topic. Make answer choice ${correct_answer} the correct one, 
            the others wrong.`,
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
    const userId = req.body.userId;
    const response = await new_chat_gpt_question(question, answer, userId);
    res.json({ assistantResponse: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/start", async (req, res) => {
  try {
    const userId = req.body.userId;
    const existingUser = await User.findOne({ username: userId });

    if (existingUser) {
      // User already exists, update the user
      console.log("User already exists. Updating user...");

      res.json({ message: "User updated" });
    } else {
      // User does not exist, create a new user
      console.log("User does not exist. Creating new user...");

      // Creating a new user
      const newUser = new User({
        username: userId,
        topicsPerformance: [],
        completedTopics: 0,
      });

      const savedUser = await newUser.save();
      console.log("User created:", savedUser);

      res.json({ message: "User created" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//test
app.get("/test", (req, res) => {
  console.log(Api_key);
  res.json({ message: "Test " });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
