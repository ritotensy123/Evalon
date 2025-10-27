// Test script to manually mark exam as expired
const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://ritotensy:redriders@evalon.u8jqfbo.mongodb.net/?retryWrites=true&w=majority&appName=Evalon');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Exam Schema (simplified)
const examSchema = new mongoose.Schema({
  title: String,
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled', 'expired'],
    default: 'draft'
  },
  scheduledDate: String,
  startTime: String,
  organizationId: mongoose.Schema.Types.ObjectId
});

const Exam = mongoose.model('Exam', examSchema);

const markExamAsExpired = async () => {
  try {
    // Find the exam with title "Series II"
    const exam = await Exam.findOne({ title: 'Series II' });
    
    if (!exam) {
      console.log('❌ Exam "Series II" not found');
      return;
    }
    
    console.log('📋 Found exam:', {
      id: exam._id,
      title: exam.title,
      currentStatus: exam.status,
      scheduledDate: exam.scheduledDate,
      startTime: exam.startTime
    });
    
    // Mark as expired
    exam.status = 'expired';
    await exam.save();
    
    console.log('✅ Exam marked as expired successfully!');
    console.log('🔄 New status:', exam.status);
    
  } catch (error) {
    console.error('❌ Error marking exam as expired:', error);
  }
};

const main = async () => {
  await connectDB();
  await markExamAsExpired();
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
};

main();

