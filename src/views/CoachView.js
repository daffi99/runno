import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useMemo } from 'react';
import { storageService } from '../services/storage';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { WorkoutCard } from '../components/plan/WorkoutCard';
import { PlanCard } from '../components/plan/PlanCard';
import { QuickPlanModal } from '../components/plan/QuickPlanModal';
import { formatDistance, formatFullWorkoutDate, formatWeekRange } from '../utils/formatters';
import { Sparkles, Calendar, Send, CheckCircle2, Footprints, Target, MessageSquare, Sliders, Trash2, Plus, } from 'lucide-react';
import { clsx } from 'clsx';
const DEFAULT_WELCOME_MESSAGE = {
    id: 'msg_welcome',
    role: 'assistant',
    content: `Hey! What running goal or schedule are you thinking about right now?\n\nTell me the days you like to get out there (like Tue, Thu, Sat), what pace or target you have in mind, or how your recent runs have been feeling. We can talk through what works best for you!`,
    timestamp: new Date().toISOString(),
};
const renderFormattedMessage = (content, isUser, isTyping) => {
    if (!content && isTyping) {
        return (_jsx("div", { className: "flex items-center space-x-1 py-0.5", children: _jsx("span", { className: "inline-block w-2 h-4 bg-[#FF5500] rounded-xs animate-pulse" }) }));
    }
    const lines = content.split('\n');
    return (_jsx("div", { className: "space-y-1.5 leading-relaxed", children: lines.map((line, idx) => {
            const isLastLine = idx === lines.length - 1;
            const trimmed = line.trim();
            if (!trimmed) {
                return (_jsx("div", { className: "h-1 flex items-center", children: isLastLine && isTyping && (_jsx("span", { className: "inline-block w-2 h-4 bg-[#FF5500] rounded-xs animate-pulse" })) }, idx));
            }
            const renderInline = (text) => {
                const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
                return (_jsxs(_Fragment, { children: [parts.map((part, pIdx) => {
                            if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
                                const inner = part.slice(2, -2);
                                return (_jsx("strong", { className: clsx('font-bold', isUser ? 'text-white' : 'text-neutral-900'), children: inner }, pIdx));
                            }
                            if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                                const inner = part.slice(1, -1);
                                return (_jsx("em", { className: "italic opacity-90", children: inner }, pIdx));
                            }
                            return part;
                        }), isLastLine && isTyping && (_jsx("span", { className: "inline-block w-2 h-4 bg-[#FF5500] ml-1 rounded-xs animate-pulse align-middle" }))] }));
            };
            // Bullet point
            if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
                const bulletText = trimmed.replace(/^[-•*]\s+/, '');
                return (_jsxs("div", { className: "flex items-start space-x-2 pl-1", children: [_jsx("span", { className: clsx('text-xs mt-0.5', isUser ? 'text-white/80' : 'text-[#FF5500]'), children: "\u2022" }), _jsx("span", { className: "flex-1", children: renderInline(bulletText) })] }, idx));
            }
            // Numbered list (e.g. 1. 2.)
            const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
            if (numMatch) {
                return (_jsxs("div", { className: "flex items-start space-x-2 pl-1", children: [_jsxs("span", { className: clsx('text-[11px] font-bold mt-0.5 w-4 shrink-0', isUser ? 'text-white/80' : 'text-[#FF5500]'), children: [numMatch[1], "."] }), _jsx("span", { className: "flex-1", children: renderInline(numMatch[2]) })] }, idx));
            }
            return _jsx("p", { children: renderInline(line) }, idx);
        }) }));
};
export const CoachView = ({ runs, unitSystem, onNavigateAddRun, onSelectRun, customApiKey, }) => {
    const [activeTab, setActiveTab] = useState('schedule');
    const [activePlan, setActivePlan] = useState(storageService.getActivePlan());
    const [messages, setMessages] = useState(() => {
        const saved = storageService.getCoachMessages();
        if (saved.length === 0)
            return [DEFAULT_WELCOME_MESSAGE];
        // Replace old robotic greeting if present in local storage
        if (saved[0]?.id === 'msg_welcome' && (saved[0].content.includes('Coach Runno') || saved[0].content.includes('personal AI'))) {
            const updated = [...saved];
            updated[0] = DEFAULT_WELCOME_MESSAGE;
            storageService.saveCoachMessages(updated);
            return updated;
        }
        return saved;
    });
    const [inputPrompt, setInputPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [typingMessageId, setTypingMessageId] = useState(null);
    const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
    const [appliedPlanToast, setAppliedPlanToast] = useState(null);
    const chatEndRef = useRef(null);
    const chatInputRef = useRef(null);
    const typingIntervalRef = useRef(null);
    // Clean up typing animation on unmount
    useEffect(() => {
        return () => {
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
            }
        };
    }, []);
    // Stream assistant reply one word at a time
    const streamTextWordByWord = (msgId, fullText, suggestedPlan) => {
        const tokens = fullText.split(/(\s+)/);
        let currentIndex = 0;
        let accumulated = '';
        setTypingMessageId(msgId);
        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
        }
        typingIntervalRef.current = setInterval(() => {
            if (currentIndex >= tokens.length) {
                clearInterval(typingIntervalRef.current);
                typingIntervalRef.current = null;
                setTypingMessageId(null);
                setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content: fullText, suggestedPlan } : m));
                return;
            }
            accumulated += tokens[currentIndex];
            currentIndex++;
            setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content: accumulated } : m));
        }, 22);
    };
    // Sync plan from server and match completion with run log on mount and runs update
    useEffect(() => {
        storageService.syncActivePlanWithServer().then((synced) => {
            const base = synced || activePlan;
            if (base) {
                const syncedWithRuns = storageService.syncPlanWithRuns(runs);
                if (syncedWithRuns)
                    setActivePlan(syncedWithRuns);
            }
        });
    }, [runs]);
    // Save messages on update (only when not actively typing partial words)
    useEffect(() => {
        if (!typingMessageId) {
            storageService.saveCoachMessages(messages);
        }
    }, [messages, typingMessageId]);
    // Auto scroll chat to bottom
    useEffect(() => {
        if (activeTab === 'chat') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, activeTab, typingMessageId]);
    // Today's day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const currentDayOfWeek = new Date().getDay();
    // Find today's workout in the active plan
    const todayWorkout = useMemo(() => {
        if (!activePlan)
            return null;
        return activePlan.workouts.find((w) => w.dayOfWeek === currentDayOfWeek) || null;
    }, [activePlan, currentDayOfWeek]);
    // Weekly progress calculation
    const weeklyProgress = useMemo(() => {
        if (!activePlan)
            return { completedKm: 0, targetKm: 0, percent: 0, completedCount: 0, totalWorkouts: 0 };
        const runningWorkouts = activePlan.workouts.filter((w) => w.type !== 'rest' && w.distanceKm > 0);
        const completedWorkouts = runningWorkouts.filter((w) => w.completed);
        const completedKm = completedWorkouts.reduce((acc, w) => acc + w.distanceKm, 0);
        const targetKm = activePlan.weeklyTargetKm || runningWorkouts.reduce((acc, w) => acc + w.distanceKm, 0);
        const percent = targetKm > 0 ? Math.min(100, Math.round((completedKm / targetKm) * 100)) : 0;
        return {
            completedKm,
            targetKm,
            percent,
            completedCount: completedWorkouts.length,
            totalWorkouts: runningWorkouts.length,
        };
    }, [activePlan]);
    const handleToggleWorkout = (workoutId) => {
        const updated = storageService.toggleWorkoutCompletion(workoutId);
        if (updated) {
            setActivePlan({ ...updated });
        }
    };
    const handleApplyPlan = (planToApply) => {
        const newActivePlan = {
            ...planToApply,
            status: 'active',
            updatedAt: new Date().toISOString(),
        };
        storageService.saveActivePlan(newActivePlan);
        setActivePlan(newActivePlan);
        setAppliedPlanToast(`Applied "${newActivePlan.title}" to your schedule!`);
        setTimeout(() => {
            setAppliedPlanToast(null);
            setActiveTab('schedule');
        }, 1500);
    };
    const handleSendMessage = async (userText) => {
        const trimmed = userText.trim();
        if (!trimmed || isLoading)
            return;
        const userMsg = {
            id: `msg_user_${Date.now()}`,
            role: 'user',
            content: trimmed,
            timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setInputPrompt('');
        setIsLoading(true);
        try {
            const payload = {
                message: trimmed,
                history: messages.slice(-30),
                currentPlan: activePlan,
                runnerContext: {
                    recentRuns: runs.slice(0, 10),
                    unitSystem,
                },
                customApiKey,
            };
            const res = await fetch('/api/ai-coach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                let errDetail = `API error (${res.status})`;
                try {
                    const errData = await res.json();
                    if (errData.error)
                        errDetail = errData.error;
                }
                catch (_) { }
                throw new Error(errDetail);
            }
            const data = await res.json();
            const fullReply = data.reply || "Here is what I've prepared for you:";
            const plan = data.suggestedPlan || null;
            const assistantMsgId = `msg_asst_${Date.now()}`;
            // Insert assistant message placeholder
            const initialAssistantMsg = {
                id: assistantMsgId,
                role: 'assistant',
                content: '',
                timestamp: new Date().toISOString(),
                suggestedPlan: null,
            };
            setMessages((prev) => [...prev, initialAssistantMsg]);
            setIsLoading(false);
            // Stream text word-by-word in real time
            streamTextWordByWord(assistantMsgId, fullReply, plan);
        }
        catch (err) {
            console.error('[Runno Coach] Error sending message:', err);
            const errorMsg = {
                id: `msg_err_${Date.now()}`,
                role: 'assistant',
                content: `Sorry, I encountered an issue connecting to the coaching engine: ${err.message}. Please check your connection or OpenRouter API key in More > Settings.`,
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMsg]);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleQuickModalGenerate = (params) => {
        setIsQuickModalOpen(false);
        setActiveTab('chat');
        const prompt = `Create a running plan for ${params.selectedDays.join(', ')} targeting ${params.goal} (${params.level} level).`;
        handleSendMessage(prompt);
    };
    const handleClearChat = () => {
        if (confirm('Clear coach conversation history?')) {
            storageService.clearCoachChat();
            setMessages([DEFAULT_WELCOME_MESSAGE]);
        }
    };
    const handleClearPlan = () => {
        if (confirm('Are you sure you want to remove the current active training plan?')) {
            storageService.saveActivePlan(null);
            setActivePlan(null);
        }
    };
    return (_jsxs("div", { className: "max-w-md mx-auto px-4 pt-4 pb-28 space-y-4", children: [appliedPlanToast && (_jsxs("div", { className: "fixed top-5 left-4 right-4 max-w-md mx-auto z-50 p-3.5 rounded-2xl bg-neutral-900 text-white flex items-center space-x-2.5 shadow-2xl animate-in slide-in-from-top duration-200", children: [_jsx(CheckCircle2, { className: "w-5 h-5 text-emerald-400 shrink-0" }), _jsx("span", { className: "text-xs font-bold", children: appliedPlanToast })] })), _jsxs("div", { className: "flex items-center justify-between pt-2", children: [_jsxs("div", { className: "flex items-center space-x-2.5", children: [_jsx("div", { className: "w-9 h-9 rounded-2xl bg-orange-50 text-[#FF5500] flex items-center justify-center shadow-soft-xs", children: _jsx(Sparkles, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-black text-neutral-900 tracking-tight", children: "AI Coach" }), _jsx("p", { className: "text-xs text-neutral-400 font-medium", children: "Smart training plans & schedule assistant" })] })] }), _jsxs("button", { onClick: () => setIsQuickModalOpen(true), className: "flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl bg-orange-50 hover:bg-orange-100 text-[#FF5500] text-xs font-bold transition-all active:scale-95 border border-orange-200/60", children: [_jsx(Sliders, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "Quick Plan" })] })] }), _jsxs("div", { className: "grid grid-cols-2 p-1 bg-neutral-200/60 rounded-2xl", children: [_jsxs("button", { type: "button", onClick: () => setActiveTab('schedule'), className: clsx('py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-2', activeTab === 'schedule'
                            ? 'bg-white text-neutral-900 shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-800'), children: [_jsx(Calendar, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "Active Plan" }), activePlan && (_jsx("span", { className: "w-2 h-2 rounded-full bg-emerald-500" }))] }), _jsxs("button", { type: "button", onClick: () => setActiveTab('chat'), className: clsx('py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-2', activeTab === 'chat'
                            ? 'bg-white text-neutral-900 shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-800'), children: [_jsx(MessageSquare, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "Coach Chat" }), _jsx("span", { className: "px-1.5 py-0.2 rounded-full bg-orange-100 text-[#FF5500] text-[10px] font-black", children: "AI" })] })] }), activeTab === 'schedule' && (_jsx("div", { className: "space-y-4 animate-in fade-in duration-150", children: activePlan ? (_jsxs(_Fragment, { children: [_jsxs(Card, { className: "p-4 bg-white border border-neutral-200/80 shadow-soft-sm space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center space-x-2 flex-wrap gap-y-1", children: [_jsxs("span", { className: "text-[10px] font-black uppercase tracking-wider bg-orange-50 text-[#FF5500] px-2 py-0.5 rounded-full", children: ["Week ", activePlan.currentWeek, " of ", activePlan.totalWeeks] }), _jsx("span", { className: "text-[11px] font-bold text-neutral-600", children: formatWeekRange() }), _jsx("span", { className: "text-neutral-300", children: "\u00B7" }), _jsx("span", { className: "text-[11px] font-bold text-neutral-400", children: activePlan.scheduleSummary })] }), _jsx("h2", { className: "text-lg font-black text-neutral-900 tracking-tight mt-1.5", children: activePlan.title }), _jsxs("p", { className: "text-xs text-neutral-500 flex items-center gap-1 mt-0.5", children: [_jsx(Target, { className: "w-3.5 h-3.5 text-neutral-400" }), activePlan.goal] })] }), _jsx("button", { onClick: handleClearPlan, className: "p-1.5 rounded-xl text-neutral-300 hover:text-rose-600 hover:bg-rose-50 transition-colors", title: "Remove plan", children: _jsx(Trash2, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "space-y-1.5 pt-1", children: [_jsxs("div", { className: "flex items-center justify-between text-xs font-semibold", children: [_jsx("span", { className: "text-neutral-500 font-medium", children: "Weekly Target Progress" }), _jsxs("span", { className: "font-mono text-neutral-900", children: [_jsx("span", { className: "font-bold text-[#FF5500]", children: formatDistance(weeklyProgress.completedKm, unitSystem, true) }), _jsxs("span", { className: "text-neutral-400", children: [" / ", formatDistance(weeklyProgress.targetKm, unitSystem, true)] })] })] }), _jsx("div", { className: "w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-[#FF5500] to-amber-500 rounded-full transition-all duration-500 ease-out", style: { width: `${weeklyProgress.percent}%` } }) }), _jsxs("div", { className: "flex items-center justify-between text-[11px] text-neutral-400 pt-0.5", children: [_jsxs("span", { children: [weeklyProgress.completedCount, " of ", weeklyProgress.totalWorkouts, " runs completed"] }), _jsxs("span", { className: "font-bold text-neutral-700", children: [weeklyProgress.percent, "%"] })] })] })] }), todayWorkout && (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between px-1", children: [_jsxs("div", { className: "flex items-center space-x-1.5", children: [_jsx("span", { className: "text-xs font-bold uppercase tracking-wider text-neutral-400", children: "Today's Session" }), _jsx("span", { className: "text-neutral-300", children: "\u00B7" }), _jsx("span", { className: "text-[11px] font-semibold text-neutral-500", children: formatFullWorkoutDate(new Date()) })] }), todayWorkout.distanceKm > 0 && !todayWorkout.completed && (_jsxs("button", { onClick: onNavigateAddRun, className: "text-xs font-bold text-[#FF5500] hover:text-[#E64D00] flex items-center gap-1", children: [_jsx(Plus, { className: "w-3.5 h-3.5 stroke-[2.5]" }), "Log Run Screenshot"] }))] }), _jsx(WorkoutCard, { workout: todayWorkout, unitSystem: unitSystem, isToday: true, onToggleComplete: handleToggleWorkout, onSelectRun: onSelectRun })] })), _jsxs("div", { className: "space-y-2.5 pt-1", children: [_jsxs("div", { className: "flex items-center justify-between px-1", children: [_jsx("span", { className: "text-xs font-bold uppercase tracking-wider text-neutral-400", children: "Full Weekly Schedule" }), _jsxs("button", { onClick: () => {
                                                setActiveTab('chat');
                                                setInputPrompt('Can you help me adjust my active training schedule?');
                                                setTimeout(() => chatInputRef.current?.focus(), 150);
                                            }, className: "text-xs font-bold text-[#FF5500] hover:text-[#E64D00] flex items-center gap-1", children: [_jsx(Sparkles, { className: "w-3 h-3" }), "Adjust with AI"] })] }), _jsx("div", { className: "space-y-2", children: activePlan.workouts.map((w) => (_jsx(WorkoutCard, { workout: w, unitSystem: unitSystem, isToday: w.dayOfWeek === currentDayOfWeek, onToggleComplete: handleToggleWorkout, onSelectRun: onSelectRun }, w.id))) })] }), activePlan.aiAdvice && (_jsxs("div", { className: "p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200/60 text-xs space-y-1.5", children: [_jsxs("div", { className: "flex items-center space-x-1.5 text-[#FF5500] font-bold", children: [_jsx(Sparkles, { className: "w-4 h-4" }), _jsx("span", { children: "Coach Strategy for This Week" })] }), _jsx("p", { className: "text-neutral-700 leading-relaxed", children: activePlan.aiAdvice })] }))] })) : (_jsxs(Card, { className: "p-7 text-center space-y-4 bg-white border border-neutral-200/90 shadow-soft-sm", children: [_jsx("div", { className: "w-14 h-14 rounded-full bg-orange-50 text-[#FF5500] flex items-center justify-center mx-auto shadow-soft-xs", children: _jsx(Calendar, { className: "w-7 h-7" }) }), _jsxs("div", { className: "space-y-1", children: [_jsx("h3", { className: "text-lg font-black text-neutral-900", children: "No Active Training Plan" }), _jsx("p", { className: "text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed", children: "Ready to get into a steady rhythm? Let's talk through your preferred running days (like Tuesday, Thursday, Saturday) and your targets." })] }), _jsxs("div", { className: "pt-2 flex flex-col gap-2", children: [_jsx(Button, { variant: "primary", size: "md", onClick: () => setIsQuickModalOpen(true), leftIcon: _jsx(Sliders, { className: "w-4 h-4" }), className: "font-bold text-xs shadow-glow-orange rounded-2xl py-3", children: "Quick Setup Plan (Tue, Thu, Sat)" }), _jsx(Button, { variant: "secondary", size: "md", onClick: () => {
                                        setActiveTab('chat');
                                        setTimeout(() => chatInputRef.current?.focus(), 150);
                                    }, leftIcon: _jsx(Sparkles, { className: "w-4 h-4 text-[#FF5500]" }), className: "font-bold text-xs rounded-2xl py-3", children: "Chat with Coach" })] })] })) })), activeTab === 'chat' && (_jsxs("div", { className: "space-y-3 animate-in fade-in duration-150", children: [_jsxs("div", { className: "p-2.5 rounded-2xl bg-neutral-100/80 border border-neutral-200/60 flex items-center justify-between text-xs", children: [_jsxs("div", { className: "flex items-center space-x-2 text-neutral-700 font-medium", children: [_jsx(Footprints, { className: "w-4 h-4 text-[#FF5500] shrink-0" }), _jsx("span", { className: "text-[11px] truncate", children: runs.length > 0
                                            ? `Aware of ${runs.length} logged runs in your history`
                                            : 'Ready to build your first routine' })] }), _jsx("button", { onClick: handleClearChat, className: "text-[11px] font-bold text-neutral-400 hover:text-neutral-600 transition-colors", children: "Clear" })] }), _jsx("div", { className: "flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar", children: [
                            { label: '💬 Discuss Tue/Thu/Sat Routine', prompt: 'I want to discuss running on Tuesday, Thursday, and Saturday. How should I balance easy vs quality sessions?' },
                            { label: '🎯 Discuss 5K / 10K Target', prompt: 'I want to discuss my goals for a 5K or 10K target. What do you recommend based on my recent runs?' },
                            { label: '⚡ Make this as Active Plan', prompt: 'Make this as plan for Tuesday, Thursday, and Saturday.' },
                            { label: '🔋 Zone 2 & Recovery Tips', prompt: 'How should I pace my easy recovery runs to build an aerobic base?' },
                        ].map((pill) => (_jsx("button", { type: "button", onClick: () => {
                                setInputPrompt(pill.prompt);
                                chatInputRef.current?.focus();
                            }, className: "shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full bg-white border border-neutral-200 text-neutral-700 hover:border-[#FF5500] hover:text-[#FF5500] active:scale-95 transition-all shadow-xs", children: pill.label }, pill.label))) }), _jsxs("div", { className: "space-y-3.5 min-h-[300px]", children: [messages.map((msg) => {
                                const isUser = msg.role === 'user';
                                return (_jsxs("div", { className: clsx('flex flex-col', isUser ? 'items-end' : 'items-start'), children: [_jsx("div", { className: "flex items-center space-x-1.5 mb-1 px-1", children: _jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-neutral-400", children: isUser ? 'You' : 'Coach' }) }), _jsxs("div", { className: clsx('p-3.5 rounded-2xl text-xs max-w-[90%] sm:max-w-[85%] leading-relaxed shadow-soft-xs', isUser
                                                ? 'bg-[#FF5500] text-white rounded-tr-none font-medium'
                                                : 'bg-white text-neutral-800 border border-neutral-200/80 rounded-tl-none space-y-2'), children: [renderFormattedMessage(msg.content, isUser, msg.id === typingMessageId), msg.suggestedPlan && (_jsx("div", { className: "pt-2 animate-in fade-in duration-300", children: _jsx(PlanCard, { plan: msg.suggestedPlan, unitSystem: unitSystem, isActive: activePlan?.id === msg.suggestedPlan.id, onApplyPlan: handleApplyPlan }) }))] })] }, msg.id));
                            }), isLoading && (_jsxs("div", { className: "flex items-center space-x-2 text-xs text-neutral-500 p-3 bg-white border border-neutral-200 rounded-2xl rounded-tl-none w-fit animate-pulse", children: [_jsx(Sparkles, { className: "w-4 h-4 text-[#FF5500] animate-spin" }), _jsx("span", { children: "Coach is thinking..." })] })), _jsx("div", { ref: chatEndRef })] }), _jsx("div", { className: "sticky bottom-20 pt-2 bg-gradient-to-t from-[#F9FAFB] via-[#F9FAFB] to-transparent", children: _jsxs("form", { onSubmit: (e) => {
                                e.preventDefault();
                                handleSendMessage(inputPrompt);
                            }, className: "flex items-center space-x-2 bg-white p-1.5 rounded-2xl border border-neutral-300/80 shadow-lg focus-within:ring-2 focus-within:ring-[#FF5500]/30 focus-within:border-[#FF5500]", children: [_jsx("input", { ref: chatInputRef, type: "text", value: inputPrompt, onChange: (e) => setInputPrompt(e.target.value), placeholder: typingMessageId
                                        ? 'Coach is writing...'
                                        : 'Ask coach (e.g. Tue, Thu, Sat for 10K)...', disabled: isLoading || !!typingMessageId, className: "flex-1 px-3 py-2 text-xs text-neutral-900 bg-transparent focus:outline-none placeholder:text-neutral-400 disabled:opacity-60" }), _jsx("button", { type: "submit", disabled: !inputPrompt.trim() || isLoading || !!typingMessageId, className: "w-9 h-9 rounded-xl bg-[#FF5500] hover:bg-[#E64D00] disabled:bg-neutral-200 text-white flex items-center justify-center shrink-0 transition-all active:scale-95 disabled:active:scale-100 shadow-xs", "aria-label": "Send message", children: _jsx(Send, { className: "w-4 h-4" }) })] }) })] })), _jsx(QuickPlanModal, { isOpen: isQuickModalOpen, onClose: () => setIsQuickModalOpen(false), onGenerate: handleQuickModalGenerate, isLoading: isLoading })] }));
};
