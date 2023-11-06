import os
import openai
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")
correct_1 = 0
questions_1 = 0

while correct_1 < 3 or questions_1 < 5:
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {
                "role": "system",
                "content": "You are a cybersecurity specialist educating college students on cybersecurity awareness. Let's begin by asking the user a multiple choice question (answer choices: A, B, C, D) on the topic of Phishing Awareness"
            },
        ],
        temperature=0.5,
        max_tokens=1000,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )
    assistant_response = response['choices'][0]['message']['content']
    print(assistant_response)
    user_answer = input("Please enter your answer choice (A, B, C or D): ")
    print("You entered:", user_answer)

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {
                "role": "assistant",
                "content": assistant_response
            },
            {
                "role": "user",
                "content": assistant_response + "The user answered this question with option" + user_answer + "Provide information on whether that answer is right or wrong and why."
            },
        ],
        temperature=0.5,
        max_tokens=1000,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )
    assistant_response = response['choices'][0]['message']['content']
    print(assistant_response)

    if "correct" in assistant_response.lower():
        correct_1 += 1
        questions_1 += 1

if correct_1 == 3():
    print("Congratulations! You have passed level 1.")
elif questions_1 == 5():
    print("You have answered " + user_answer + "/5 questions correctly. Let's move on to a new topic.")
