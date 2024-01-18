from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

@app.route('/')
def welcome():
    return render_template('welcome.html')

@app.route('/question/<int:topic_id>/<int:question_number>', methods=['GET', 'POST'])
def question(topic_id, question_number):
    # Implement logic to display and process questions
    return render_template('question.html', topic_id=topic_id, question_number=question_number)

@app.route('/result/<int:correct>/<int:questions>')
def result(correct, questions):
    # Implement logic to display the result and store the score
    return render_template('result.html', correct=correct, questions=questions)
