import os
import openai
from dotenv import load_dotenv
from flask import Flask, render_template, request, redirect, url_for

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)

def get_feedback(previous_question, user_answer):
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {
                "role": "assistant",
                "content": previous_question
            },
            {
                "role": "user",
                "content": previous_question + f"The user answered this question with option {user_answer}. Provide information on whether that answer is right or wrong and why."
            },
        ],
        temperature=0.5,
        max_tokens=1000,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )
    feedback = response['choices'][0]['message']['content']
    return feedback

def ask_question(topic_id, question_number):
    correct = 0
    questions = 0

    # Repeat questions until the user has answered 3 correctly or 5 in total
    while correct < 3 and questions < 5:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": f"You are a cybersecurity specialist educating college students on cybersecurity awareness. Let's begin by asking the user a multiple choice question (answer choices: A, B, C, D) on the topic of {topics[topic_id]}"
                },
            ],
            temperature=0.5,
            max_tokens=1000,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0
        )
        assistant_response = response['choices'][0]['message']['content']

        user_answer = request.form.get('user_answer')

        feedback = get_feedback(assistant_response, user_answer)

        questions += 1

        if "wrong" not in feedback.lower() and "incorrect" not in feedback.lower():
            correct += 1

        if correct == 3 or questions == 5:
            return correct, questions

topics = [
    "password security",
    "phishing awareness",
    "safe internet use",
    "social engineering",
    "data privacy and social media awareness"
]

completed_topics = 0

@app.route('/')
def welcome():
    return render_template('welcome.html')

@app.route('/question/<int:topic_id>/<int:question_number>', methods=['GET', 'POST'])
def question(topic_id, question_number):
    if request.method == 'POST':
        correct, questions = ask_question(topic_id, question_number)
        if correct == 3:
            return redirect(url_for('result', correct=correct, questions=questions))

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {
                "role": "system",
                "content": f"You are a cybersecurity specialist educating college students on cybersecurity awareness. Let's begin by asking the user a multiple choice question (answer choices: A, B, C, D) on the topic of {topics[topic_id]}"
            },
        ],
        temperature=0.5,
        max_tokens=1000,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )
    question_text = response['choices'][0]['message']['content']

    feedback = "" 
    if request.method == 'POST':
        user_answer = request.form.get('user_answer')
        feedback = get_feedback(response['choices'][0]['message']['content'], user_answer)
        _, _ = ask_question(topic_id, question_number)  

    return render_template('question.html', topic_id=topic_id, question_number=question_number, question_text=question_text, feedback=feedback)

@app.route('/result/<int:correct>/<int:questions>')
def result(correct, questions):
    return render_template('result.html', correct=correct, questions=questions)

if __name__ == '__main__':
    app.run(debug=True)
