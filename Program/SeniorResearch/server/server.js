const cors = require('cors');
const express = require('express');
require('dotenv').config();
const Api_key = process.env.OPENAI_API_KEY;
const OpenAIAPI = require('openai');
const openai = new OpenAIAPI({
  api_key: Api_key
});


const app = express();
const port = process.env.PORT || 3000;
app.use(cors());

app.use(express.json());
const topics = [
  "password security",
  "phishing awareness",
  "safe internet use",
  "social engineering",
  "data privacy and social media awareness"
];

  let correct = 0;
  let questions = 0;
  let completedTopics = 0;

const chat_gpt_question = async() => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a cybersecurity specialist educating college students on cybersecurity awareness. Let's begin by asking the user a multiple-choice question (answer choices: A, B, C, D) on the topic of ${topics[completedTopics]}`,
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
    return assistantResponse
  }
    catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
}
  
app.get('/ask', async (req, res) => {
  //console.log("I have been hit")
  console.log(req.body)
  });
    
app.post('/feedback', async (req, res) => {
      try{
      const userResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "assistant",
            content: assistantResponse,
          },
          {
            role: "user",
            content: `${assistantResponse} The user answered this question with option ${userAnswer}. Provide information on whether that answer is right or wrong and why.`,
          },
        ],
        temperature: 0.5,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      questions += 1;
      const newAssistantResponse = userResponse.choices[0].message.content;
      console.log("\n" + newAssistantResponse);

      if (!newAssistantResponse.toLowerCase().includes("wrong") && !newAssistantResponse.toLowerCase().includes("incorrect")) {
        correct += 1;
      }

      if (correct === 3 || questions === 5) {
        completedTopics += 1
        res.json({ correct, questions });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


app.post('/start', (req, res) => {
  console.log("Test")
  askQuestion(topics[completedTopics]);
  res.json({ message: 'Server started' });
});

//test
app.get('/test', (req, res) => {
  console.log(openai.api_key);
  res.json({ message: 'Test ' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

