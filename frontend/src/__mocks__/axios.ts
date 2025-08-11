export default {
  post: jest.fn(() => Promise.resolve({ 
    data: { 
      success: true,
      analysis: 'Sample analysis result',
      summary: 'Document processed successfully'
    } 
  })),
  get: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  create: jest.fn().mockReturnThis(),
  defaults: {
    adapter: {}
  },
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn()
    },
    response: {
      use: jest.fn(),
      eject: jest.fn()
    }
  }
};