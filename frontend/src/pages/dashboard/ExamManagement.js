import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Settings,
  Play,
  Pause,
  Trash2,
  Edit,
  Copy,
  Eye,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Monitor
} from 'lucide-react';
import { examAPI, questionBankAPI, userManagementAPI, subjectAPI, teacherClassAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import ExamEvaluator from '../../components/exam/ExamEvaluator';
import ExamMonitoring from './ExamMonitoring';
import ErrorBoundary from '../../components/ErrorBoundary';

const ExamManagement = () => {
  // Get auth context
  const { user, organizationData } = useAuth();
  
  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      return dateString;
    }
  };
  
  // Helper function to format time
  const formatTime = (timeString) => {
    if (!timeString) return 'Not set';
    // If time is in HH:mm format, parse it
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
    return timeString;
  };
  
  // Main state
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    totalExams: 0,
    activeExams: 0,
    scheduledExams: 0,
    completedExams: 0
  });

  // Create exam state
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [examFormData, setExamFormData] = useState({
    title: '',
    subject: '',
    class: '',
    department: '',
    examType: 'mcq',
    totalQuestions: 0,
    marksPerQuestion: 0,
    totalMarks: 0,
    scheduledDate: '',
    startTime: '',
    duration: 0
  });

  // Edit exam state
  const [showEditExam, setShowEditExam] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  
  // Monitoring state
  const [showMonitoring, setShowMonitoring] = useState(false);
  const [monitoringExam, setMonitoringExam] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    subject: '',
    class: '',
    department: '',
    examType: 'mcq',
    totalQuestions: 0,
    marksPerQuestion: 0,
    totalMarks: 0,
    scheduledDate: '',
    startTime: '',
    duration: 0
  });

  // Evaluator state
  const [showEvaluator, setShowEvaluator] = useState(false);
  const [currentExam, setCurrentExam] = useState(null);
  
  // Exam timer state
  const [examTimers, setExamTimers] = useState({}); // { examId: { startTime: Date, duration: number } }
  const [timeRemaining, setTimeRemaining] = useState({}); // { examId: seconds }

  // Assign question bank to exam state
  const [selectedExam, setSelectedExam] = useState(null);
  const [showAssignQuestionBank, setShowAssignQuestionBank] = useState(false);
  const [availableQuestionBanks, setAvailableQuestionBanks] = useState([]);
  const [selectedQuestionBank, setSelectedQuestionBank] = useState(null);

  // Assign teachers to exam state
  const [showAssignTeachers, setShowAssignTeachers] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);

  // List students state
  const [showListStudents, setShowListStudents] = useState(false);
  const [examStudents, setExamStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Subjects and classes state
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [startTimeHours, setStartTimeHours] = useState(0);
  const [startTimeMinutes, setStartTimeMinutes] = useState(0);
  const [startTimePeriod, setStartTimePeriod] = useState('AM');

  // Load data on component mount
  useEffect(() => {
    loadExams();
    loadStatistics();
    loadAvailableSubjects();
    loadTeacherClasses();
  }, []);

  // Auto-update exam status when scheduled time arrives
  useEffect(() => {
    const updatedExamIds = new Set(); // Track which exams have been updated
    
    const checkAndUpdateExamStatus = async () => {
      const now = new Date();
      
      // Get current exams state
      setExams(currentExams => {
        const updatedExams = [...currentExams];
        let hasUpdates = false;
        
        for (let i = 0; i < updatedExams.length; i++) {
          const exam = updatedExams[i];
          
          // Skip if already updated or not in scheduled status
          if (updatedExamIds.has(exam.id) || exam.status !== 'scheduled' || !exam.scheduledDate || !exam.startTime) {
            continue;
          }
          
          try {
            // Parse exam start time
            let scheduledDateTime;
            if (exam.scheduledDate instanceof Date) {
              scheduledDateTime = new Date(exam.scheduledDate);
              const [hours, minutes] = exam.startTime.split(':');
              scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            } else if (typeof exam.scheduledDate === 'string') {
              let datePart;
              if (exam.scheduledDate.includes('T')) {
                datePart = exam.scheduledDate.split('T')[0];
              } else {
                datePart = exam.scheduledDate;
              }
              scheduledDateTime = new Date(`${datePart}T${exam.startTime}:00`);
            }

            if (scheduledDateTime && !isNaN(scheduledDateTime.getTime())) {
              // Check if current time is past the scheduled start time
              if (now >= scheduledDateTime) {
                console.log('🕐 Auto-updating exam status to active:', exam.title);
                
                // Mark as updated to prevent duplicate processing
                updatedExamIds.add(exam.id);
                
                // Update exam status in the array
                updatedExams[i] = { ...exam, status: 'active' };
                hasUpdates = true;
                
                // Make API call to update backend
                examAPI.updateExamStatus(exam.id, 'active').then(response => {
                  if (response.success) {
                    console.log('✅ Exam status updated to active:', exam.title);
                  }
                }).catch(error => {
                  console.error('❌ Failed to auto-update exam status:', error);
                  // Remove from updated set if API call failed
                  updatedExamIds.delete(exam.id);
                });
              }
            }
          } catch (error) {
            console.error('Error checking exam status:', error);
          }
        }
        
        return hasUpdates ? updatedExams : currentExams;
      });
    };

    // Check every 30 seconds
    const interval = setInterval(checkAndUpdateExamStatus, 30000);
    
    // Also check immediately
    checkAndUpdateExamStatus();

    return () => clearInterval(interval);
  }, []); // Remove exams dependency to avoid infinite loop

  // Countdown is now handled by WebSocket events and local timer calculations
  // No need for frequent API calls - WebSocket provides real-time updates

  // Manage exam timers
  useEffect(() => {
    if (Object.keys(examTimers).length === 0) {
      return; // No active timers, no need to run interval
    }

    const timerInterval = setInterval(() => {
      const now = new Date();
      const updatedTimeRemaining = {};
      
      Object.entries(examTimers).forEach(([examId, timerData]) => {
        const elapsed = Math.floor((now - timerData.startTime) / 1000);
        const remaining = Math.max(0, timerData.duration * 60 - elapsed);
        updatedTimeRemaining[examId] = remaining;
        
        // Auto-end exam when time runs out
        if (remaining === 0) {
          const exam = exams.find(exam => exam.id === examId);
          if (exam?.status === 'active') {
            handleExamStatusChange(examId, 'completed');
          }
        }
      });
      
      setTimeRemaining(prev => ({ ...prev, ...updatedTimeRemaining }));
    }, 5000); // Reduced from 1000ms to 5000ms (5 seconds)

    return () => clearInterval(timerInterval);
  }, [examTimers, exams.length]); // Only depend on exams.length, not the entire exams array

    // Load available subjects for teacher (from their departments)  
  const loadAvailableSubjects = async () => {
    try {
      // Get subjects from teacher's assigned departments  
      const response = await subjectAPI.getAll();
      
      if (response.success && response.data) {
        // The API returns subjects directly in data array
        const subjects = Array.isArray(response.data) ? response.data : [];
        setAvailableSubjects(subjects);
        
        if (subjects.length === 0) {
        }
      } else {
        setAvailableSubjects([]);
      }
    } catch (error) {
      setAvailableSubjects([]);
    }
  };

  // Load teacher's classes (groups)
  const loadTeacherClasses = async () => {
    // Only load teacher classes for teachers, not for org admins
    if (user?.userType !== 'teacher') {
      return;
    }
    
    try {
      const response = await teacherClassAPI.getAll();
      if (response.success) {
        setAvailableClasses(response.data || []);
      }
    } catch (error) {
      setAvailableClasses([]); // Set empty array on error to prevent undefined state
    }
  };

  // Load exams from API
  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await examAPI.getExams();
      if (response.success) {
        const exams = response.data.exams || [];
        setExams(exams);
      }
    } catch (error) {
      setError('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    try {
      const response = await examAPI.getExams({ limit: 1000 });
      if (response.success) {
        const allExams = response.data.exams || [];
        setStatistics({
          totalExams: allExams.length,
          activeExams: allExams.filter(exam => exam.status === 'active').length,
          scheduledExams: allExams.filter(exam => exam.status === 'scheduled').length,
          completedExams: allExams.filter(exam => exam.status === 'completed').length
        });
      }
    } catch (error) {
    }
  };

  // Create new exam
  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Calculate total duration in minutes
      const totalDuration = (durationHours * 60) + durationMinutes;
      
      // Format start time as HH:mm (convert to 24-hour format)
      let hour24 = startTimeHours;
      if (startTimePeriod === 'PM' && startTimeHours !== 12) {
        hour24 = startTimeHours + 12;
      } else if (startTimePeriod === 'AM' && startTimeHours === 12) {
        hour24 = 0;
      }
      const formattedStartTime = `${String(hour24).padStart(2, '0')}:${String(startTimeMinutes).padStart(2, '0')}`;
      
      // Calculate total marks
      const totalMarks = examFormData.totalQuestions * examFormData.marksPerQuestion;
      
      // Add organizationId and createdBy for new exams
      const examData = {
        ...examFormData,
        startTime: formattedStartTime,
        duration: totalDuration,
        totalMarks: totalMarks,
        organizationId: organizationData?.id,
        createdBy: user?.id
      };
      const response = await examAPI.createExam(examData);
      if (response.success) {
        setExams([response.data.exam, ...exams]);
        setShowCreateExam(false);
        setExamFormData({
          title: '',
          subject: '',
          class: '',
          department: '',
          examType: 'mcq',
          totalQuestions: 0,
          marksPerQuestion: 0,
          totalMarks: 0,
          scheduledDate: '',
          startTime: '',
          duration: 0
        });
        setSelectedSubject('');
        setDurationHours(0);
        setDurationMinutes(0);
        setStartTimeHours(0);
        setStartTimeMinutes(0);
        loadStatistics();
      }
    } catch (error) {
      setError('Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  // Load available question banks for exam
  const loadAvailableQuestionBanks = async (exam) => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      // Load all active question banks without filtering by subject
      const response = await questionBankAPI.getQuestionBanks({
        status: 'active',
        limit: 1000
      });
      
      
      if (response.success && response.data) {
        const banks = response.data.questionBanks || [];
        
        if (banks.length === 0) {
          setError('No question banks available. Please create question banks first.');
        } else {
          setError(null); // Clear any previous errors
        }
        
        setAvailableQuestionBanks(banks);
      } else {
        setError('Failed to load question banks: ' + (response.message || 'Unknown error'));
        setAvailableQuestionBanks([]);
      }
    } catch (error) {
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to load available question banks';
      setError(errorMessage);
      setAvailableQuestionBanks([]);
    } finally {
      setLoading(false);
    }
  };

  // Assign question bank to exam
  const handleAssignQuestionBankToExam = (exam) => {
    setSelectedExam(exam);
    setShowAssignQuestionBank(true);
    setAvailableQuestionBanks([]); // Clear previous data
    setError(null); // Clear previous errors
    loadAvailableQuestionBanks(exam);
  };

  // Change question bank for exam
  const handleChangeQuestionBank = (exam) => {
    setSelectedExam(exam);
    setShowAssignQuestionBank(true);
    setAvailableQuestionBanks([]); // Clear previous data
    setError(null); // Clear previous errors
    loadAvailableQuestionBanks(exam);
  };

  // Remove question bank from exam
  const handleRemoveQuestionBank = async (exam) => {
    if (window.confirm('Are you sure you want to remove the question bank from this exam?')) {
      try {
        setLoading(true);
        const response = await examAPI.removeQuestionBankFromExam(exam._id);
        if (response.success) {
          setError(null);
          loadExams(); // Reload exams to update the display
        }
      } catch (error) {
        setError('Failed to remove question bank from exam');
      } finally {
        setLoading(false);
      }
    }
  };

  // Save question bank assignment to exam
  const handleSaveQuestionBankToExam = async () => {
    if (!selectedQuestionBank) {
      setError('Please select a question bank');
      return;
    }

    try {
      setLoading(true);
      const response = await examAPI.assignQuestionBankToExam(selectedExam.id, selectedQuestionBank._id);
      if (response.success) {
        setShowAssignQuestionBank(false);
        setSelectedExam(null);
        setSelectedQuestionBank(null);
        setAvailableQuestionBanks([]);
        loadExams();
      }
    } catch (error) {
      setError('Failed to assign question bank to exam');
    } finally {
      setLoading(false);
    }
  };

  // Load available teachers for exam assignment
  const loadAvailableTeachers = async () => {
    try {
      setLoading(true);
      const response = await userManagementAPI.getUsers({ userType: 'teacher' });
      if (response.success) {
        setAvailableTeachers(response.data.users || []);
      }
    } catch (error) {
      setError('Failed to load available teachers');
    } finally {
      setLoading(false);
    }
  };

  // Assign teachers to exam
  const handleAssignTeachersToExam = (exam) => {
    setSelectedExam(exam);
    setSelectedTeachers(exam.assignedTeachers || []);
    setShowAssignTeachers(true);
    loadAvailableTeachers();
  };

  // Load students for exam's class
  const handleListStudents = async (exam) => {
    setSelectedExam(exam);
    setShowListStudents(true);
    setStudentsLoading(true);
    setExamStudents([]);
    setError(null); // Clear any previous errors
    
    try {
      const organizationId = exam.organizationId;
      
      if (!organizationId) {
        throw new Error('Organization ID not found');
      }
      
      // Get all students from the organization
      const response = await userManagementAPI.getUsers({ 
        organizationId, 
        userType: 'student' 
      });
      
      if (response && response.success) {
        // Try different possible response structures
        const students = response.data?.users || response.users || response.data || [];
        
        if (Array.isArray(students) && students.length > 0) {
          // Filter students by the exam's class
          const classStudents = students.filter(student => {
            // Try multiple ways to get the student's class
            const studentClass = student.profile?.class || student.class || student.grade || student.profile?.grade || '';
            const examClass = exam.class || '';
            
            // Check if classes match (case-insensitive partial match)
            const match = studentClass.toLowerCase().includes(examClass.toLowerCase()) || 
                         examClass.toLowerCase().includes(studentClass.toLowerCase());
            
            return match;
          });
          
          setExamStudents(classStudents);
        } else {
          setExamStudents([]);
        }
      } else {
        setExamStudents([]);
      }
    } catch (error) {
      const errorMessage = error?.message || error?.response?.message || 'Unknown error';
      
      if (errorMessage.includes('organization membership') || errorMessage.includes('Forbidden')) {
        setError('You do not have permission to view students in this organization.');
      } else {
        setError('Failed to load students. Please try again.');
      }
      
      setExamStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  // Save teacher assignment to exam
  const handleSaveTeachersToExam = async () => {
    if (selectedTeachers.length === 0) {
      setError('Please select at least one teacher');
      return;
    }

    try {
      setLoading(true);
      const response = await examAPI.assignTeachersToExam(selectedExam.id, selectedTeachers);
      if (response.success) {
        setShowAssignTeachers(false);
        setSelectedExam(null);
        setSelectedTeachers([]);
        setAvailableTeachers([]);
        loadExams();
      }
    } catch (error) {
      setError('Failed to assign teachers to exam');
    } finally {
      setLoading(false);
    }
  };

  // Check if exam can be started (within 5 minutes of scheduled time)
  const canStartExam = (exam) => {
    
    
    // Only allow access for scheduled exams (5 minutes before) and active/paused exams (for re-entry)
    if (!['scheduled', 'active', 'paused'].includes(exam.status)) {
      return false;
    }
    
    // For active/paused exams, always allow access (for re-entry)
    if (['active', 'paused'].includes(exam.status)) {
      return true;
    }
    
    // Validate required fields
    if (!exam.scheduledDate || !exam.startTime) {
      return false;
    }
    
    const now = new Date();
    
    // Create a more robust date parsing function
    let scheduledDateTime;
    
    try {
      // Handle different date formats
      if (exam.scheduledDate instanceof Date) {
        // If it's a Date object, use it directly and set the time
        scheduledDateTime = new Date(exam.scheduledDate);
        const [hours, minutes] = exam.startTime.split(':');
        scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else if (typeof exam.scheduledDate === 'string') {
        // If it's a string, parse it properly
        let datePart;
        if (exam.scheduledDate.includes('T')) {
          // It's an ISO string like "2025-10-26T00:00:00.000Z"
          datePart = exam.scheduledDate.split('T')[0];
        } else {
          // It's already just a date like "2025-10-26"
          datePart = exam.scheduledDate;
        }
        
        // Create the scheduled date time - ensure it's treated as local time
        scheduledDateTime = new Date(`${datePart}T${exam.startTime}:00`);
      } else {
        console.log('❌ Invalid scheduledDate format:', exam.scheduledDate);
        return false;
      }
      
      // Check if the date is valid
      if (isNaN(scheduledDateTime.getTime())) {
        console.log('❌ Invalid date created:', {
          scheduledDate: exam.scheduledDate,
          startTime: exam.startTime,
          scheduledDateTime: scheduledDateTime
        });
        return false;
      }
      
      console.log('✅ Date parsing successful:', {
        originalScheduledDate: exam.scheduledDate,
        originalStartTime: exam.startTime,
        parsedDateTime: scheduledDateTime.toISOString(),
        parsedLocalTime: scheduledDateTime.toLocaleString(),
        currentTime: now.toLocaleString(),
        timezoneOffset: scheduledDateTime.getTimezoneOffset(),
        currentTimezoneOffset: now.getTimezoneOffset(),
        // Show the exact date/time components
        scheduledDateComponents: {
          year: scheduledDateTime.getFullYear(),
          month: scheduledDateTime.getMonth() + 1, // JavaScript months are 0-based
          day: scheduledDateTime.getDate(),
          hours: scheduledDateTime.getHours(),
          minutes: scheduledDateTime.getMinutes(),
          seconds: scheduledDateTime.getSeconds()
        },
        currentDateComponents: {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: now.getDate(),
          hours: now.getHours(),
          minutes: now.getMinutes(),
          seconds: now.getSeconds()
        }
      });
      
    } catch (error) {
      console.log('❌ Error parsing date:', error);
      return false;
    }
    
    // Calculate 5 minutes before exam start time
    const fiveMinutesBefore = new Date(scheduledDateTime.getTime() - 5 * 60 * 1000);
    
    console.log('Exam time debug:', {
      examId: exam.id,
      examTitle: exam.title,
      status: exam.status,
      scheduledDate: exam.scheduledDate,
      startTime: exam.startTime,
      scheduledDateTime: scheduledDateTime.toISOString(),
      fiveMinutesBefore: fiveMinutesBefore.toISOString(),
      now: now.toISOString(),
      canStart: now >= fiveMinutesBefore
    });
    
    // For scheduled exams: Can access evaluator 5 minutes before scheduled time
    if (exam.status === 'scheduled') {
      // Ensure duration is a valid number, default to 60 minutes if not
      const duration = typeof exam.duration === 'number' && exam.duration > 0 ? exam.duration : 60;
      const examEndTime = new Date(scheduledDateTime.getTime() + duration * 60 * 1000);
      const canAccess = now >= fiveMinutesBefore && now < examEndTime;
      const timeDiff = fiveMinutesBefore.getTime() - now.getTime();
      const minutesUntilAccess = Math.ceil(timeDiff / (1000 * 60));
      
      console.log('🕐 Scheduled exam access check:', {
        examId: exam.id,
        examTitle: exam.title,
        now: now.toISOString(),
        nowLocal: now.toLocaleString(),
        scheduledDateTime: scheduledDateTime.toISOString(),
        scheduledDateTimeLocal: scheduledDateTime.toLocaleString(),
        fiveMinutesBefore: fiveMinutesBefore.toISOString(),
        fiveMinutesBeforeLocal: fiveMinutesBefore.toLocaleString(),
        examEndTime: examEndTime.toISOString(),
        examEndTimeLocal: examEndTime.toLocaleString(),
        duration: duration,
        timeDiffMs: timeDiff,
        minutesUntilAccess: minutesUntilAccess,
        canAccess: canAccess,
        // Detailed time comparison
        nowVsFiveMinutesBefore: now.getTime() - fiveMinutesBefore.getTime(),
        nowVsScheduled: now.getTime() - scheduledDateTime.getTime(),
        nowVsExamEnd: now.getTime() - examEndTime.getTime(),
        // Time differences in minutes
        minutesToFiveMinutesBefore: Math.round((fiveMinutesBefore.getTime() - now.getTime()) / (1000 * 60)),
        minutesToScheduled: Math.round((scheduledDateTime.getTime() - now.getTime()) / (1000 * 60)),
        minutesToExamEnd: Math.round((examEndTime.getTime() - now.getTime()) / (1000 * 60))
      });
      
      // Allow access if we're within 5 minutes of start time and before exam ends
      if (canAccess) {
        console.log('✅ Exam is accessible (within 5-minute window)');
        return true;
      }
      
      // TEMPORARY: Show detailed reason why access is denied
      console.log('❌ ACCESS DENIED - Detailed Analysis:', {
        reason1: now >= fiveMinutesBefore ? 'PASS: Current time >= 5 minutes before' : 'FAIL: Current time < 5 minutes before',
        reason2: now < examEndTime ? 'PASS: Current time < exam end time' : 'FAIL: Current time >= exam end time',
        timeToFiveMinutesBefore: `${Math.round((fiveMinutesBefore.getTime() - now.getTime()) / (1000 * 60))} minutes`,
        timeToExamEnd: `${Math.round((examEndTime.getTime() - now.getTime()) / (1000 * 60))} minutes`,
        finalDecision: canAccess ? 'ALLOW' : 'DENY'
      });
      
      console.log(`⏰ Exam not accessible yet. Available in ${minutesUntilAccess} minutes`);
      return false;
    }
    
    console.log('❌ Exam status is not scheduled, returning false');
    return false;
  };

  // Check if exam can actually be started (at scheduled time)
  const canActuallyStartExam = (exam) => {
    // Only scheduled exams can be started
    if (exam.status !== 'scheduled') return false;
    
    // Validate required fields
    if (!exam.scheduledDate || !exam.startTime) return false;
    
    const now = new Date();
    
    // Handle different date formats - extract just the date part
    let scheduledDateStr;
    if (exam.scheduledDate instanceof Date) {
      scheduledDateStr = exam.scheduledDate.toISOString().split('T')[0];
    } else if (typeof exam.scheduledDate === 'string') {
      if (exam.scheduledDate.includes('T')) {
        scheduledDateStr = exam.scheduledDate.split('T')[0];
      } else {
        scheduledDateStr = exam.scheduledDate;
      }
    } else {
      return false;
    }
    
    // Create the scheduled date time
    const scheduledDateTime = new Date(`${scheduledDateStr}T${exam.startTime}`);
    
    // Check if the date is valid
    if (isNaN(scheduledDateTime.getTime())) {
      return false;
    }
    
    // Can actually start only at or after the scheduled time
    return now >= scheduledDateTime;
  };

  // Check if exam has expired (simplified - no expiration)
  const isExamExpired = (exam) => {
    // No expiration logic - exams can always be started if scheduled
    return false;
  };

  // Get time until exam can be started
  const getTimeUntilStartable = (exam) => {
    // Validate required fields
    if (!exam.scheduledDate || !exam.startTime) {
      return null;
    }
    
    const now = new Date();
    
    // Handle different date formats - extract just the date part
    let scheduledDateStr;
    if (exam.scheduledDate instanceof Date) {
      scheduledDateStr = exam.scheduledDate.toISOString().split('T')[0];
    } else if (typeof exam.scheduledDate === 'string') {
      if (exam.scheduledDate.includes('T')) {
        scheduledDateStr = exam.scheduledDate.split('T')[0];
      } else {
        scheduledDateStr = exam.scheduledDate;
      }
    } else {
      return null;
    }
    
    // Create the scheduled date time
    const scheduledDateTime = new Date(`${scheduledDateStr}T${exam.startTime}`);
    
    // Check if the date is valid
    if (isNaN(scheduledDateTime.getTime())) {
      return null;
    }
    
    const fiveMinutesBefore = new Date(scheduledDateTime.getTime() - 5 * 60 * 1000);
    
    // If we're already past the 5-minute mark, return null (can start now)
    if (now >= fiveMinutesBefore) {
      return null;
    }
    
    // If we're before the 5-minute mark, show countdown
    const diffMs = fiveMinutesBefore.getTime() - now.getTime();
    const diffMinutes = Math.ceil(diffMs / (1000 * 60));
    return `${diffMinutes} minutes`;
  };

  // Get time since exam expired (simplified - no expiration)
  const getTimeSinceExpired = (exam) => {
    // No expiration logic - always return null
    return null;
  };

  // Navigate to evaluator module
  const handleStartExam = (exam) => {
    setCurrentExam(exam);
    setShowEvaluator(true);
  };

  // Handle exam start from evaluator
  const handleExamStart = async (examId) => {
    try {
      const response = await examAPI.updateExamStatus(examId, 'active');
      if (response.success) {
        const updatedExams = exams.map(exam => 
          exam.id === examId ? { ...exam, status: 'active' } : exam
        );
        setExams(updatedExams);
        loadStatistics();
        
        // Start the exam timer
        const exam = exams.find(exam => exam.id === examId);
        if (exam) {
          setExamTimers(prev => ({
            ...prev,
            [examId]: {
              startTime: new Date(),
              duration: exam.duration
            }
          }));
        }
      }
    } catch (error) {
      setError('Failed to start exam');
    }
  };

  // Close evaluator
  const handleCloseEvaluator = () => {
    setShowEvaluator(false);
    // Don't set currentExam to null - keep the exam reference so the button remains visible
    // setCurrentExam(null);
  };

  // Update exam status
  const handleExamStatusChange = async (examId, newStatus) => {
    try {
      console.log(`🔄 Updating exam ${examId} status to: ${newStatus}`);
      const response = await examAPI.updateExamStatus(examId, newStatus);
      console.log('📡 API Response:', response);
      
      if (response.success) {
        const updatedExams = exams.map(exam => 
          exam.id === examId ? { ...exam, status: newStatus } : exam
        );
        setExams(updatedExams);
        loadStatistics();
        
        console.log(`✅ Exam ${examId} status updated to: ${newStatus}`);
        
        // Handle timer based on status change
        if (newStatus === 'completed' || newStatus === 'cancelled') {
          // Remove timer when exam is completed or cancelled
          setExamTimers(prev => {
            const newTimers = { ...prev };
            delete newTimers[examId];
            return newTimers;
          });
          setTimeRemaining(prev => {
            const newTimeRemaining = { ...prev };
            delete newTimeRemaining[examId];
            return newTimeRemaining;
          });
          console.log(`⏰ Timer removed for exam ${examId}`);
        }
      } else {
        console.error('❌ API returned success: false', response);
        setError('Failed to update exam status');
      }
    } catch (error) {
      console.error('❌ Error updating exam status:', error);
      setError('Failed to update exam status');
    }
  };

  // Delete exam
  const handleDeleteExam = async (examId) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        const response = await examAPI.deleteExam(examId);
        if (response.success) {
          setExams(exams.filter(exam => exam.id !== examId));
          loadStatistics();
        }
      } catch (error) {
        setError('Failed to delete exam');
      }
    }
  };

  const handleEditExam = (exam) => {
    setEditingExam(exam);
    setEditFormData({
      title: exam.title || '',
      subject: exam.subject || '',
      class: exam.class || '',
      department: exam.department || '',
      examType: exam.examType || 'mcq',
      totalQuestions: exam.totalQuestions || 0,
      marksPerQuestion: exam.marksPerQuestion || 0,
      totalMarks: exam.totalMarks || 0,
      scheduledDate: exam.scheduledDate ? exam.scheduledDate.split('T')[0] : '',
      startTime: exam.startTime || '',
      duration: exam.duration || 0
    });
    setShowEditExam(true);
  };

  const handleUpdateExam = async (e) => {
    e.preventDefault();
    try {
      const response = await examAPI.updateExam(editingExam.id, editFormData);
      if (response.success) {
        setShowEditExam(false);
        setEditingExam(null);
        loadExams();
        loadStatistics();
      }
    } catch (error) {
      setError('Failed to update exam');
    }
  };

  // Handle monitoring
  const handleStartMonitoring = (exam) => {
    setMonitoringExam(exam);
    setShowMonitoring(true);
  };

  const handleCloseMonitoring = () => {
    setShowMonitoring(false);
    setMonitoringExam(null);
  };

  // Status configuration
  const statusConfig = {
    scheduled: { 
      label: 'Scheduled', 
      color: 'bg-blue-100 text-blue-800', 
      icon: Calendar 
    },
    active: { 
      label: 'Active', 
      color: 'bg-green-100 text-green-800', 
      icon: Play 
    },
    paused: { 
      label: 'Paused', 
      color: 'bg-yellow-100 text-yellow-800', 
      icon: Pause 
    },
    completed: { 
      label: 'Completed', 
      color: 'bg-gray-100 text-gray-800', 
      icon: CheckCircle 
    },
    expired: { 
      label: 'Expired', 
      color: 'bg-red-100 text-red-800', 
      icon: Clock 
    }
  };

  // Exam type configuration
  const examTypeConfig = {
    mcq: { label: 'MCQ', icon: BookOpen },
    subjective: { label: 'Subjective', icon: Edit }
  };

  if (loading && exams.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Management</h1>
        <p className="text-gray-600">Create and manage exams with questions from the question bank</p>
        
        {/* Test Button */}
        <div className="mt-4">
          <button
            onClick={() => window.location.href = '/monitoring-test'}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
          >
            🧪 Test Monitoring (Debug)
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Exams</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.totalExams}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Play className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Exams</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.activeExams}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.scheduledExams}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.completedExams}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowCreateExam(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Exam</span>
            </button>
          </div>
          <button
            onClick={loadExams}
            className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <XCircle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Exams List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Exams</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {exams.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No exams yet</h3>
              <p className="text-gray-600 mb-4">Create your first exam to get started</p>
              <button
                onClick={() => setShowCreateExam(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Create Exam
              </button>
            </div>
          ) : (
            exams.map((exam) => {
              const StatusIcon = statusConfig[exam.status].icon;
              const ExamTypeIcon = examTypeConfig[exam.examType].icon;
              
              const isCompleted = exam.status === 'completed';
              
              return (
                <div key={exam.id} className={`bg-white rounded-xl border border-gray-200 shadow-sm transition-all duration-200 overflow-hidden ${
                  isCompleted 
                    ? 'opacity-75 cursor-not-allowed' 
                    : 'hover:shadow-md'
                }`}>
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-semibold text-gray-900">{exam.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              isExamExpired(exam)
                                ? 'bg-red-100 text-red-800' 
                                : statusConfig[exam.status].color
                            }`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {isExamExpired(exam)
                                ? 'Expired' 
                                : statusConfig[exam.status].label}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                              <ExamTypeIcon className="w-3 h-3 mr-1" />
                              {examTypeConfig[exam.examType].label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Subject</p>
                          <p className="text-sm font-semibold text-gray-900">{exam.subject}</p>
                          <p className="text-xs text-gray-500">{exam.class}</p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 bg-green-50 rounded-lg">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <Calendar className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Date & Time</p>
                          <p className="text-sm font-semibold text-gray-900">{formatDate(exam.scheduledDate)}</p>
                          <p className="text-xs text-gray-500">{formatTime(exam.startTime)}</p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                          <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">Duration</p>
                          <p className="text-sm font-semibold text-gray-900">{exam.duration} minutes</p>
                          <p className="text-xs text-gray-500">Total time</p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Questions</p>
                          <p className="text-sm font-semibold text-gray-900">{exam.questionsAdded}/{exam.totalQuestions}</p>
                          <p className="text-xs text-gray-500">Added/Total</p>
                        </div>
                      </div>
                    </div>

                    {/* Question Bank Assignment Section */}
                    {exam.questionBankId ? (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <BookOpen className="w-5 h-5 text-green-600 mr-2" />
                              <h4 className="text-sm font-semibold text-green-900">Assigned Question Bank</h4>
                            </div>
                            <div className="ml-7">
                              <p className="text-sm font-medium text-green-800">{exam.questionBankId.name}</p>
                              {exam.questionBankId.description && (
                                <p className="text-xs text-green-700 mt-1">{exam.questionBankId.description}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-xs text-green-600">
                                <span className="flex items-center">
                                  <Users className="w-3 h-3 mr-1" />
                                  {exam.questionBankId.totalQuestions} questions
                                </span>
                                <span className="flex items-center">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {exam.questionBankId.totalMarks} total marks
                                </span>
                                <span className="flex items-center">
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  {exam.questionBankId.subject} - {exam.questionBankId.class}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            {!isCompleted && (
                              <>
                                <button
                                  onClick={() => handleChangeQuestionBank(exam)}
                                  className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                >
                                  Change
                                </button>
                                <button
                                  onClick={() => handleRemoveQuestionBank(exam)}
                                  className="text-red-600 hover:text-red-800 text-xs font-medium"
                                >
                                  Remove
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <BookOpen className="w-5 h-5 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-600">No question bank assigned</span>
                          </div>
                          {!isCompleted && (
                            <button
                              onClick={() => handleAssignQuestionBankToExam(exam)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Assign Question Bank
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Admin-only text display */}
                    {user?.userType === 'organization_admin' && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-2 text-gray-400" />
                            Created by: {exam.createdBy?.profile?.firstName && exam.createdBy?.profile?.lastName 
                              ? `${exam.createdBy.profile.firstName} ${exam.createdBy.profile.lastName}`
                              : exam.createdBy?.email || 'Unknown'
                            }
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="space-y-4">
                      {/* Primary Actions Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        {/* Left Side - Management Actions */}
                        <div className="flex flex-wrap items-center gap-3">
                          {exam.status === 'scheduled' && !isCompleted && (
                            <button
                              onClick={() => handleAssignTeachersToExam(exam)}
                              className="inline-flex items-center px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                            >
                              <Users className="w-4 h-4 mr-2" />
                              Assign Teachers
                            </button>
                          )}
                          <button
                            onClick={() => handleListStudents(exam)}
                            className="inline-flex items-center px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            List Students
                          </button>
                          {exam.status === 'completed' && (
                            <button
                              onClick={() => handleViewResults(exam)}
                              className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Results
                            </button>
                          )}
                        </div>

                        {/* Right Side - Exam Control Actions */}
                        <div className="flex flex-wrap items-center gap-3">
                          {(() => {
                            // For completed exams, show disabled evaluator button
                            if (isCompleted) {
                              return (
                                <button
                                  disabled
                                  className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm font-medium"
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  Exam Ended
                                </button>
                              );
                            }
                            
                            const canAccessEvaluator = canStartExam(exam);
                            const canActuallyStart = canActuallyStartExam(exam);
                            const isExamActive = exam.status === 'active';
                            const isExamPaused = exam.status === 'paused';
                            
                            
                            // Button rendering logic optimized
                            
                            // Evaluator Button - Only show for non-draft exams
                            if (exam.status !== 'draft' && (canAccessEvaluator || isExamActive || isExamPaused)) {
                              return (
                                <button
                                  onClick={() => handleStartExam(exam)}
                                  className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm ${
                                    isExamActive 
                                      ? 'bg-green-600 text-white hover:bg-green-700' 
                                      : isExamPaused
                                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  {isExamActive ? 'Re-enter Evaluator' : isExamPaused ? 'Re-enter Evaluator' : 'Enter Evaluator'}
                                </button>
                              );
                            } else if (exam.status === 'draft') {
                              return (
                                <button
                                  disabled
                                  className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm font-medium"
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  Exam Not Scheduled
                                </button>
                              );
                            } else {
                              return (
                                <button
                                  disabled
                                  className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm font-medium"
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  Enter Evaluator
                                </button>
                              );
                            }
                          })()}

                          {/* Status Control Buttons - Only show for non-completed exams */}
                          {!isCompleted && exam.status === 'active' && (
                            <button
                              onClick={() => handleExamStatusChange(exam.id, 'paused')}
                              className="inline-flex items-center px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
                            >
                              <Pause className="w-4 h-4 mr-2" />
                              Pause
                            </button>
                          )}
                          {!isCompleted && exam.status === 'paused' && (
                            <button
                              onClick={() => handleExamStatusChange(exam.id, 'active')}
                              className="inline-flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Resume
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Status Information Row */}
                      <div className="flex justify-center">
                        {(() => {
                          const canAccessEvaluator = canStartExam(exam);
                          const canActuallyStart = canActuallyStartExam(exam);
                          const timeUntilStartable = getTimeUntilStartable(exam);
                          const isExamActive = exam.status === 'active';
                          const isExamPaused = exam.status === 'paused';
                          
                          if (isExamActive) {
                            return (
                              <p className="text-xs text-green-600 font-medium">
                                Exam is currently running
                              </p>
                            );
                          } else if (isExamPaused) {
                            return (
                              <p className="text-xs text-yellow-600 font-medium">
                                Exam is paused
                              </p>
                            );
                          } else if (canAccessEvaluator && !canActuallyStart) {
                            return (
                              <p className="text-xs text-blue-600 font-medium">
                                Evaluator available - Exam starts at scheduled time
                              </p>
                            );
                          } else if (canAccessEvaluator && canActuallyStart) {
                            return (
                              <p className="text-xs text-green-600 font-medium">
                                Ready to start exam
                              </p>
                            );
                          } else if (exam.status === 'draft') {
                            return (
                              <p className="text-xs text-gray-500 font-medium">
                                Exam not scheduled yet
                              </p>
                            );
                          } else if (timeUntilStartable) {
                            return (
                              <p className="text-xs text-gray-500 font-medium">
                                Available in {timeUntilStartable}
                              </p>
                            );
                          } else if (exam.status === 'completed') {
                            return (
                              <p className="text-xs text-blue-600 font-medium">
                                Exam completed
                              </p>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Secondary Actions Row */}
                      <div className="flex justify-end">
                        <div className="flex items-center gap-2">
                          {(exam.status === 'active' || exam.status === 'ongoing') && (
                            <button
                              onClick={() => handleStartMonitoring(exam)}
                              className="inline-flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                            >
                              <Monitor className="w-4 h-4 mr-2" />
                              Monitor
                            </button>
                          )}
                          {exam.status !== 'completed' && (
                            <button
                              onClick={() => handleEditExam(exam)}
                              className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </button>
                          )}
                          {!isCompleted && (
                            <button
                              onClick={() => handleDeleteExam(exam.id)}
                              className="inline-flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Exam Modal */}
      {showCreateExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New Exam</h2>
                  <p className="text-sm text-gray-600 mt-1">Fill in the details to create a new examination</p>
                </div>
                <button
                  onClick={() => setShowCreateExam(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateExam} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Title</label>
                  <input
                    type="text"
                    value={examFormData.title}
                    onChange={(e) => setExamFormData({...examFormData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Mathematics Mid-term Exam"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => {
                      const subject = e.target.value;
                      setSelectedSubject(subject);
                      setExamFormData({...examFormData, subject: subject});
                    }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                    required
                  >
                    <option value="">Select a subject</option>
                    {availableSubjects.length > 0 ? (
                      availableSubjects.map((subject) => (
                        <option key={subject._id} value={subject.name}>
                          {subject.code ? `${subject.code} - ${subject.name}` : subject.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No subjects available. Please create subjects in Subject Management or ask admin to assign you to departments.</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class/Group *</label>
                  <select
                    value={examFormData.class}
                    onChange={(e) => setExamFormData({...examFormData, class: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                    required
                  >
                    <option value="">Select a class/group</option>
                    {availableClasses.map((classItem) => (
                      <option key={classItem._id} value={classItem.className || classItem.classCode}>
                        {classItem.className} ({classItem.classCode})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Select from your created classes</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <input
                    type="text"
                    value={examFormData.department || ''}
                    onChange={(e) => setExamFormData({...examFormData, department: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Computer Science, Mathematics"
                  />
                  <p className="mt-1 text-xs text-gray-500">Optional: Specify the academic department</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Type</label>
                  <select
                    value={examFormData.examType}
                    onChange={(e) => setExamFormData({...examFormData, examType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="mcq">Multiple Choice Questions (MCQ)</option>
                    <option value="subjective">Subjective Questions</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Questions *</label>
                    <input
                      type="number"
                      value={examFormData.totalQuestions || ''}
                      onChange={(e) => setExamFormData({...examFormData, totalQuestions: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="1"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">Enter the number of questions for this exam</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Marks per Question *</label>
                    <input
                      type="number"
                      value={examFormData.marksPerQuestion || ''}
                      onChange={(e) => setExamFormData({...examFormData, marksPerQuestion: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="1"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">Enter marks for each question</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date *</label>
                  <input
                    type="date"
                    value={examFormData.scheduledDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setExamFormData({...examFormData, scheduledDate: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Only today or future dates allowed</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <select
                          value={startTimeHours || ''}
                          onChange={(e) => setStartTimeHours(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        >
                          <option value="">Hour</option>
                          {Array.from({ length: 12 }, (_, i) => {
                            const hour = i + 1;
                            return (
                              <option key={hour} value={hour}>
                                {hour}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div className="flex-1">
                        <select
                          value={startTimeMinutes || ''}
                          onChange={(e) => setStartTimeMinutes(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        >
                          <option value="">Minute</option>
                          <option value="0">00</option>
                          <option value="15">15</option>
                          <option value="30">30</option>
                          <option value="45">45</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <select
                          value={startTimePeriod || 'AM'}
                          onChange={(e) => setStartTimePeriod(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration *</label>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <input
                          type="number"
                          value={durationHours || ''}
                          onChange={(e) => setDurationHours(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center"
                          min="0"
                          required
                        />
                        <p className="text-xs text-gray-500 text-center mt-1">Hours</p>
                      </div>
                      <div className="text-2xl text-gray-400 font-bold">:</div>
                      <div className="flex-1">
                        <input
                          type="number"
                          value={durationMinutes || ''}
                          onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center"
                          min="0"
                          max="59"
                          required
                        />
                        <p className="text-xs text-gray-500 text-center mt-1">Minutes</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-2">Quick presets:</p>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => { setDurationHours(1); setDurationMinutes(0); }}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
                        >
                          1h
                        </button>
                        <button
                          type="button"
                          onClick={() => { setDurationHours(1); setDurationMinutes(30); }}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
                        >
                          1.5h
                        </button>
                        <button
                          type="button"
                          onClick={() => { setDurationHours(2); setDurationMinutes(0); }}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
                        >
                          2h
                        </button>
                        <button
                          type="button"
                          onClick={() => { setDurationHours(3); setDurationMinutes(0); }}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
                        >
                          3h
                        </button>
                      </div>
                    </div>
                  </div>
                </div>


                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateExam(false)}
                    className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium shadow-md hover:shadow-lg"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      'Create Exam'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Exam Monitoring */}
      {showMonitoring && monitoringExam && (
        <ErrorBoundary>
          <ExamMonitoring 
            exam={monitoringExam} 
            onClose={handleCloseMonitoring} 
          />
        </ErrorBoundary>
      )}

      {/* Edit Exam Modal */}
      {showEditExam && editingExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit Exam</h2>
                  <p className="text-sm text-gray-600 mt-1">Update the exam details</p>
                </div>
                <button
                  onClick={() => setShowEditExam(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateExam} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Title</label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Mathematics Mid-term Exam"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                  <select
                    value={editFormData.subject}
                    onChange={(e) => setEditFormData({...editFormData, subject: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                    required
                  >
                    <option value="">Select a subject</option>
                    {availableSubjects.length > 0 ? (
                      availableSubjects.map((subject) => (
                        <option key={subject._id} value={subject.name}>
                          {subject.code ? `${subject.code} - ${subject.name}` : subject.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No subjects available</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class/Group *</label>
                  <select
                    value={editFormData.class}
                    onChange={(e) => setEditFormData({...editFormData, class: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                    required
                  >
                    <option value="">Select a class/group</option>
                    {availableClasses.map((classItem) => (
                      <option key={classItem._id} value={classItem.className || classItem.classCode}>
                        {classItem.className} ({classItem.classCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <input
                    type="text"
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({...editFormData, department: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Computer Science"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Type</label>
                  <select
                    value={editFormData.examType}
                    onChange={(e) => setEditFormData({...editFormData, examType: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    <option value="mcq">Multiple Choice Questions (MCQ)</option>
                    <option value="subjective">Subjective Questions</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Questions</label>
                    <input
                      type="number"
                      value={editFormData.totalQuestions}
                      onChange={(e) => setEditFormData({...editFormData, totalQuestions: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Marks per Question</label>
                    <input
                      type="number"
                      value={editFormData.marksPerQuestion}
                      onChange={(e) => setEditFormData({...editFormData, marksPerQuestion: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Marks</label>
                    <input
                      type="number"
                      value={editFormData.totalMarks}
                      onChange={(e) => setEditFormData({...editFormData, totalMarks: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date *</label>
                    <input
                      type="date"
                      value={editFormData.scheduledDate}
                      onChange={(e) => setEditFormData({...editFormData, scheduledDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                    <input
                      type="time"
                      value={editFormData.startTime}
                      onChange={(e) => setEditFormData({...editFormData, startTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes) *</label>
                  <input
                    type="number"
                    value={editFormData.duration}
                    onChange={(e) => setEditFormData({...editFormData, duration: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowEditExam(false)}
                    className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium shadow-md hover:shadow-lg"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </span>
                    ) : (
                      'Update Exam'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Question Bank Modal */}
      {showAssignQuestionBank && selectedExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Assign Question Bank to {selectedExam.title}</h2>
                <button
                  onClick={() => {
                    setShowAssignQuestionBank(false);
                    setSelectedExam(null);
                    setSelectedQuestionBank(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Available Question Banks</h3>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    <span className="ml-2 text-gray-600">Loading question banks...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                      <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Question Banks</h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                      onClick={() => loadAvailableQuestionBanks(selectedExam)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Try Again
                    </button>
                  </div>
                ) : availableQuestionBanks.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Question Banks Available</h3>
                    <p className="text-gray-600 mb-4">Create question banks in the Question Bank module first.</p>
                    <button
                      onClick={() => {
                        setShowAssignQuestionBank(false);
                        // Navigate to question bank management
                        window.location.href = '/dashboard/question-bank';
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Go to Question Bank Management
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {availableQuestionBanks.map((questionBank) => (
                    <div
                      key={questionBank._id}
                      className={`p-4 border rounded-lg cursor-pointer ${
                        selectedQuestionBank?._id === questionBank._id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedQuestionBank(questionBank)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900 mb-2">{questionBank.name}</h4>
                          {questionBank.description && (
                            <p className="text-sm text-gray-600 mb-3">{questionBank.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <BookOpen className="w-4 h-4 mr-1" />
                              {questionBank.subject} - {questionBank.class}
                            </span>
                            <span className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {questionBank.totalQuestions} questions
                            </span>
                            <span className="flex items-center">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {questionBank.totalMarks} total marks
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            {Object.entries(questionBank.questionsByType || {}).map(([type, count]) => (
                              count > 0 && (
                                <span key={type} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {type}: {count}
                                </span>
                              )
                            ))}
                          </div>
                        </div>
                        {selectedQuestionBank?._id === questionBank._id && (
                          <CheckCircle className="w-6 h-6 text-purple-600" />
                        )}
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </div>

              {selectedQuestionBank && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-purple-900 mb-2">Selected Question Bank</h4>
                  <p className="text-purple-800">{selectedQuestionBank.name}</p>
                  <p className="text-sm text-purple-700">
                    {selectedQuestionBank.totalQuestions} questions • {selectedQuestionBank.totalMarks} total marks
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  onClick={() => {
                    setShowAssignQuestionBank(false);
                    setSelectedExam(null);
                    setSelectedQuestionBank(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveQuestionBankToExam}
                  disabled={loading || !selectedQuestionBank}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Assigning...' : 'Assign Question Bank'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Teachers Modal */}
      {showAssignTeachers && selectedExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Assign Teachers to {selectedExam.title}</h2>
                <button
                  onClick={() => {
                    setShowAssignTeachers(false);
                    setSelectedExam(null);
                    setSelectedTeachers([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Available Teachers</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableTeachers.map((teacher) => {
                    const isSelected = selectedTeachers.includes(teacher._id || teacher.id);
                    return (
                      <div
                        key={teacher._id || teacher.id}
                        className={`p-4 border rounded-lg cursor-pointer ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTeachers(selectedTeachers.filter(id => id !== (teacher._id || teacher.id)));
                          } else {
                            setSelectedTeachers([...selectedTeachers, teacher._id || teacher.id]);
                          }
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center flex-1">
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                              <User className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-medium text-gray-900 mb-1">
                                {teacher.firstName} {teacher.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">{teacher.email}</p>
                              {teacher.department && (
                                <p className="text-sm text-gray-500 mt-1">Department: {teacher.department}</p>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-6 h-6 text-purple-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedTeachers.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-purple-900 mb-2">Selected Teachers ({selectedTeachers.length})</h4>
                  <p className="text-sm text-purple-700">
                    {selectedTeachers.map(id => {
                      const teacher = availableTeachers.find(t => (t._id || t.id) === id);
                      return teacher ? `${teacher.firstName} ${teacher.lastName}` : '';
                    }).filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  onClick={() => {
                    setShowAssignTeachers(false);
                    setSelectedExam(null);
                    setSelectedTeachers([]);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTeachersToExam}
                  disabled={loading || selectedTeachers.length === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Assigning...' : 'Assign Teachers'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List Students Modal */}
      {showListStudents && selectedExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Students in {selectedExam.class}</h2>
                  <p className="text-sm text-gray-600 mt-1">Exam: {selectedExam.title}</p>
                </div>
                <button
                  onClick={() => {
                    setShowListStudents(false);
                    setSelectedExam(null);
                    setExamStudents([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {studentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  <span className="ml-2 text-gray-600">Loading students...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Students</h3>
                  <p className="text-sm text-red-600 mb-4">{error}</p>
                  <p className="text-xs text-gray-500">Please contact your administrator for assistance.</p>
                </div>
              ) : examStudents.length > 0 ? (
                <>
                  {/* Summary Card */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 mb-4 border border-purple-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-purple-900">Class: {selectedExam.class}</h3>
                        <p className="text-xs text-purple-700 mt-0.5">
                          {examStudents.length} student{examStudents.length !== 1 ? 's' : ''} enrolled
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-700" />
                      </div>
                    </div>
                  </div>

                  {/* Student List */}
                  <div className="space-y-2">
                    {examStudents.map((student, index) => (
                      <div
                        key={student._id || student.id || index}
                        className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all"
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center flex-shrink-0 mr-3">
                          <span className="text-white text-sm font-semibold">
                            {(student.firstName || student.profile?.firstName || student.email || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900">
                            {student.firstName || student.profile?.firstName} {student.lastName || student.profile?.lastName}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">{student.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">No Students Found</h3>
                  <p className="text-xs text-gray-500">
                    No students enrolled in <strong>{selectedExam.class}</strong>
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex-shrink-0 flex justify-end">
                <button
                  onClick={() => {
                    setShowListStudents(false);
                    setSelectedExam(null);
                    setExamStudents([]);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
        </div>
      )}

      {/* Exam Evaluator Modal */}
      {showEvaluator && currentExam && (
        <ExamEvaluator
          exam={currentExam}
          onClose={handleCloseEvaluator}
          onExamStart={handleExamStart}
          onExamEnd={(examId) => handleExamStatusChange(examId, 'completed')}
          timeRemaining={timeRemaining[currentExam.id] || 0}
          isTimerRunning={examTimers[currentExam.id] ? true : false}
        />
      )}
    </div>
  );
};

export default ExamManagement;