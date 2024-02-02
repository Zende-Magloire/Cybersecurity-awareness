const mongoose = require('mongoose');

// Schema for Questions
const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  // You can add more fields as needed, e.g., options, correctAnswer, etc.
});

// Schema for Topics
const topicSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  questions: [questionSchema],
});

// Schema for User's Topic Performance
const userTopicPerformanceSchema = new mongoose.Schema({
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  correctAnswers: { type: Number, default: 0 },
  totalQuestionsAnswered: { type: Number, default: 0 },
});

// Schema for Users
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  topicsPerformance: [userTopicPerformanceSchema],
});

// Models
const Question = mongoose.model('Question', questionSchema);
const Topic = mongoose.model('Topic', topicSchema);
const User = mongoose.model('User', userSchema);

module.exports = { Question, Topic, User };
