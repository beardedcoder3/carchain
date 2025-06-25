// backend/models/Report.js - CLEAN VERSION with vehicleImage field
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Car Details
  customerName: {
    type: String,
    required: true
  },
  engineCapacity: String,
  mileage: Number,
  fuelType: String,
  inspectionDate: {
    type: Date,
    required: true
  },
  chassisNo: {
    type: String,
    required: true
  },
  engineNo: {
    type: String,
    required: true
  },
  registrationNo: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  registeredCity: String,
  transmissionType: String,
  color: String,
  
  // Vehicle Information
  make: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  variant: String,
  year: {
    type: Number,
    required: true
  },
  customMake: String,
  customModel: String,
  customVariant: String,
  
  // ✅ IMPORTANT: Vehicle Image field for storing base64 images
  vehicleImage: {
    type: String, // Store as base64 string
    default: null
  },
  
  // Inspector
  inspector: {
    type: String,
    required: true
  },
  
  // Inspection Results
  inspectionResults: {
    type: Object,
    default: {}
  },
  
  // Ratings
  overallRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  categoryRatings: {
    type: Object,
    default: {}
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'failed'],
    default: 'pending'
  },
  
  // Comments
  comments: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
reportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Report', reportSchema);