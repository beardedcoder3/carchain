// backend/reports/reports.js - UPDATED VERSION with proper image handling
const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

// GET all reports
 router.get('/', async (req, res) => {
  try {
    console.log('🔍 Fetching all reports...');
    
    const reports = await Report.find()
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`✅ Database query successful. Found ${reports.length} reports`);
    
    // Log image status for each report
    reports.forEach((report, index) => {
      if (report.vehicleImage) {
        console.log(`🖼️ Report ${index + 1} (${report._id}) has image: ${report.vehicleImage.length} chars`);
      } else {
        console.log(`📷 Report ${index + 1} (${report._id}) has no image`);
      }
    });
    
    // Simply return the reports (empty array if no reports)
    res.json(reports);
    
  } catch (error) {
    console.error('❌ Error fetching reports:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Error fetching reports', 
      error: error.message 
    });
  }
});
// POST create new report
router.post('/', async (req, res) => {
  try {
    console.log('📝 Received POST request to create report');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Customer Name:', req.body.customerName);
    console.log('Make/Model:', req.body.make, req.body.model);
    console.log('Overall Rating:', req.body.overallRating);
    
    // ✅ ENHANCED IMAGE LOGGING
    if (req.body.vehicleImage) {
      console.log('🖼️ ===== IMAGE DATA RECEIVED =====');
      console.log('🖼️ Image length:', req.body.vehicleImage.length, 'characters');
      console.log('🖼️ Image starts with:', req.body.vehicleImage.substring(0, 50));
      console.log('🖼️ Is valid data URL:', req.body.vehicleImage.startsWith('data:image/'));
      console.log('🖼️ ================================');
    } else {
      console.log('📷 No vehicleImage field in request body');
    }
    
    // Validate required fields
    const requiredFields = ['customerName', 'make', 'model', 'year', 'location', 'inspector'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return res.status(400).json({
        message: 'Missing required fields',
        missingFields: missingFields
      });
    }
    
    // Create new report with explicit vehicleImage handling
    const reportData = {
      ...req.body,
      vehicleImage: req.body.vehicleImage || null, // ✅ EXPLICIT IMAGE FIELD
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('💾 Creating report with image:', reportData.vehicleImage ? 'YES' : 'NO');
    
    const report = new Report(reportData);
    const savedReport = await report.save();
    
    console.log('✅ Report saved successfully with ID:', savedReport._id);
    console.log('✅ Saved report customer:', savedReport.customerName);
    console.log('✅ Saved report has image:', savedReport.vehicleImage ? 'YES' : 'NO');
    
    if (savedReport.vehicleImage) {
      console.log('🖼️ Saved image length:', savedReport.vehicleImage.length);
    }
    
    res.status(201).json(savedReport);
  } catch (error) {
    console.error('❌ Error creating report:', error);
    console.error('Error details:', error.message);
    console.error('Validation errors:', error.errors);
    res.status(400).json({ 
      message: 'Error creating report', 
      error: error.message,
      details: error.errors
    });
  }
});

// GET single report by ID
router.get('/:id', async (req, res) => {
  try {
    console.log('🔍 Fetching report with ID:', req.params.id);
    
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      console.log('❌ Report not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Report not found' });
    }
    
    console.log('✅ Found report:', report._id);
    console.log('🖼️ Report has image:', report.vehicleImage ? 'YES' : 'NO');
    
    if (report.vehicleImage) {
      console.log('🖼️ Image length:', report.vehicleImage.length);
    }
    
    res.json(report);
  } catch (error) {
    console.error('❌ Error fetching report:', error);
    res.status(500).json({ 
      message: 'Error fetching report', 
      error: error.message 
    });
  }
});

// PUT update existing report
router.put('/:id', async (req, res) => {
  try {
    console.log('📝 Updating report with ID:', req.params.id);
    
    // Log image info for updates
    if (req.body.vehicleImage) {
      console.log('🖼️ Update includes new image, length:', req.body.vehicleImage.length);
    }
    
    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!updatedReport) {
      console.log('❌ Report not found for update:', req.params.id);
      return res.status(404).json({ message: 'Report not found' });
    }
    
    console.log('✅ Report updated successfully:', updatedReport._id);
    console.log('🖼️ Updated report has image:', updatedReport.vehicleImage ? 'YES' : 'NO');
    
    res.json(updatedReport);
  } catch (error) {
    console.error('❌ Error updating report:', error);
    res.status(400).json({ 
      message: 'Error updating report', 
      error: error.message 
    });
  }
});

// DELETE report
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ Deleting report with ID:', req.params.id);
    
    const deletedReport = await Report.findByIdAndDelete(req.params.id);
    
    if (!deletedReport) {
      console.log('❌ Report not found for deletion:', req.params.id);
      return res.status(404).json({ message: 'Report not found' });
    }
    
    console.log('✅ Report deleted successfully:', deletedReport._id);
    res.json({ 
      message: 'Report deleted successfully',
      deletedReport: deletedReport._id 
    });
  } catch (error) {
    console.error('❌ Error deleting report:', error);
    res.status(500).json({ 
      message: 'Error deleting report', 
      error: error.message 
    });
  }
});

// ✅ NEW DEBUG ROUTE - Test image handling
router.post('/test-image', async (req, res) => {
  try {
    console.log('🧪 Testing image handling...');
    console.log('🖼️ Received image:', req.body.vehicleImage ? 'YES' : 'NO');
    
    if (req.body.vehicleImage) {
      console.log('🖼️ Image length:', req.body.vehicleImage.length);
      console.log('🖼️ Image format valid:', req.body.vehicleImage.startsWith('data:image/'));
    }
    
    // Try to save a test report with the image
    const testReport = new Report({
      customerName: 'Test Customer',
      make: 'Test',
      model: 'Test',
      year: 2023,
      registrationNo: 'TEST-123',
      chassisNo: 'TEST-CHASSIS',
      engineNo: 'TEST-ENGINE',
      location: 'Test Location',
      inspector: 'Test Inspector',
      vehicleImage: req.body.vehicleImage,
      inspectionDate: new Date()
    });
    
    const saved = await testReport.save();
    console.log('✅ Test report saved with image:', saved.vehicleImage ? 'YES' : 'NO');
    
    // Clean up test report
    await Report.findByIdAndDelete(saved._id);
    console.log('🧹 Test report cleaned up');
    
    res.json({
      success: true,
      imageReceived: !!req.body.vehicleImage,
      imageLength: req.body.vehicleImage ? req.body.vehicleImage.length : 0,
      imageSaved: !!saved.vehicleImage
    });
    
  } catch (error) {
    console.error('❌ Image test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug route to check database status
router.get('/debug/status', async (req, res) => {
  try {
    const count = await Report.countDocuments();
    const reports = await Report.find()
      .select('customerName make model vehicleImage createdAt')
      .limit(5);
    
    // Count reports with images
    const reportsWithImages = await Report.countDocuments({ vehicleImage: { $ne: null } });
    
    res.json({
      message: 'Database status',
      totalReports: count,
      reportsWithImages: reportsWithImages,
      recentReports: reports.map(r => ({
        _id: r._id,
        customerName: r.customerName,
        make: r.make,
        model: r.model,
        hasImage: !!r.vehicleImage,
        imageLength: r.vehicleImage ? r.vehicleImage.length : 0,
        createdAt: r.createdAt
      })),
      databaseName: 'car2chain_inspections',
      collectionName: 'reports'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error checking database status',
      error: error.message
    });
  }
});

module.exports = router;