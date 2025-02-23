"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { IAzkarEntry } from "./../app/page";

interface SurahName {
  surah_id: string;
  arabic: string;
  english: string;
  кыргыз: string;
  русский: string;
}

interface ChallengeQuestion {
  audioSrc: string;
  correctTranslation: string;
  options: string[];
  surahId: string;
  lineArabic: string;
  startTime: number;
  endTime: number;
}

interface ChallengeProps {
  surahs: IAzkarEntry[];
  language: string;
  surahNames: SurahName[];
  onClose: () => void;
}

export default function Challenge({
  surahs,
  language,
  surahNames,
  onClose,
}: ChallengeProps) {
  const [selectedSurahs, setSelectedSurahs] = useState<string[]>([]);
  const [challengeStarted, setChallengeStarted] = useState(false);
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showArabic, setShowArabic] = useState<boolean[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const handleSurahToggle = useCallback((surahId: string) => {
    setSelectedSurahs((prev) =>
      prev.includes(surahId)
        ? prev.filter((id) => id !== surahId)
        : [...prev, surahId]
    );
  }, []);

  const generateQuestions = useCallback(() => {
    const filteredSurahs = surahs.filter((surah) =>
      selectedSurahs.includes(surah.id)
    );
    const allLines = filteredSurahs.flatMap((surah) =>
      surah.lines.map((line, idx) => ({
        surahId: surah.id,
        line,
        startTime: line.timestamp || 0,
        endTime: surah.lines[idx + 1]?.timestamp || Infinity,
      }))
    );
    const totalLines = allLines.length;
    const questionCount = Math.min(totalLines, 7); // Use total lines if < 7, otherwise 7
    const shuffledLines = allLines
      .sort(() => Math.random() - 0.5)
      .slice(0, questionCount);
    const allTranslations = allLines.map(
      (item) => item.line.translations[language]
    );

    const newQuestions = shuffledLines.map((item) => {
      const correctTranslation = item.line.translations[language];
      const otherOptions = allTranslations
        .filter((t) => t !== correctTranslation)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const options = [correctTranslation, ...otherOptions].sort(
        () => Math.random() - 0.5
      );
      return {
        audioSrc: `/audio/${item.surahId}.mp3`,
        correctTranslation,
        options,
        surahId: item.surahId,
        lineArabic: item.line.arabic,
        startTime: item.startTime,
        endTime: item.endTime === Infinity ? 9999 : item.endTime,
      };
    });

    setQuestions(newQuestions);
    setUserAnswers(new Array(newQuestions.length).fill(""));
    setShowArabic(new Array(newQuestions.length).fill(false));
    setChallengeStarted(true);
  }, [surahs, selectedSurahs, language]);

  const handleAnswerChange = useCallback((index: number, answer: string) => {
    setUserAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[index] = answer;
      return newAnswers;
    });
  }, []);

  const toggleShowArabic = useCallback((index: number) => {
    setShowArabic((prev) => {
      const newShowArabic = [...prev];
      newShowArabic[index] = !newShowArabic[index];
      return newShowArabic;
    });
  }, []);

  const timeupdateHandlers = useRef<Map<HTMLAudioElement, () => void>>(
    new Map()
  );

  const playAudio = useCallback(
    (index: number) => {
      // Clean up existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        const handler = timeupdateHandlers.current.get(audioRef.current);
        if (handler) {
          audioRef.current.removeEventListener("timeupdate", handler);
          timeupdateHandlers.current.delete(audioRef.current);
        }
        audioRef.current = null;
      }

      const { audioSrc, startTime, endTime } = questions[index];
      audioRef.current = new Audio(audioSrc);
      audioRef.current.currentTime = startTime;

      const playPromise = audioRef.current.play();
      playPromise
        .then(() => {
          setAudioPlaying(index);
        })
        .catch((err) => console.error("Audio play error:", err));

      const checkTime = () => {
        if (audioRef.current && audioRef.current.currentTime >= endTime) {
          audioRef.current.pause();
          setAudioPlaying(null);
        }
      };
      audioRef.current.addEventListener("timeupdate", checkTime);
      timeupdateHandlers.current.set(audioRef.current, checkTime); // Store handler reference
      audioRef.current.onended = () => setAudioPlaying(null);
    },
    [questions]
  );

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setAudioPlaying(null);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    setIsSubmitted(true);
    setShowArabic(new Array(questions.length).fill(true));
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth" });
    }
    if (audioRef.current) {
      audioRef.current.pause();
      setAudioPlaying(null);
    }
  }, [questions.length]);

  const results = useMemo(() => {
    if (!isSubmitted) return null;
    let correctCount = 0;
    questions.forEach((q, i) => {
      if (userAnswers[i] === q.correctTranslation) correctCount++;
    });
    return { correct: correctCount, total: questions.length };
  }, [isSubmitted, questions, userAnswers]);

  const resetChallenge = useCallback(() => {
    setChallengeStarted(false);
    setQuestions([]);
    setUserAnswers([]);
    setShowArabic([]);
    setIsSubmitted(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setAudioPlaying(null);
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="p-4 bg-[var(--card-bg)] rounded-lg shadow-lg">
      <div ref={topRef} />
      {!challengeStarted ? (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-[var(--card-text)]">
            Select Surahs for Challenge
          </h2>
          <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
            {surahs.map((surah) => {
              const surahName = surahNames.find((s) => s.surah_id === surah.id);
              return (
                <div key={surah.id} className="flex items-center gap-2">
                  <Checkbox
                    id={surah.id}
                    checked={selectedSurahs.includes(surah.id)}
                    onCheckedChange={() => handleSurahToggle(surah.id)}
                  />
                  <label htmlFor={surah.id} className="text-[var(--card-text)]">
                    {surahName
                      ? surahName[language as keyof SurahName] ||
                        surahName.arabic
                      : surah.id}
                  </label>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={generateQuestions}
              disabled={selectedSurahs.length < 1}
              className="bg-[#606c38] text-white hover:bg-[#606c38]/90"
            >
              Start Challenge
            </Button>
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {isSubmitted && results && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500 rounded">
              <p className="text-lg font-semibold text-green-600">
                Results: {results.correct} / {results.total} correct
              </p>
            </div>
          )}
          <h2 className="text-2xl font-bold mb-4 text-[var(--card-text)]">
            Surah Challenge
          </h2>
          {questions.map((q, index) => (
            <div
              key={index}
              className="mb-6 p-4 border rounded bg-[var(--card-bg)]"
            >
              <p className="text-lg font-semibold text-[var(--card-text)]">
                Question {index + 1}: Play the audio and guess the meaning
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  onClick={() => playAudio(index)}
                  className="bg-[#606c38] text-white hover:bg-[#606c38]/90"
                  disabled={audioPlaying === index}
                >
                  Play Audio
                </Button>
                {audioPlaying === index && (
                  <Button
                    onClick={pauseAudio}
                    className="bg-gray-500 text-white hover:bg-gray-500/90"
                  >
                    Pause
                  </Button>
                )}
              </div>
              {(showArabic[index] || isSubmitted) && (
                <p
                  className="mt-2 text-xl quran-font text-right text-[var(--card-text)]"
                  dir="rtl"
                >
                  {q.lineArabic}
                </p>
              )}
              {!isSubmitted && (
                <Button
                  onClick={() => toggleShowArabic(index)}
                  variant="outline"
                  className="mt-2"
                >
                  {showArabic[index] ? "Hide Arabic" : "Show Arabic"}
                </Button>
              )}
              <div className="mt-4">
                {q.options.map((option, optIndex) => {
                  const isCorrect = option === q.correctTranslation;
                  const isSelected = userAnswers[index] === option;
                  const optionStyle = isSubmitted
                    ? isCorrect
                      ? "bg-green-500/20 border-green-500"
                      : isSelected
                      ? "bg-red-500/20 border-red-500"
                      : ""
                    : "";

                  return (
                    <div
                      key={optIndex}
                      className="flex items-center gap-2 mb-2"
                    >
                      <input
                        type="radio"
                        id={`q${index}-opt${optIndex}`}
                        name={`q${index}`}
                        value={option}
                        checked={userAnswers[index] === option}
                        onChange={() => handleAnswerChange(index, option)}
                        disabled={isSubmitted}
                        className="cursor-pointer"
                      />
                      <label
                        htmlFor={`q${index}-opt${optIndex}`}
                        className={`text-[var(--card-text)] p-2 rounded border ${optionStyle}`}
                      >
                        {option}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            {!isSubmitted ? (
              <Button
                onClick={handleSubmit}
                disabled={userAnswers.some((answer) => !answer)}
                className="bg-[#606c38] text-white hover:bg-[#606c38]/90"
              >
                Submit
              </Button>
            ) : (
              <Button
                onClick={resetChallenge}
                className="bg-[#606c38] text-white hover:bg-[#606c38]/90"
              >
                Try Again
              </Button>
            )}
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
