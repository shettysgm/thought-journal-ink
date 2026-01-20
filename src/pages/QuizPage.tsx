import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Brain, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDistortions } from '@/store/useDistortions';
import { QuizQuestion, QuizResult } from '@/types';

export default function QuizPage() {
  const { loadDistortions, generateQuizQuestions } = useDistortions();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    const initializeQuiz = async () => {
      await loadDistortions();
      const quizQuestions = generateQuizQuestions(5);
      setQuestions(quizQuestions);
    };
    
    initializeQuiz();
  }, [loadDistortions, generateQuizQuestions]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNext = () => {
    const newAnswers = [...userAnswers, selectedAnswer];
    setUserAnswers(newAnswers);
    setShowResult(true);

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer('');
        setShowResult(false);
      } else {
        // Quiz completed
        const correctAnswers = questions.reduce((count, question, index) => {
          return count + (newAnswers[index] === question.correctAnswer ? 1 : 0);
        }, 0);

        setResult({
          score: correctAnswers,
          total: questions.length,
          completedAt: new Date().toISOString()
        });
        setQuizCompleted(true);
      }
    }, 2000);
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setShowResult(false);
    setUserAnswers([]);
    setQuizCompleted(false);
    setResult(null);
    const quizQuestions = generateQuizQuestions(5);
    setQuestions(quizQuestions);
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return 'text-warning';
    return 'text-destructive';
  };

  if (questions.length === 0) {
    return (
      <div 
        className="min-h-screen bg-white px-4 md:px-6 pt-14 pb-6"
        style={{ 
          paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top, 20px) + 1rem))',
          paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))'
        }}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <header className="flex items-center gap-4 mt-2">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">CBT Quiz</h1>
              <p className="text-muted-foreground">Practice identifying cognitive distortions</p>
            </div>
          </header>

          <Card className="shadow-medium">
            <CardContent className="p-8 text-center">
              <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Not Enough Data</h3>
              <p className="text-muted-foreground mb-4">
                You need to journal more to generate quiz questions from your own thought patterns.
              </p>
              <Link to="/">
                <Button>Start Journaling</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (quizCompleted && result) {
    return (
      <div 
        className="min-h-screen bg-white px-4 md:px-6 pt-14 pb-6"
        style={{ 
          paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top, 20px) + 1rem))',
          paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))'
        }}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <header className="flex items-center gap-4 mt-2">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Quiz Complete!</h1>
              <p className="text-muted-foreground">Here's how you did</p>
            </div>
          </header>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-center">Your Results</CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center space-y-6">
              <div className={`text-6xl font-bold ${getScoreColor(result.score, result.total)}`}>
                {result.score}/{result.total}
              </div>
              <p className="text-xl text-muted-foreground">
                {result.score === result.total && "Perfect! "}
                {result.score >= result.total * 0.8 && result.score < result.total && "Great job! "}
                {result.score >= result.total * 0.6 && result.score < result.total * 0.8 && "Good work! "}
                {result.score < result.total * 0.6 && "Keep practicing! "}
                You correctly identified {result.score} out of {result.total} distortions.
              </p>
              
              <div className="flex gap-4 justify-center">
                <Button onClick={resetQuiz} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </Button>
                <Link to="/insights">
                  <Button variant="outline">View Insights</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Review answers */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Review Your Answers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.map((question, index) => {
                const userAnswer = userAnswers[index];
                const isCorrect = userAnswer === question.correctAnswer;
                
                return (
                  <div key={question.id} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium mb-2">"{question.phrase}"</p>
                        <p className="text-sm text-muted-foreground">
                          Your answer: <span className={isCorrect ? 'text-success' : 'text-destructive'}>{userAnswer}</span>
                        </p>
                        {!isCorrect && (
                          <p className="text-sm text-muted-foreground">
                            Correct answer: <span className="text-success">{question.correctAnswer}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-white px-4 md:px-6 pt-14 pb-6"
      style={{ 
        paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top, 20px) + 1rem))',
        paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))'
      }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex items-center gap-4 mt-2">
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">CBT Quiz</h1>
            <p className="text-muted-foreground">Practice identifying cognitive distortions</p>
          </div>
        </header>

        {/* Progress */}
        <Card className="shadow-medium">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Question */}
        {currentQuestion && (
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>What type of cognitive distortion is this?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Question phrase */}
              <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
                <p className="text-lg italic">"{currentQuestion.phrase}"</p>
              </div>

              {/* Answer options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={showResult}
                    className={`w-full p-4 text-left border rounded-lg transition-all ${
                      selectedAnswer === option
                        ? showResult
                          ? option === currentQuestion.correctAnswer
                            ? 'bg-success/10 border-success text-success'
                            : 'bg-destructive/10 border-destructive text-destructive'
                          : 'bg-primary/10 border-primary'
                        : showResult && option === currentQuestion.correctAnswer
                        ? 'bg-success/10 border-success text-success'
                        : 'bg-card border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {showResult && (
                        <>
                          {option === currentQuestion.correctAnswer ? (
                            <CheckCircle className="w-5 h-5 text-success" />
                          ) : selectedAnswer === option ? (
                            <XCircle className="w-5 h-5 text-destructive" />
                          ) : null}
                        </>
                      )}
                      <span className="font-medium">{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Explanation */}
              {showResult && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Explanation:</strong> {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Next button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  disabled={!selectedAnswer || showResult}
                  className="min-w-24"
                >
                  {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
                </Button>
              </div>
              
            </CardContent>
          </Card>
        )}
        
      </div>
    </div>
  );
}