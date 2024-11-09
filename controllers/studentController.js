// controllers/studentController.js
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';
import Quiz from '../models/Quiz.js';
import StudentQuizResult from '../models/StudentQuizResult.js';
import Feedback from '../models/Feedback.js';
import Attendance from '../models/Attendance.js';

export const getSchedule = async (req, res) => {
  try {
    const student = await User.findById(req.user.id).populate('class');
    if (!student) {
      return res.status(404).json({ message: 'Elevul nu a fost găsit' });
    }

    const lessons = await Lesson.find({ class: student.class._id })
      .populate('teacher', 'name')
      .sort({ date: 1, time: 1 });

    res.json({ schedule: lessons });
  } catch (error) {
    console.error('Eroare la obținerea orarului:', error);
    res.status(500).json({ message: 'Eroare de server' });
  }
};


export const getLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('teacher', 'name')
      .populate({
        path: 'quiz',
        populate: {
          path: 'questions',
        },
      });

    if (!lesson) {
      return res.status(404).json({ message: 'Lecția nu a fost găsită' });
    }

    const student = await User.findById(req.user.id).populate('class');
    if (!student || lesson.class.toString() !== student.class._id.toString()) {
      return res.status(403).json({ message: 'Nu aveți acces la această lecție' });
    }

    res.json({ lesson });
  } catch (error) {
    console.error('Eroare la obținerea lecției:', error);
    res.status(500).json({ message: 'Eroare de server' });
  }
};

// routes/studentRoutes.js


// controllers/studentController.js



export const getQuizForLesson = async (req, res) => {
    try {
      const { lessonId } = req.params;
      const lesson = await Lesson.findById(lessonId).populate('quiz');
  
      if (!lesson) {
        return res.status(404).json({ message: 'Lesson not found.' });
      }
  
      if (!lesson.quiz) {
        return res.status(404).json({ message: 'Quiz not found for this lesson.' });
      }
  
      const quiz = await Quiz.findById(lesson.quiz._id).populate('questions.options');
  
      res.json({ quiz });
    } catch (error) {
      console.error('Error fetching quiz:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  export const submitQuizAnswers = async (req, res) => {
    try {
      const { lessonId } = req.params;
      const { answers } = req.body;
      const studentId = req.user.id;
  
      const lesson = await Lesson.findById(lessonId).populate('quiz');
  
      if (!lesson) {
        return res.status(404).json({ message: 'Lesson not found.' });
      }
  
      if (!lesson.quiz) {
        return res.status(404).json({ message: 'Quiz not found for this lesson.' });
      }
  
      const quiz = await Quiz.findById(lesson.quiz._id).populate('questions.options');
  
      if (!Array.isArray(answers)) {
        return res.status(400).json({ message: 'Answers should be an array.' });
      }
  
      // Procesare răspunsuri și calculare scor
      let score = 0;
      const processedAnswers = answers.map((answer) => {
        const question = quiz.questions.id(answer.questionId);
        if (!question) {
          throw new Error(`Question with ID ${answer.questionId} not found in quiz.`);
        }
  
        const isCorrect = answer.selectedOption === question.correctAnswer;
        if (isCorrect) score++;
  
        return {
          questionId: question._id,
          selectedOption: answer.selectedOption,
          isCorrect: isCorrect,
        };
      });
  
      // Salvare rezultat
      const studentQuizResult = new StudentQuizResult({
        student: studentId,
        quiz: quiz._id,
        lesson: lessonId,
        score: score,
        answers: processedAnswers,
      });
  
      await studentQuizResult.save();
  
      res.json({ score });
    } catch (error) {
      console.error('Error submitting quiz answers:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

  export const submitFeedback = async (req, res) => {
    try {
      const lesson = await Lesson.findById(req.params.id);
      if (!lesson) {
        return res.status(404).json({ message: 'Lecția nu a fost găsită' });
      }
  
      const student = await User.findById(req.user.id).populate('class');
      if (!student || lesson.class.toString() !== student.class._id.toString()) {
        return res.status(403).json({ message: 'Nu aveți acces la această lecție' });
      }
  
      const { feedbackText, rating, isAnonymous } = req.body;
  
      // Validare rating
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating-ul trebuie să fie între 1 și 5' });
      }
  
      // Pregătim datele feedback-ului
      const feedbackData = {
        lesson: lesson._id,
        feedbackText,
        rating,
        isAnonymous,
      };
  
      // Adăugăm studentul doar dacă feedback-ul nu este anonim
      if (!isAnonymous) {
        feedbackData.student = req.user.id;
      }
  
      const feedback = new Feedback(feedbackData);
  
      await feedback.save();
  
      res.json({ message: 'Feedback trimis' });
    } catch (error) {
      console.error('Eroare la trimiterea feedback-ului:', error);
      res.status(500).json({ message: 'Eroare de server' });
    }
  };

  export const markAttendance = async (req, res) => {
    try {
      const lesson = await Lesson.findById(req.params.id);
      if (!lesson) {
        return res.status(404).json({ message: 'Lecția nu a fost găsită' });
      }
  
      const student = await User.findById(req.user.id).populate('class');
      if (!student || lesson.class.toString() !== student.class._id.toString()) {
        return res.status(403).json({ message: 'Nu aveți acces la această lecție' });
      }
  
      const existingAttendance = await Attendance.findOne({
        student: req.user.id,
        lesson: lesson._id,
      });
  
      if (existingAttendance) {
        // Dacă prezența există, o retragem (unmark)
        await Attendance.deleteOne({ _id: existingAttendance._id });
        return res.json({ message: 'Prezența a fost retrasă' });
      }
  
      // Dacă nu există, o marcăm (mark)
      const attendance = new Attendance({
        student: req.user.id,
        lesson: lesson._id,
        attended: true,
      });
  
      await attendance.save();
  
      res.json({ message: 'Prezență marcată' });
    } catch (error) {
      console.error('Eroare la marcarea prezenței:', error);
      res.status(500).json({ message: 'Eroare de server' });
    }
  };

  export const getAttendanceStatus = async (req, res) => {
    try {
      const lesson = await Lesson.findById(req.params.id);
      if (!lesson) {
        return res.status(404).json({ message: 'Lecția nu a fost găsită' });
      }
  
      const student = await User.findById(req.user.id).populate('class');
      if (!student || lesson.class.toString() !== student.class._id.toString()) {
        return res.status(403).json({ message: 'Nu aveți acces la această lecție' });
      }
  
      const attendance = await Attendance.findOne({
        student: req.user.id,
        lesson: lesson._id,
      });
  
      if (attendance) {
        return res.json({ attended: attendance.attended });
      } else {
        return res.json({ attended: false });
      }
    } catch (error) {
      console.error('Eroare la obținerea stării prezenței:', error);
      res.status(500).json({ message: 'Eroare de server' });
    }
  };

