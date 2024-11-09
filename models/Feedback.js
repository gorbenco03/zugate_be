// models/Feedback.js
import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: function() { return !this.isAnonymous; } // Studentul este necesar doar dacă feedback-ul nu este anonim
  },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  feedbackText: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  isAnonymous: { type: Boolean, default: false },
}, {
  timestamps: true,
});

// Verificăm dacă modelul este deja definit înainte de a-l crea
const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);

export default Feedback;