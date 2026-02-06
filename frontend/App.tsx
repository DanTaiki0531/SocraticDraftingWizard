import { useState } from 'react';
import { HomePage } from './components/HomePage';
import { ChatInterface } from './components/ChatInterface';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultPreview } from './components/ResultPreview';
import { CustomizeQuestions } from './components/CustomizeQuestions';
import { QuestionEditor } from './components/QuestionEditor';
import {
  fetchQuestions,
  generateMarkdown as apiGenerateMarkdown,
  updateQuestions as apiUpdateQuestions,
  Question,
  ResponseItem,
} from './lib/api';

type Screen = 'home' | 'chat' | 'loading' | 'result' | 'customize' | 'edit-questions';
type Category = 'academic' | 'technical' | 'custom' | null;

interface Message {
  type: 'system' | 'user';
  content: string;
}

interface QuestionWithAnswer {
  id: string;
  text: string;
  answer: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionsWithAnswers, setQuestionsWithAnswers] = useState<QuestionWithAnswer[]>([]);
  const [generatedMarkdown, setGeneratedMarkdown] = useState('');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category>(null);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch questions when category is selected
  const loadQuestions = async (category: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const questions = await fetchQuestions(category);
      setCurrentQuestions(questions);
      return questions;
    } catch (err) {
      setError('質問の読み込みに失敗しました');
      console.error(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = async (category: Category) => {
    if (!category) return;

    const questions = await loadQuestions(category);
    if (questions.length === 0) return;

    setSelectedCategory(category);
    setCurrentScreen('chat');
    setMessages([
      {
        type: 'system',
        content: questions[0].text
      }
    ]);
    setCurrentQuestionIndex(0);
    setQuestionsWithAnswers([]);
  };

  const handleCustomize = () => {
    setCurrentScreen('customize');
  };

  const handleEditCategory = async (category: Category) => {
    if (!category) return;
    await loadQuestions(category);
    setEditingCategory(category);
    setCurrentScreen('edit-questions');
  };

  const handleSaveQuestions = async (category: Category, questions: string[]) => {
    if (!category) return;

    try {
      setIsLoading(true);
      const questionUpdates = questions.map((text, index) => ({
        id: currentQuestions[index]?.id || crypto.randomUUID(),
        text,
        order_index: index
      }));

      await apiUpdateQuestions(category, { questions: questionUpdates });
      setCurrentScreen('customize');
    } catch (err) {
      setError('質問の保存に失敗しました');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCustomChat = async (questions: string[], categoryName: string) => {
    setCustomCategoryName(categoryName);
    setSelectedCategory('custom');

    // Convert to Question format
    const customQs: Question[] = questions.map((text, index) => ({
      id: `custom-${index}`,
      text,
      order_index: index
    }));
    setCurrentQuestions(customQs);

    setCurrentScreen('chat');
    setMessages([
      {
        type: 'system',
        content: questions[0]
      }
    ]);
    setCurrentQuestionIndex(0);
    setQuestionsWithAnswers([]);
  };

  const handleSendMessage = async (userMessage: string) => {
    const currentQuestion = currentQuestions[currentQuestionIndex];

    const newMessages = [
      ...messages,
      { type: 'user' as const, content: userMessage }
    ];

    const newQuestionsWithAnswers = [
      ...questionsWithAnswers,
      {
        id: currentQuestion.id,
        text: currentQuestion.text,
        answer: userMessage
      }
    ];
    setQuestionsWithAnswers(newQuestionsWithAnswers);

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < currentQuestions.length) {
      newMessages.push({
        type: 'system',
        content: currentQuestions[nextIndex].text
      });
      setMessages(newMessages);
      setCurrentQuestionIndex(nextIndex);
    } else {
      setMessages(newMessages);
      setCurrentScreen('loading');

      try {
        // Call API to generate markdown
        const answers: ResponseItem[] = newQuestionsWithAnswers.map(qa => ({
          question_id: qa.id,
          text: qa.text,
          answer: qa.answer
        }));

        const response = await apiGenerateMarkdown({
          category_id: selectedCategory!,
          answers
        });

        setGeneratedMarkdown(response.markdown);
        setCurrentScreen('result');
      } catch (err) {
        setError('Markdownの生成に失敗しました');
        console.error(err);
        setCurrentScreen('home');
      }
    }
  };

  const handleReset = () => {
    setCurrentScreen('home');
    setSelectedCategory(null);
    setMessages([]);
    setCurrentQuestionIndex(0);
    setQuestionsWithAnswers([]);
    setGeneratedMarkdown('');
    setCurrentQuestions([]);
    setCustomCategoryName('');
    setError(null);
  };

  const handleGoHome = () => {
    handleReset();
  };

  return (
    <div className="min-h-screen bg-theme-bg">
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {error}
          <button onClick={() => setError(null)} className="ml-4 font-bold">×</button>
        </div>
      )}

      {currentScreen === 'home' && (
        <HomePage
          onSelectCategory={handleCategorySelect}
          onCustomize={handleCustomize}
        />
      )}
      {currentScreen === 'customize' && (
        <CustomizeQuestions
          onSelectCategory={handleEditCategory}
          onBack={() => setCurrentScreen('home')}
          onGoHome={handleGoHome}
        />
      )}
      {currentScreen === 'edit-questions' && editingCategory && (
        <QuestionEditor
          category={editingCategory}
          questions={currentQuestions.map(q => q.text)}
          onSave={(questions) => handleSaveQuestions(editingCategory, questions)}
          onBack={() => setCurrentScreen('customize')}
          onGoHome={handleGoHome}
        />
      )}
      {currentScreen === 'chat' && (
        <ChatInterface
          messages={messages}
          currentQuestion={currentQuestionIndex}
          totalQuestions={currentQuestions.length}
          onSendMessage={handleSendMessage}
          category={selectedCategory!}
          categoryName={selectedCategory === 'custom' && customCategoryName ? customCategoryName : undefined}
          onGoHome={handleGoHome}
        />
      )}
      {currentScreen === 'loading' && <LoadingScreen />}
      {currentScreen === 'result' && (
        <ResultPreview
          markdown={generatedMarkdown}
          onReset={handleReset}
          onGoHome={handleGoHome}
        />
      )}
    </div>
  );
}