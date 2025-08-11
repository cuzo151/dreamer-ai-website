describe('Authentication E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('User Registration', () => {
    it('should register a new user successfully', () => {
      // Navigate to registration
      cy.get('[data-testid="auth-button"]').click();
      cy.get('[data-testid="switch-to-register"]').click();

      // Fill registration form
      cy.fillForm({
        firstName: 'Test',
        lastName: 'User',
        email: `test${Date.now()}@example.com`,
        password: 'Test@1234',
        confirmPassword: 'Test@1234',
        company: 'Test Company'
      });

      // Submit form
      cy.submitForm();

      // Verify success message
      cy.shouldShowSuccessMessage('Registration successful. Please check your email');
      
      // Verify redirect to login
      cy.get('[data-testid="login-form"]').should('be.visible');
    });

    it('should show validation errors for invalid inputs', () => {
      cy.get('[data-testid="auth-button"]').click();
      cy.get('[data-testid="switch-to-register"]').click();

      // Submit empty form
      cy.submitForm();

      // Check validation messages
      cy.get('[data-testid="firstName-error"]').should('contain', 'First name is required');
      cy.get('[data-testid="lastName-error"]').should('contain', 'Last name is required');
      cy.get('[data-testid="email-error"]').should('contain', 'Email is required');
      cy.get('[data-testid="password-error"]').should('contain', 'Password is required');
    });

    it('should prevent duplicate email registration', () => {
      const email = 'existing@example.com';

      // Mock API response for existing user
      cy.mockApiResponse('POST', 'auth/register', 
        { error: 'User already exists', code: 'USER_EXISTS' }, 
        409
      );

      cy.get('[data-testid="auth-button"]').click();
      cy.get('[data-testid="switch-to-register"]').click();

      cy.fillForm({
        firstName: 'Test',
        lastName: 'User',
        email,
        password: 'Test@1234',
        confirmPassword: 'Test@1234'
      });

      cy.submitForm();

      cy.shouldShowErrorMessage('User already exists');
    });

    it('should validate password strength', () => {
      cy.get('[data-testid="auth-button"]').click();
      cy.get('[data-testid="switch-to-register"]').click();

      // Test weak password
      cy.get('[name="password"]').type('weak');
      cy.get('[data-testid="password-strength"]').should('contain', 'Weak');

      // Test medium password
      cy.get('[name="password"]').clear().type('Test123');
      cy.get('[data-testid="password-strength"]').should('contain', 'Medium');

      // Test strong password
      cy.get('[name="password"]').clear().type('Test@1234');
      cy.get('[data-testid="password-strength"]').should('contain', 'Strong');
    });
  });

  describe('User Login', () => {
    it('should login successfully with valid credentials', () => {
      // Mock successful login response
      cy.mockApiResponse('POST', 'auth/login', {
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'client'
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      });

      cy.get('[data-testid="auth-button"]').click();

      cy.fillForm({
        email: 'test@example.com',
        password: 'Test@1234'
      });

      cy.submitForm();

      // Verify successful login
      cy.get('[data-testid="user-menu"]').should('be.visible');
      cy.get('[data-testid="user-menu"]').should('contain', 'Test User');
      
      // Verify tokens stored
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.equal('mock-access-token');
        expect(win.localStorage.getItem('refreshToken')).to.equal('mock-refresh-token');
      });
    });

    it('should show error for invalid credentials', () => {
      cy.mockApiResponse('POST', 'auth/login', 
        { error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }, 
        401
      );

      cy.get('[data-testid="auth-button"]').click();

      cy.fillForm({
        email: 'test@example.com',
        password: 'WrongPassword'
      });

      cy.submitForm();

      cy.shouldShowErrorMessage('Invalid credentials');
    });

    it('should handle unverified account', () => {
      cy.mockApiResponse('POST', 'auth/login', 
        { error: 'Account is not active. Please verify your email.', code: 'ACCOUNT_INACTIVE' }, 
        403
      );

      cy.get('[data-testid="auth-button"]').click();

      cy.fillForm({
        email: 'unverified@example.com',
        password: 'Test@1234'
      });

      cy.submitForm();

      cy.shouldShowErrorMessage('Please verify your email');
      cy.get('[data-testid="resend-verification"]').should('be.visible');
    });

    it('should handle MFA requirement', () => {
      cy.mockApiResponse('POST', 'auth/login', {
        requiresMfa: true,
        mfaToken: 'mfa-token'
      });

      cy.get('[data-testid="auth-button"]').click();

      cy.fillForm({
        email: 'mfa@example.com',
        password: 'Test@1234'
      });

      cy.submitForm();

      // Should show MFA input
      cy.get('[data-testid="mfa-form"]').should('be.visible');
      cy.get('[data-testid="mfa-code-input"]').should('be.visible');
    });
  });

  describe('Password Reset', () => {
    it('should request password reset', () => {
      cy.mockApiResponse('POST', 'auth/request-password-reset', {
        message: 'If an account exists with this email, you will receive password reset instructions.'
      });

      cy.get('[data-testid="auth-button"]').click();
      cy.get('[data-testid="forgot-password"]').click();

      cy.get('[name="email"]').type('test@example.com');
      cy.get('[data-testid="reset-password-button"]').click();

      cy.shouldShowSuccessMessage('password reset instructions');
    });

    it('should reset password with valid token', () => {
      const resetToken = 'valid-reset-token';

      cy.mockApiResponse('POST', 'auth/reset-password', {
        message: 'Password reset successful. Please login with your new password.'
      });

      cy.visit(`/reset-password?token=${resetToken}`);

      cy.fillForm({
        newPassword: 'NewPass@1234',
        confirmPassword: 'NewPass@1234'
      });

      cy.submitForm();

      cy.shouldShowSuccessMessage('Password reset successful');
      
      // Should redirect to login
      cy.url().should('include', '/login');
    });
  });

  describe('Logout', () => {
    it('should logout successfully', () => {
      // Login first
      cy.login('test@example.com', 'Test@1234');
      cy.visit('/');

      // Verify logged in
      cy.get('[data-testid="user-menu"]').should('be.visible');

      // Logout
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();

      // Verify logged out
      cy.get('[data-testid="auth-button"]').should('be.visible');
      
      // Verify tokens removed
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.be.null;
        expect(win.localStorage.getItem('refreshToken')).to.be.null;
      });
    });
  });

  describe('Session Management', () => {
    it('should refresh token automatically', () => {
      // Mock expired token scenario
      cy.mockApiResponse('GET', 'user/profile', 
        { error: 'Token expired' }, 
        401
      );

      cy.mockApiResponse('POST', 'auth/refresh', {
        accessToken: 'new-access-token'
      });

      cy.mockApiResponse('GET', 'user/profile', {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      });

      // Login with soon-to-expire token
      cy.login('test@example.com', 'Test@1234');
      cy.visit('/dashboard');

      // Token should be refreshed automatically
      cy.wait('@mockPOSTauthrefresh');
      
      // Verify new token is stored
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.equal('new-access-token');
      });
    });

    it('should redirect to login on session expiry', () => {
      // Mock all requests to return 401
      cy.intercept('**/api/**', { statusCode: 401 });

      cy.visit('/dashboard');

      // Should redirect to login
      cy.url().should('include', '/login');
      cy.shouldShowErrorMessage('Session expired. Please login again.');
    });
  });

  describe('Responsive Authentication', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-x');

      cy.get('[data-testid="mobile-menu-button"]').click();
      cy.get('[data-testid="mobile-auth-button"]').click();

      cy.fillForm({
        email: 'mobile@example.com',
        password: 'Test@1234'
      });

      cy.submitForm();

      // Verify mobile menu updates
      cy.get('[data-testid="mobile-menu-button"]').click();
      cy.get('[data-testid="mobile-user-info"]').should('be.visible');
    });
  });

  describe('Security Features', () => {
    it('should implement rate limiting', () => {
      cy.mockApiResponse('POST', 'auth/login', 
        { error: 'Too many requests. Please try again later.', code: 'RATE_LIMIT' }, 
        429
      );

      // Attempt multiple logins
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="auth-button"]').click();
        cy.fillForm({
          email: 'test@example.com',
          password: 'wrong'
        });
        cy.submitForm();
        cy.get('[data-testid="close-modal"]').click();
      }

      cy.shouldShowErrorMessage('Too many requests');
    });

    it('should clear sensitive data on logout', () => {
      cy.login('test@example.com', 'Test@1234');
      cy.visit('/');

      // Store some sensitive data
      cy.window().then((win) => {
        win.sessionStorage.setItem('sensitive', 'data');
      });

      // Logout
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();

      // Verify all storage is cleared
      cy.window().then((win) => {
        expect(win.localStorage.length).to.equal(0);
        expect(win.sessionStorage.length).to.equal(0);
      });
    });
  });
});