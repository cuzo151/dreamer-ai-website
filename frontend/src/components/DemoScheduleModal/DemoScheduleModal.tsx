import React, { useState } from 'react';
import { XMarkIcon, CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { reportService, DemoRequest } from '../../services/reportService';
import LoadingAnimation from '../Animation/LoadingAnimation';

interface DemoScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DemoScheduleModal: React.FC<DemoScheduleModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<Partial<DemoRequest>>({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
    preferredDate: '',
    preferredTime: ''
  });
  
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingId, setBookingId] = useState<string>('');

  const handleInputChange = (field: keyof DemoRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validation = reportService.validateDemoRequest(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      const result = await reportService.scheduleDemo(formData as DemoRequest);
      
      if (result.success) {
        setSubmitted(true);
        setBookingId(result.bookingId || '');
        
        // Track conversion event
        if (typeof gtag !== 'undefined') {
          gtag('event', 'demo_scheduled', {
            event_category: 'conversion',
            event_label: 'dashboard_demo_request'
          });
        }
      } else {
        setErrors([result.message]);
      }
    } catch (error) {
      setErrors(['An unexpected error occurred. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setFormData({
      name: '',
      email: '',
      company: '',
      phone: '',
      message: '',
      preferredDate: '',
      preferredTime: ''
    });
    setErrors([]);
    setSubmitted(false);
    setBookingId('');
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={resetAndClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Schedule Your AI Demo
              </h3>
            </div>
            <button
              onClick={resetAndClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {submitted ? (
            <Card className="border-green-200">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CalendarDaysIcon className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-green-800">Demo Scheduled Successfully!</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">
                  Thank you for your interest in Dreamer AI Solutions. Your demo has been scheduled.
                </p>
                {bookingId && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <p className="text-sm text-gray-600 mb-1">Booking Confirmation ID:</p>
                    <p className="font-mono text-lg font-semibold text-blue-600">{bookingId}</p>
                  </div>
                )}
                <div className="space-y-2 text-sm text-gray-600 mb-6">
                  <p>• You'll receive a confirmation email within 10 minutes</p>
                  <p>• Our team will contact you within 24 hours to finalize details</p>
                  <p>• Demo duration: 30-45 minutes</p>
                </div>
                <Button onClick={resetAndClose} className="w-full">
                  Close
                </Button>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Display */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-red-800 font-medium mb-2">Please fix the following errors:</div>
                  <ul className="text-red-700 text-sm space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company *
                  </label>
                  <input
                    type="text"
                    value={formData.company || ''}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your Company LLC"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={formData.preferredDate || ''}
                    onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time
                  </label>
                  <select
                    value={formData.preferredTime || ''}
                    onChange={(e) => handleInputChange('preferredTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select time</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Message
                </label>
                <textarea
                  value={formData.message || ''}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us about your specific needs or questions..."
                />
              </div>

              {/* Demo Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <ClockIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">What to Expect</h4>
                    <ul className="text-blue-700 text-sm mt-1 space-y-1">
                      <li>• 30-45 minute personalized demonstration</li>
                      <li>• Live Q&A with our AI specialists</li>
                      <li>• Custom use case analysis for your business</li>
                      <li>• Implementation timeline and pricing discussion</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetAndClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingAnimation variant="spinner" size="small" />
                      <span className="ml-2">Scheduling...</span>
                    </>
                  ) : (
                    'Schedule Demo'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemoScheduleModal;