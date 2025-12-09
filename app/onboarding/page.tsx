'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, Edit2, Paperclip } from 'lucide-react';
import { INITIAL_STATE, processNextStep } from '@/lib/onboarding-chat/chatLogic';
import { ChatState } from '@/lib/onboarding-chat/types';
import { OptionCard } from '@/app/components/onboarding-chat/OptionCard';
import { ShareCard } from '@/app/components/onboarding-chat/ShareCard';
import { GoogleAuthButton } from '@/app/components/onboarding-chat/GoogleAuthButton';

export default function OnboardingPage() {
  const [chatState, setChatState] = useState<ChatState>(INITIAL_STATE);
  const [visibleMessageIndex, setVisibleMessageIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const currentMessage = chatState.messages[visibleMessageIndex];
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [visibleMessageIndex]);

  if (!currentMessage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-16 h-16 border-8 border-slate-200 border-t-[#ff5168] rounded-full animate-spin"></div>
      </div>
    );
  }

  const isLastMessage = visibleMessageIndex === chatState.messages.length - 1;
  const progress = Math.min(((visibleMessageIndex + 1) / (chatState.messages.length + 2)) * 100, 100);
  const needsInput = ['text', 'email', 'password', 'phone', 'url', 'textarea'].includes(currentMessage.inputType || '');
  const isOptions = currentMessage.inputType === 'options_only';
  const isShareCard = currentMessage.inputType === 'share_card';
  const isGoogleAuth = currentMessage.inputType === 'google_auth';
  const isSingleOption = currentMessage.options && currentMessage.options.length === 1;

  const handleOptionSelect = (value: string) => {
    if (isProcessing) return;
    setSelectedOption(value);
    setIsProcessing(true);
    setTimeout(() => {
      submitStep(undefined, undefined, value);
    }, 350);
  };

  const handleTextSubmit = () => {
    if (isProcessing) return;
    if (!isInputValid()) return;
    submitStep(textInput, fileInput, selectedOption || undefined);
  };

  const handleBack = () => {
    if (visibleMessageIndex > 0) {
      setVisibleMessageIndex(prev => prev - 1);
    }
  };

  const submitStep = async (txt?: string, file?: File | null, opt?: string) => {
    setIsProcessing(true);

    if (visibleMessageIndex === 1 && opt) {
      const truncatedMessages = chatState.messages.slice(0, 2);
      const resetState: ChatState = {
        ...chatState,
        messages: truncatedMessages,
        currentFlow: 'NONE',
        step: 0,
        formData: {}
      };

      try {
        const nextState = await processNextStep(resetState, null, opt);
        setChatState(prev => ({
          ...prev,
          ...nextState,
          messages: nextState.messages || truncatedMessages
        }));
        setVisibleMessageIndex(prev => prev + 1);
        resetLocalState();
      } catch (error) {
        console.error(error);
      }
      setIsProcessing(false);
      return;
    }

    if (isLastMessage) {
      try {
        const nextState = await processNextStep(chatState, file || txt || null, opt);
        setChatState(prev => ({
          ...prev,
          ...nextState,
          messages: nextState.messages || prev.messages
        }));
        
        if (nextState.messages && nextState.messages.length > chatState.messages.length) {
          setVisibleMessageIndex(prev => prev + 1);
          resetLocalState();
        }
      } catch (error) {
        console.error("Error:", error);
      }
    } else {
      setVisibleMessageIndex(prev => prev + 1);
      resetLocalState();
    }
    setIsProcessing(false);
  };

  const resetLocalState = () => {
    setTextInput('');
    setFileInput(null);
    setSelectedOption(null);
    setIsProcessing(false);
  };

  const isInputValid = () => {
    if (isProcessing) return false;
    if (currentMessage.inputType === 'options_only') return !!selectedOption;
    if (currentMessage.inputType === 'file') return !!fileInput;
    if (needsInput) {
        if (textInput.trim().length === 0) return false;
        
        if (currentMessage.inputType === 'email') {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(textInput);
        }
        
        if (currentMessage.inputType === 'url') {
             // Basic URL validation
             return textInput.includes('.') && textInput.length > 3;
        }

        if (currentMessage.inputType === 'phone') {
             // Basic check: only numbers, spaces, dashes, plus. And at least some digits.
             return /^[\d\s\-+]+$/.test(textInput) && textInput.replace(/\D/g, '').length >= 8;
        }
        
        return true;
    }
    return true;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  // Intro View (Full Screen)
  if (currentMessage.isIntro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6 animate-fade-in font-['Outfit']">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff5168] opacity-20 blur-[100px] rounded-full mix-blend-screen animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#25c9d0] opacity-20 blur-[100px] rounded-full mix-blend-screen animate-pulse-slow delay-700"></div>
        </div>

        <div className="z-10 flex flex-col items-center max-w-lg w-full text-center">
          <div className="mb-8 animate-pop">
            {/* Mascot Removed */}
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-6 leading-tight tracking-tight drop-shadow-sm whitespace-pre-line">
            {currentMessage.text}
          </h1>
          
          {currentMessage.options ? (
             <div className="w-full grid grid-cols-1 gap-3">
                {currentMessage.options.map((opt) => (
                   <OptionCard 
                      key={opt.value}
                      option={opt}
                      selected={selectedOption === opt.value}
                      onClick={() => handleOptionSelect(opt.value)}
                      disabled={isProcessing && selectedOption !== opt.value}
                    />
                ))}
             </div>
          ) : (
            <button 
              onClick={() => submitStep()}
              disabled={isProcessing}
              className="w-full bg-[#ff5168] text-white font-black text-lg py-4 rounded-xl shadow-[0_6px_0_0_#d64154] hover:bg-[#e63e54] hover:shadow-[0_4px_0_0_#d64154] active:shadow-none active:translate-y-[6px] transition-all uppercase tracking-wider"
            >
              {isProcessing ? 'Thinking...' : 'CONTINUE'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-['Outfit'] text-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur-md border-b-2 border-slate-200 px-4 py-3 md:px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          {visibleMessageIndex > 0 ? (
            <button 
              onClick={handleBack}
              disabled={isProcessing}
              className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-200 rounded-xl"
            >
              <ArrowLeft size={20} strokeWidth={3} />
            </button>
          ) : (
            <div className="w-9"></div>
          )}
          
          <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden p-1">
            <div 
              className="h-full bg-[#ff5168] rounded-full transition-all duration-700 ease-out shadow-sm relative overflow-hidden" 
              style={{ width: `${Math.max(5, progress)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-4 py-2 md:py-4 min-h-[50vh] md:min-h-[calc(100vh-140px)] flex flex-col justify-center">
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center justify-center mb-4 md:mb-6 animate-fade-in">
            {/* Mascot Removed */}
            
            <div className="text-center md:text-left max-w-2xl">
              <h2 className="text-xl md:text-3xl font-black text-slate-800 leading-tight mb-2 whitespace-pre-line">
                {currentMessage.text}
              </h2>
            </div>
          </div>

          <div className="w-full animate-fade-in delay-75">
            {isOptions && currentMessage.options && (
              <div className={`
                w-full gap-3 lg:gap-4
                ${isSingleOption ? 'flex justify-center' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}
              `}>
                {currentMessage.options.map((opt) => (
                  <div key={opt.value} className={isSingleOption ? 'w-full max-w-xl' : 'contents'}>
                    <OptionCard 
                      option={opt}
                      selected={selectedOption === opt.value}
                      onClick={() => handleOptionSelect(opt.value)}
                      disabled={isProcessing && selectedOption !== opt.value}
                    />
                  </div>
                ))}
              </div>
            )}

            {isShareCard && <ShareCard />}

            {isGoogleAuth && <GoogleAuthButton disabled={isProcessing} />}

            {needsInput && currentMessage.inputType !== 'textarea' && (
              <div className="relative group max-w-3xl mx-auto">
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type={currentMessage.inputType === 'phone' ? 'tel' : currentMessage.inputType === 'email' ? 'email' : currentMessage.inputType === 'password' ? 'password' : 'text'}
                  className="w-full p-4 md:p-5 text-xl md:text-2xl font-bold border-[3px] border-slate-200 rounded-xl focus:border-[#25c9d0] focus:bg-white bg-slate-100 outline-none transition-all placeholder-slate-300 text-slate-800 shadow-sm focus:shadow-[0_4px_0_0_#25c9d0]"
                  placeholder={currentMessage.inputType === 'password' ? 'Enter your password...' : currentMessage.inputType === 'phone' ? 'Enter numbers only...' : 'Type here...'}
                  value={textInput}
                  onChange={(e) => {
                      if (currentMessage.inputType === 'phone') {
                          // Allow digits, spaces, dashes, plus
                          const val = e.target.value;
                          if (/^[\d\s\-+]*$/.test(val)) {
                              setTextInput(val);
                          }
                      } else {
                          setTextInput(e.target.value);
                      }
                  }}
                  onKeyDown={handleKeyDown}
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-[#25c9d0] transition-colors">
                  <Edit2 size={20} />
                </div>
                {currentMessage.inputType === 'phone' && (
                   <p className="text-center text-slate-400 mt-2 text-sm font-bold uppercase tracking-wide">Enter country code (e.g. +971...)</p>
                )}
              </div>
            )}

            {currentMessage.inputType === 'textarea' && (
              <div className="relative group max-w-3xl mx-auto">
                <textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  rows={4}
                  className="w-full p-4 md:p-5 text-lg md:text-xl font-medium border-[3px] border-slate-200 rounded-xl focus:border-[#25c9d0] focus:bg-white bg-slate-100 outline-none transition-all placeholder-slate-300 resize-none text-slate-800 shadow-sm focus:shadow-[0_4px_0_0_#25c9d0]"
                  placeholder="Tell us about the project requirement"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) e.preventDefault(); }}
                />
              </div>
            )}

            {currentMessage.inputType === 'file' && (
              <label className={`
                flex flex-col items-center justify-center w-full h-56 border-[3px] border-dashed rounded-2xl cursor-pointer transition-all group relative overflow-hidden max-w-3xl mx-auto
                ${fileInput ? 'border-[#25c9d0] bg-teal-50' : 'border-slate-300 bg-slate-100 hover:bg-white hover:border-slate-400 hover:shadow-lg'}
              `}>
                <div className="z-10 flex flex-col items-center justify-center pt-5 pb-6">
                  <div className={`p-4 rounded-xl mb-3 transition-colors ${
                    fileInput ? 'bg-white text-[#25c9d0] shadow-sm' : 'bg-slate-200 text-slate-400 group-hover:bg-[#ff5168] group-hover:text-white'
                  }`}>
                    <Paperclip size={32} strokeWidth={2.5} />
                  </div>
                  <p className="mb-2 text-lg font-bold text-slate-600">
                    {fileInput ? <span className="text-[#25c9d0]">{fileInput.name}</span> : <span>Upload Document</span>}
                  </p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {fileInput ? 'Click to change' : 'Drag & Drop or Click'}
                  </p>
                </div>
                <input 
                    type="file" 
                    className="hidden" 
                    accept="application/pdf"
                    onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            setFileInput(e.target.files[0]);
                        }
                    }} 
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      {!isOptions && !isShareCard && !isGoogleAuth && (
        <div className="border-t-2 border-slate-200 bg-white p-3 md:p-5 pb-6 z-20">
          <div className="max-w-3xl mx-auto flex justify-between items-center">
            <div className="hidden md:block">
              {needsInput && textInput.length === 0 && (
                <span className="text-slate-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  Required
                </span>
              )}
              {needsInput && textInput.length > 0 && (
                <span className="text-slate-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2 animate-pulse">
                  Press <span className="border border-slate-300 px-1 rounded text-xs bg-slate-50">Enter ↵</span>
                </span>
              )}
            </div>
            
            <button 
              onClick={() => handleTextSubmit()}
              disabled={!isInputValid() || isProcessing}
              className={`
                w-full md:w-auto px-8 py-3 md:px-10 md:py-4 rounded-xl font-black text-lg tracking-wider uppercase transition-all flex items-center justify-center gap-3
                ${isInputValid() && !isProcessing
                  ? 'bg-[#ff5168] text-white shadow-[0_5px_0_0_#d64154] hover:bg-[#e63e54] hover:shadow-[0_4px_0_0_#d64154] active:shadow-none active:translate-y-[5px]'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }
              `}
            >
              {isProcessing ? 'WAITING...' : (isLastMessage && needsInput ? 'SUBMIT' : 'CONTINUE')}
              {!isProcessing && <ArrowRight size={20} strokeWidth={3} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
