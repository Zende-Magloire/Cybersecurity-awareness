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

// const userQuizResultSchema = new mongoose.Schema({
//   userId: String,
//   correct: Number,
//   questions: Number,
//   topic: String,
// });

// const UserQuizResult = mongoose.model("UserQuizResult", userQuizResultSchema);

const topics = [
  "password security",
  "phishing awareness",
  "safe internet use",
  "social engineering",
  "data privacy and social media awareness",
];

let questions = 0;
let completedTopics = 0;
let answers = ["A", "B", "C", "D"];
let correct_answer = null;

const chat_gpt_question = async () => {
  try {
    const randomIndex = Math.floor(Math.random() * answers.length);

    const randomString = answers[randomIndex];

    correct_answer = randomString;
    console.log(correct_answer);

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a cybersecurity specialist educating college students on cybersecurity 
            awareness. Let's begin by asking a multiple-choice question
            (answer choices: A, B, C, D) on the topic of ${topics[completedTopics]}.
            Make answer ${correct_answer} the correct one, the others wrong.`,
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

const createNewTopic = async (topicName, userID) => {
  console.log(userID, "userID HERE AND THERE");
  try {
    // Create a new topic document
    const newTopic = new Topic({
      userId: userID,
      name: topicName,
      questions: [],
    });

    // Save the new topic to the database
    const savedTopic = await newTopic.save();
    console.log("New topic created:", savedTopic);

    return savedTopic;
  } catch (error) {
    console.error("Error creating new topic:", error);
    throw new Error("Failed to create new topic");
  }
};

async function updateUserTopicPerformance(userId, topicId, isCorrect) {
  try {
    console.log(userId, "userID");
    const user = await User.findById(userId);
    console.log(user, "user here  ", topicId, "topicId");

    let topicPerformance = user.topicsPerformance.find((tp) =>
      tp.topic.equals(topicId)
    );

    if (!topicPerformance) {
      // Create new topic performance entry if it doesn't exist
      topicPerformance = {
        topic: topicId,
        totalQuestionsAnswered: 1,
        correctAnswers: isCorrect ? 1 : 0,
      };
      user.topicsPerformance.push(topicPerformance);
    }
    console.log(topicPerformance, "findTopic");

    topicPerformance.totalQuestionsAnswered++;
    if (isCorrect) {
      topicPerformance.correctAnswers++;
    }
    console.log(topicPerformance, "findTopic2");
    await user.save();
    return topicPerformance.correctAnswers;
  } catch (error) {
    console.error("Error updating user's topic performance:", error);
    return -1; // Error occurred
  }
}

app.post("/feedback", async (req, res) => {
  console.log(req.body, "feedback");
  try {
    const { question, answer } = req.body;

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

    const currentDatabaseUser = await User.findOne({
      username: req.body.userId,
    });
    console.log(currentDatabaseUser, "zende id");
    let topicToUse = null;
    // Check if the user exists
    if (currentDatabaseUser) {
      // Find or create the topic for the user
      const topicName = topics[completedTopics];
      topicToUse = await Topic.findOne({
        userId: currentDatabaseUser._id,
        name: topicName,
      });
      console.log(topicToUse, "topicToUse", topicName);

      if (!topicToUse) {
        // If the topic doesn't exist, create a new topic for the user
        topicToUse = await createNewTopic(topicName, currentDatabaseUser._id);
      }

      // Create a new question object
      const savedQuestion = new Question({
        text: question,
      });

      console.log("Question saved:", savedQuestion);
      console.log("topicToUse", topicToUse);

      // Add the new question to the topic's questions array
      topicToUse.questions.push(savedQuestion);

      // Save the updated topic back to the database
      await topicToUse.save();
      console.log("Topic saved:", topicToUse);
    } else {
      // Handle case where user doesn't exist
      console.error("User not found");
    }

    const user_answer = req.body.answer;
    const isCorrect = user_answer.startsWith(correct_answer);
    console.log(isCorrect, "isCorrect");

    const correctAnswers = await updateUserTopicPerformance(
      currentDatabaseUser._id,
      topicToUse._id,
      isCorrect
    );
    console.log("correctAnswer", correctAnswers);

    // // Find the index of the topic in user's topicsPerformance array
    // const topicIndex = user.topicsPerformance.findIndex(
    //   (tp) => tp.topic.toString() === topicToUse._id.toString()
    // );

    // if (topicIndex !== -1) {
    //   // If the topic already exists in user's topicsPerformance, update it
    //   user.topicsPerformance[topicIndex].correctAnswers += 1;
    //   user.topicsPerformance[topicIndex].totalQuestionsAnswered += 1;
    // } else {
    //   // If the topic is not in user's topicsPerformance, add it
    //   user.topicsPerformance.push({
    //     topic: topicToUse._id,
    //     correctAnswers: correct,
    //     totalQuestionsAnswered: questions,
    //   });
    // }
    // // Save the updated user document
    // await user.save();

    //   if (user_answer.startsWith(correct_answer)) {
    //     correct += 1;
    //     console.log("You got it correct")
    //   }
    //   else{
    //     wrong += 1;
    //   console.log("You got it wrong")
    //  }

    if (correctAnswers === 3 || questions === 5) {
      completedTopics += 1;
    }

    res.json({ newAssistantResponse, correctAnswers, questions });

    if (correctAnswers === 3 || questions === 5) {
      // // correct = 0;
      // questions = 0;
      // console.log("leveled up", correct, questions);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const new_chat_gpt_question = async (userAnswer, assistantResponses) => {
  try {
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
            Generate a new multiple-choice question (answer choices: A, B, C, D)on ${topics[completedTopics]}
            that will help increase my knowledge on the topic. Make answer ${correct_answer} the correct one, 
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
    const response = await new_chat_gpt_question(question, answer);
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
