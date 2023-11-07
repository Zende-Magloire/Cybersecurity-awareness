import os
import openai
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")
#user cannot enter anything outside of answer choices
valid_choices = ["A", "B", "C", "D"]

def ask_question(topic):
    correct = 0
    questions = 0
    #repeat questions until user has answered 3 correctly or 5 in total
    while correct < 3 or questions < 5:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are a cybersecurity specialist educating college students on cybersecurity awareness. Let's begin by asking the user a multiple choice question (answer choices: A, B, C, D) on the topic of " + topic
                },
            ],
            temperature=0.5,
            max_tokens=1000,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0
        )
        assistant_response = response['choices'][0]['message']['content']
        print("\n" + assistant_response)
        user_answer = ""
        while user_answer not in valid_choices:
            user_answer = input("\n"+"Please enter your answer choice (A, B, C, or D): ").upper()
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
                    "content":  assistant_response + "The user answered this question with option" + user_answer + "Provide information on whether that answer is right or wrong and why."
                },
            ],
            temperature=0.5,
            max_tokens=1000,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0
        )
        questions += 1
        assistant_response = response['choices'][0]['message']['content']
        print("\n" + assistant_response)

        if "wrong" not in assistant_response.lower() and "incorrect" not in assistant_response.lower():
            correct += 1
        
        if correct == 3:
            print("\nYou answered " + str(correct) + "/" + str(questions) + " questions correctly.")
            break
        elif questions == 5:
            print("\nYou answered " + str(correct) + "/" + str(questions) + " questions correctly.")
            break
    
    return correct, questions

topics = [
    "phishing awareness",
    "password security",
    "social engineering",
    "safe internet use",
    "data privacy and social media awareness"
]

completed_topics = 0

while completed_topics < 5:
    correct, questions = ask_question(topics[completed_topics])
    if correct == 3:
        print("Congratulations! You passed level " + str(completed_topics + 1))
        print("Starting a new topic...")
        completed_topics += 1
    elif questions ==5:
        print("Let's move on to a new topic")
        print("Starting a new topic...")
        completed_topics += 1

    
